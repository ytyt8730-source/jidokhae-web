/**
 * 첫 모임 후 리마인드 Cron API
 * M6-Onboarding Phase 5
 *
 * 매일 오전 10시(KST) 실행
 * - 첫 정기모임 참여 후 3일/7일 된 미신청 회원 대상
 * - 14일 규칙: first_meeting_reminder_count >= 2이면 중단
 */

import { NextRequest, NextResponse } from 'next/server'
import { cronLogger } from '@/lib/logger'
import {
  getFirstMeetingReminderTargets,
  updateReminderCount,
  type FirstMeetingReminderTarget,
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
  day3: 'FIRST_MEETING_DAY3',
  day7: 'FIRST_MEETING_DAY7',
}

/**
 * 첫 모임 후 리마인드 알림 발송
 */
async function sendFirstMeetingReminder(target: FirstMeetingReminderTarget): Promise<boolean> {
  const templateCode = TEMPLATE_CODES[target.reminderType]

  // 변수 준비
  const variables: Record<string, string> = {
    이름: target.userName,
    모임명: target.firstMeetingTitle,
  }

  if (target.nextMeeting) {
    const meetingDate = new Date(target.nextMeeting.datetime)
    const formattedDate = format(meetingDate, 'M월 d일 EEEE a h시', { locale: ko })

    variables.다음모임일시 = formattedDate
    variables.신청인원 = String(target.nextMeeting.currentParticipants)
    variables.책제목 = target.nextMeeting.title
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
    cronLogger.info('first_meeting_reminder_sent', {
      userId: target.userId,
      phone: target.userPhone.slice(0, -4) + '****',
      type: target.reminderType,
      template: templateCode,
      messageId: result.messageId,
    })

    // 카운터 업데이트 (성공 시에만)
    await updateReminderCount(target.userId, 'first_meeting')
    return true
  } else {
    cronLogger.warn('first_meeting_reminder_send_failed', {
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
    logger.warn('cron_unauthorized', { path: '/api/cron/onboarding-first-meeting' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('first_meeting_reminder_cron_started')

  try {
    const targets = await getFirstMeetingReminderTargets()

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
          const success = await sendFirstMeetingReminder(target)
          return success
        } catch (error) {
          logger.error('first_meeting_reminder_send_error', {
            userId: target.userId,
            error: error instanceof Error ? error.message : 'Unknown',
          })
          return false
        }
      })
    )

    stats.sent = results.filter((r) => r).length
    stats.failed = results.filter((r) => !r).length

    timer.done('first_meeting_reminder_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'First meeting reminder cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('first_meeting_reminder_cron_error', {
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
