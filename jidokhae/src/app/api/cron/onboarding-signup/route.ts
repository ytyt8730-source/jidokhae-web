/**
 * 가입 후 리마인드 Cron API
 * M6-Onboarding Phase 4
 *
 * 매일 오전 10시(KST) 실행
 * - 가입 후 3일/7일 된 미신청 회원 대상
 * - 14일 규칙: signup_reminder_count >= 2이면 중단
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import {
  getSignupReminderTargets,
  updateReminderCount,
  logReminderNotification,
  type SignupReminderTarget,
} from '@/lib/onboarding/reminder'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const CRON_SECRET = process.env.CRON_SECRET

function verifyCronRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) {
    return true
  }

  return false
}

// 템플릿 코드
const TEMPLATE_CODES = {
  day3: 'SIGNUP_REMINDER_DAY3',
  day7: 'SIGNUP_REMINDER_DAY7',
}

/**
 * 가입 리마인드 알림 발송
 */
async function sendSignupReminder(target: SignupReminderTarget): Promise<boolean> {
  const supabase = await createServiceClient()
  const templateCode = TEMPLATE_CODES[target.reminderType]

  // 템플릿 조회
  const { data: template } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('code', templateCode)
    .eq('is_active', true)
    .single()

  if (!template) {
    cronLogger.warn('signup_reminder_template_not_found', { code: templateCode })
    return false
  }

  // 변수 치환
  let message = template.message_template
    .replace(/#{이름}/g, target.userName)

  if (target.nextMeeting) {
    const meetingDate = new Date(target.nextMeeting.datetime)
    const dayOfWeek = format(meetingDate, 'EEEE', { locale: ko })

    message = message
      .replace(/#{요일}/g, dayOfWeek)
      .replace(/#{지역}/g, target.nextMeeting.location || '경주/포항')
      .replace(/#{남은자리}/g, String(target.nextMeeting.remainingSpots))
      .replace(/#{책제목}/g, target.nextMeeting.title)
      .replace(/#{인기모임책제목}/g, target.nextMeeting.title)
      .replace(/#{인기모임신청수}/g, String(10 - target.nextMeeting.remainingSpots))
  }

  // TODO: 실제 Solapi 발송 구현
  // 현재는 로깅만 수행
  cronLogger.info('signup_reminder_sent', {
    userId: target.userId,
    phone: target.userPhone.slice(0, -4) + '****',
    type: target.reminderType,
    template: templateCode,
    messagePreview: message.slice(0, 50) + '...',
  })

  // 알림 로그 저장
  await logReminderNotification(
    target.userId,
    templateCode,
    target.userPhone,
    'sent',
    target.nextMeeting?.id
  )

  // 카운터 업데이트
  await updateReminderCount(target.userId, 'signup')

  return true
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', { path: '/api/cron/onboarding-signup' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('signup_reminder_cron_started')

  try {
    const targets = await getSignupReminderTargets()

    const stats = {
      total: targets.length,
      day3: targets.filter((t) => t.reminderType === 'day3').length,
      day7: targets.filter((t) => t.reminderType === 'day7').length,
      sent: 0,
      failed: 0,
    }

    // 병렬 발송
    const results = await Promise.all(
      targets.map(async (target) => {
        try {
          const success = await sendSignupReminder(target)
          return success
        } catch (error) {
          logger.error('signup_reminder_send_error', {
            userId: target.userId,
            error: error instanceof Error ? error.message : 'Unknown',
          })
          return false
        }
      })
    )

    stats.sent = results.filter((r) => r).length
    stats.failed = results.filter((r) => !r).length

    timer.done('signup_reminder_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Signup reminder cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('signup_reminder_cron_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
