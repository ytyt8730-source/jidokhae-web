/**
 * 모임 리마인드 로직
 * M3 알림시스템 - Phase 2
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import {
  sendAndLogNotification,
  isAlreadySent,
  NOTIFICATION_TEMPLATES,
  type ReminderTarget,
} from '@/lib/notification'
import {
  addDays,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns'
import { ko } from 'date-fns/locale'

// 한국 시간대 오프셋 (UTC+9)
const KST_OFFSET = 9 * 60 * 60 * 1000

/**
 * 현재 시각을 한국 시간으로 변환
 */
function toKST(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET)
}

/**
 * 한국 시간 기준 날짜의 시작/끝 (UTC로 반환)
 */
function getKSTDayRange(date: Date): { start: Date; end: Date } {
  const kstDate = toKST(date)
  const startKST = startOfDay(kstDate)
  const endKST = endOfDay(kstDate)

  return {
    start: new Date(startKST.getTime() - KST_OFFSET),
    end: new Date(endKST.getTime() - KST_OFFSET),
  }
}

/**
 * N일 후 모임이 있는 확정 신청자 조회
 */
export async function getReminderTargets(daysBeforeMeeting: number): Promise<ReminderTarget[]> {
  const supabase = await createServiceClient()
  const logger = cronLogger

  // 대상 날짜 계산 (한국 시간 기준)
  const targetDate = addDays(new Date(), daysBeforeMeeting)
  const { start, end } = getKSTDayRange(targetDate)

  logger.info('get_reminder_targets', {
    daysBeforeMeeting,
    targetDateStart: start.toISOString(),
    targetDateEnd: end.toISOString(),
  })

  // 해당 날짜에 모임이 있고, confirmed 상태인 신청 조회
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      meeting_id,
      users (
        id,
        name,
        phone
      ),
      meetings (
        id,
        title,
        datetime,
        location,
        fee
      )
    `)
    .eq('status', 'confirmed')
    .gte('meetings.datetime', start.toISOString())
    .lt('meetings.datetime', end.toISOString())

  if (error) {
    logger.error('get_reminder_targets_error', { error: error.message })
    return []
  }

  if (!data || data.length === 0) {
    logger.info('no_reminder_targets', { daysBeforeMeeting })
    return []
  }

  // 타입 안전하게 변환
  const targets: ReminderTarget[] = []

  for (const reg of data) {
    // users와 meetings가 단일 객체인지 확인
    const user = reg.users as { id: string; name: string; phone: string | null } | null
    const meeting = reg.meetings as {
      id: string
      title: string
      datetime: string
      location: string
      fee: number
    } | null

    if (!user || !meeting || !user.phone) {
      continue
    }

    targets.push({
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDatetime: new Date(meeting.datetime),
      meetingLocation: meeting.location,
      meetingFee: meeting.fee,
    })
  }

  logger.info('reminder_targets_found', {
    daysBeforeMeeting,
    count: targets.length,
  })

  return targets
}

/**
 * 리마인드 타입에 따른 템플릿 코드 반환
 */
function getTemplateCode(daysBeforeMeeting: number): string {
  switch (daysBeforeMeeting) {
    case 3:
      return NOTIFICATION_TEMPLATES.REMINDER_3D
    case 1:
      return NOTIFICATION_TEMPLATES.REMINDER_1D
    case 0:
      return NOTIFICATION_TEMPLATES.REMINDER_TODAY
    default:
      return NOTIFICATION_TEMPLATES.REMINDER_3D
  }
}

/**
 * 날짜 포맷 (한국어)
 */
function formatMeetingDate(date: Date): string {
  return format(date, 'M월 d일 (E)', { locale: ko })
}

/**
 * 시간 포맷
 */
function formatMeetingTime(date: Date): string {
  return format(date, 'HH:mm')
}

/**
 * 리마인드 발송 (단일 대상)
 */
export async function sendReminder(
  target: ReminderTarget,
  daysBeforeMeeting: number
): Promise<boolean> {
  const templateCode = getTemplateCode(daysBeforeMeeting)

  // 중복 발송 체크
  const alreadySent = await isAlreadySent(
    target.userId,
    target.meetingId,
    templateCode
  )

  if (alreadySent) {
    cronLogger.info('reminder_already_sent', {
      userId: target.userId,
      meetingId: target.meetingId,
      templateCode,
    })
    return false
  }

  // 알림 발송
  const result = await sendAndLogNotification({
    templateCode,
    phone: target.phone,
    variables: {
      회원명: target.userName,
      모임명: target.meetingTitle,
      날짜: formatMeetingDate(target.meetingDatetime),
      시간: formatMeetingTime(target.meetingDatetime),
      장소: target.meetingLocation,
      참가비: target.meetingFee.toLocaleString(),
    },
    userId: target.userId,
    meetingId: target.meetingId,
  })

  return result.success
}

/**
 * 리마인드 발송 (전체 대상)
 * 3일 전, 1일 전, 당일 모두 처리
 */
export async function processAllReminders(): Promise<{
  total: number
  sent: number
  skipped: number
  failed: number
}> {
  const logger = cronLogger
  const timer = logger.startTimer()

  const stats = {
    total: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  // 3일 전, 1일 전, 당일 순서로 처리
  const reminderDays = [3, 1, 0]

  for (const days of reminderDays) {
    logger.info('processing_reminder_batch', { daysBeforeMeeting: days })

    const targets = await getReminderTargets(days)
    stats.total += targets.length

    for (const target of targets) {
      const templateCode = getTemplateCode(days)

      // 중복 체크
      const alreadySent = await isAlreadySent(
        target.userId,
        target.meetingId,
        templateCode
      )

      if (alreadySent) {
        stats.skipped++
        continue
      }

      // 발송
      const success = await sendReminder(target, days)

      if (success) {
        stats.sent++
      } else {
        stats.failed++
      }
    }
  }

  timer.done('reminder_batch_complete', stats)

  return stats
}

/**
 * 특정 모임의 리마인드 발송 (수동 트리거용)
 */
export async function sendMeetingReminder(
  meetingId: string,
  daysBeforeMeeting: number
): Promise<{
  total: number
  sent: number
  failed: number
}> {
  const supabase = await createServiceClient()
  const logger = cronLogger

  // 해당 모임의 확정 신청자 조회
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      meeting_id,
      users (
        id,
        name,
        phone
      ),
      meetings (
        id,
        title,
        datetime,
        location,
        fee
      )
    `)
    .eq('meeting_id', meetingId)
    .eq('status', 'confirmed')

  if (error || !data) {
    logger.error('get_meeting_registrations_error', { error: error?.message })
    return { total: 0, sent: 0, failed: 0 }
  }

  const stats = { total: data.length, sent: 0, failed: 0 }

  for (const reg of data) {
    const user = reg.users as { id: string; name: string; phone: string | null } | null
    const meeting = reg.meetings as {
      id: string
      title: string
      datetime: string
      location: string
      fee: number
    } | null

    if (!user || !meeting || !user.phone) {
      stats.failed++
      continue
    }

    const target: ReminderTarget = {
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDatetime: new Date(meeting.datetime),
      meetingLocation: meeting.location,
      meetingFee: meeting.fee,
    }

    const success = await sendReminder(target, daysBeforeMeeting)

    if (success) {
      stats.sent++
    } else {
      stats.failed++
    }
  }

  return stats
}
