/**
 * 대기자 알림 로직
 * M3 알림시스템 - Phase 3
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger, waitlistLogger } from '@/lib/logger'
import {
  sendAndLogNotification,
  NOTIFICATION_TEMPLATES,
  type WaitlistTarget,
} from '@/lib/notification'
import {
  differenceInDays,
  differenceInHours,
  addHours,
} from 'date-fns'

/**
 * 응답 대기 시간 계산
 * - 모임 3일 전 이전: 24시간
 * - 모임 3일 ~ 1일 전: 6시간
 * - 모임 1일 전 이후: 2시간
 */
export function getResponseDeadline(meetingDatetime: Date): Date {
  const now = new Date()
  const daysUntilMeeting = differenceInDays(meetingDatetime, now)

  if (daysUntilMeeting > 3) {
    return addHours(now, 24)
  } else if (daysUntilMeeting >= 1) {
    return addHours(now, 6)
  } else {
    return addHours(now, 2)
  }
}

/**
 * 응답 대기 시간 텍스트 반환
 */
export function getResponseTimeText(meetingDatetime: Date): string {
  const deadline = getResponseDeadline(meetingDatetime)
  const hoursLeft = differenceInHours(deadline, new Date())

  if (hoursLeft >= 24) {
    return '24시간'
  } else if (hoursLeft >= 6) {
    return '6시간'
  } else {
    return '2시간'
  }
}

/**
 * 1순위 대기자 조회
 */
export async function getFirstWaitlistTarget(
  meetingId: string
): Promise<WaitlistTarget | null> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('waitlists')
    .select(`
      id,
      user_id,
      meeting_id,
      position,
      users (
        id,
        name,
        phone
      ),
      meetings (
        id,
        title,
        datetime
      )
    `)
    .eq('meeting_id', meetingId)
    .eq('status', 'waiting')
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  const user = data.users as { id: string; name: string; phone: string | null } | null
  const meeting = data.meetings as { id: string; title: string; datetime: string } | null

  if (!user || !meeting || !user.phone) {
    return null
  }

  const meetingDatetime = new Date(meeting.datetime)
  const responseDeadline = getResponseDeadline(meetingDatetime)

  return {
    waitlistId: data.id,
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    meetingDatetime,
    position: data.position,
    responseDeadline,
  }
}

/**
 * 대기자에게 자리 발생 알림 발송
 */
export async function notifyWaitlistSpot(
  meetingId: string
): Promise<{ success: boolean; notifiedUserId?: string }> {
  const logger = waitlistLogger
  const supabase = await createServiceClient()

  // 1순위 대기자 조회
  const target = await getFirstWaitlistTarget(meetingId)

  if (!target) {
    logger.info('no_waitlist_target', { meetingId })
    return { success: false }
  }

  logger.info('notifying_waitlist', {
    meetingId,
    userId: target.userId,
    position: target.position,
  })

  // 알림 발송
  const result = await sendAndLogNotification({
    templateCode: NOTIFICATION_TEMPLATES.WAITLIST_SPOT,
    phone: target.phone,
    variables: {
      이름: target.userName,
      모임명: target.meetingTitle,
      응답시간: getResponseTimeText(target.meetingDatetime),
    },
    userId: target.userId,
    meetingId: target.meetingId,
  })

  if (!result.success) {
    logger.error('waitlist_notification_failed', {
      meetingId,
      userId: target.userId,
      error: result.error,
    })
    return { success: false }
  }

  // waitlists 상태 업데이트: notified + expires_at 설정
  const { error: updateError } = await supabase
    .from('waitlists')
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
      expires_at: target.responseDeadline.toISOString(),
    })
    .eq('id', target.waitlistId)

  if (updateError) {
    logger.error('waitlist_update_failed', {
      waitlistId: target.waitlistId,
      error: updateError.message,
    })
  }

  logger.info('waitlist_notified', {
    meetingId,
    userId: target.userId,
    expiresAt: target.responseDeadline.toISOString(),
  })

  return { success: true, notifiedUserId: target.userId }
}

/**
 * 응답 기한 만료된 대기자 처리
 * - expired 상태로 변경
 * - 다음 대기자에게 알림
 */
export async function processExpiredWaitlists(): Promise<{
  expired: number
  notified: number
}> {
  const logger = cronLogger
  const supabase = await createServiceClient()

  const stats = { expired: 0, notified: 0 }

  // 기한 만료된 notified 상태 대기자 조회
  const { data: expiredWaitlists, error } = await supabase
    .from('waitlists')
    .select(`
      id,
      user_id,
      meeting_id,
      position,
      users (
        id,
        name,
        phone
      ),
      meetings (
        id,
        title,
        status,
        current_participants,
        capacity
      )
    `)
    .eq('status', 'notified')
    .lt('expires_at', new Date().toISOString())

  if (error || !expiredWaitlists || expiredWaitlists.length === 0) {
    logger.info('no_expired_waitlists')
    return stats
  }

  logger.info('processing_expired_waitlists', { count: expiredWaitlists.length })

  for (const waitlist of expiredWaitlists) {
    // expired 상태로 변경
    await supabase
      .from('waitlists')
      .update({ status: 'expired' })
      .eq('id', waitlist.id)

    stats.expired++

    // 만료 당사자에게 알림 발송
    const user = waitlist.users as { id: string; name: string; phone: string | null } | null
    const meeting = waitlist.meetings as {
      id: string
      title: string
      status: string
      current_participants: number
      capacity: number
    } | null

    if (user?.phone && meeting) {
      await sendAndLogNotification({
        templateCode: NOTIFICATION_TEMPLATES.WAITLIST_EXPIRED,
        phone: user.phone,
        variables: {
          이름: user.name,
          모임명: meeting.title,
        },
        userId: user.id,
        meetingId: meeting.id,
      })
    }

    if (
      meeting &&
      meeting.status === 'open' &&
      meeting.current_participants < meeting.capacity
    ) {
      // 다음 대기자에게 알림
      const result = await notifyWaitlistSpot(waitlist.meeting_id)
      if (result.success) {
        stats.notified++
      }
    }
  }

  logger.info('expired_waitlists_processed', stats)

  return stats
}

/**
 * 모임 취소 시 대기자 알림 트리거
 * registrations/cancel API에서 호출
 */
export async function triggerWaitlistNotification(meetingId: string): Promise<void> {
  const logger = waitlistLogger
  const supabase = await createServiceClient()

  // 모임 정보 조회
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('id, status, current_participants, capacity')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    logger.error('meeting_not_found_for_waitlist', { meetingId })
    return
  }

  // 자리가 있는지 확인
  if (meeting.status !== 'open' || meeting.current_participants >= meeting.capacity) {
    logger.info('no_spot_available', {
      meetingId,
      status: meeting.status,
      current: meeting.current_participants,
      capacity: meeting.capacity,
    })
    return
  }

  // 대기자 알림
  await notifyWaitlistSpot(meetingId)
}

/**
 * 대기자가 결제 완료 시 호출
 * - waitlists에서 삭제 (또는 converted 상태로)
 * - 뒤의 대기자들 순번 조정
 */
export async function convertWaitlistToRegistration(
  userId: string,
  meetingId: string
): Promise<void> {
  const logger = waitlistLogger
  const supabase = await createServiceClient()

  // 대기 정보 조회
  const { data: waitlist, error: getError } = await supabase
    .from('waitlists')
    .select('id, position')
    .eq('user_id', userId)
    .eq('meeting_id', meetingId)
    .in('status', ['waiting', 'notified'])
    .single()

  if (getError || !waitlist) {
    logger.warn('waitlist_not_found_for_conversion', { userId, meetingId })
    return
  }

  // converted 상태로 변경
  await supabase
    .from('waitlists')
    .update({ status: 'converted' })
    .eq('id', waitlist.id)

  // 뒤의 대기자들 순번 조정
  await supabase.rpc('adjust_waitlist_positions', {
    p_meeting_id: meetingId,
    p_removed_position: waitlist.position,
  })

  logger.info('waitlist_converted', {
    userId,
    meetingId,
    waitlistId: waitlist.id,
  })
}
