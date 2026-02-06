/**
 * 가입 후 리마인드 Cron API
 * M6-Onboarding Phase 4
 *
 * 매일 오전 10시(KST) 실행
 * - 가입 후 3일/7일 된 미신청 회원 대상
 * - 14일 규칙: signup_reminder_count >= 2이면 중단
 */

import { NextRequest, NextResponse } from 'next/server'
import { cronLogger } from '@/lib/logger'
import {
  getSignupReminderTargets,
  updateReminderCount,
  type SignupReminderTarget,
} from '@/lib/onboarding/reminder'
import { sendAndLogNotification } from '@/lib/notification'
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
  const templateCode = TEMPLATE_CODES[target.reminderType]

  // 변수 준비
  const variables: Record<string, string> = {
    이름: target.userName,
  }

  if (target.nextMeeting) {
    const meetingDate = new Date(target.nextMeeting.datetime)
    const dayOfWeek = format(meetingDate, 'EEEE', { locale: ko })

    variables.요일 = dayOfWeek
    variables.지역 = target.nextMeeting.location || '경주/포항'
    variables.남은자리 = String(target.nextMeeting.remainingSpots)
    variables.책제목 = target.nextMeeting.title
    variables.인기모임책제목 = target.nextMeeting.title
    variables.인기모임신청수 = String(10 - target.nextMeeting.remainingSpots)
  }

  // Solapi 알림 발송 (sendAndLogNotification이 로그도 자동 기록)
  const result = await sendAndLogNotification({
    templateCode,
    phone: target.userPhone,
    variables,
    userId: target.userId,
    meetingId: target.nextMeeting?.id,
  })

  if (result.success) {
    cronLogger.info('signup_reminder_sent', {
      userId: target.userId,
      phone: target.userPhone.slice(0, -4) + '****',
      type: target.reminderType,
      template: templateCode,
      messageId: result.messageId,
    })

    // 카운터 업데이트 (성공 시에만)
    await updateReminderCount(target.userId, 'signup')
    return true
  } else {
    cronLogger.warn('signup_reminder_send_failed', {
      userId: target.userId,
      type: target.reminderType,
      error: result.error,
    })
    return false
  }
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
