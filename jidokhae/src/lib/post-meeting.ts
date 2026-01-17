/**
 * 모임 종료 후 알림 로직
 * M4 소속감 - Phase 1
 *
 * 모임 종료 3일 후 "어떠셨어요?" 알림 발송
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import {
  sendAndLogNotification,
  isAlreadySent,
  NOTIFICATION_TEMPLATES,
} from '@/lib/notification'
import type { PostMeetingTarget } from '@/lib/notification/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const logger = cronLogger

/**
 * 모임 종료 3일 후 알림 대상자 조회
 * - 모임 종료 후 3일(72시간) 경과한 모임의 참가자
 * - 결제 완료(confirmed) 상태
 * - 아직 참여 완료 처리 안 된 사람
 */
export async function getPostMeetingTargets(): Promise<PostMeetingTarget[]> {
  const supabase = await createServiceClient()

  // 3일 전 = 지금 시각 - 72시간
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)
  // 4일 전 (하루 범위 내 모임만)
  const fourDaysAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      meeting_id,
      participation_status,
      users!registrations_user_id_fkey (
        id,
        name,
        phone
      ),
      meetings!registrations_meeting_id_fkey (
        id,
        title,
        datetime
      )
    `)
    .eq('status', 'confirmed')
    .is('participation_status', null)
    .lte('meetings.datetime', threeDaysAgo.toISOString())
    .gt('meetings.datetime', fourDaysAgo.toISOString())

  if (error) {
    logger.error('get_post_meeting_targets_error', { error: error.message })
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  const targets: PostMeetingTarget[] = []

  for (const registration of data) {
    const user = registration.users as unknown as { id: string; name: string; phone: string | null }
    const meeting = registration.meetings as unknown as { id: string; title: string; datetime: string }

    if (!user?.phone || !meeting) {
      continue
    }

    targets.push({
      registrationId: registration.id,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDatetime: new Date(meeting.datetime),
    })
  }

  return targets
}

/**
 * 단일 대상에게 모임 종료 후 알림 발송
 */
export async function sendPostMeetingNotification(
  target: PostMeetingTarget
): Promise<boolean> {
  // 중복 발송 체크
  const alreadySent = await isAlreadySent(
    target.userId,
    target.meetingId,
    NOTIFICATION_TEMPLATES.POST_MEETING
  )

  if (alreadySent) {
    logger.info('post_meeting_already_sent', {
      userId: target.userId,
      meetingId: target.meetingId,
    })
    return false
  }

  // 피드백 페이지 URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jidokhae.com'
  const feedbackUrl = `${baseUrl}/meetings/${target.meetingId}/feedback`

  // 날짜 포맷팅
  const meetingDate = format(target.meetingDatetime, 'M월 d일', { locale: ko })

  const result = await sendAndLogNotification({
    templateCode: NOTIFICATION_TEMPLATES.POST_MEETING,
    phone: target.phone,
    variables: {
      userName: target.userName,
      meetingTitle: target.meetingTitle,
      meetingDate,
      feedbackUrl,
    },
    userId: target.userId,
    meetingId: target.meetingId,
  })

  if (result.success) {
    logger.info('post_meeting_notification_sent', {
      userId: target.userId,
      meetingId: target.meetingId,
      meetingTitle: target.meetingTitle,
    })
  } else {
    logger.error('post_meeting_notification_failed', {
      userId: target.userId,
      meetingId: target.meetingId,
      error: result.error,
    })
  }

  return result.success
}

/**
 * 모든 대상에게 모임 종료 후 알림 발송
 */
export async function processPostMeetingNotifications(): Promise<{
  total: number
  sent: number
  skipped: number
  failed: number
}> {
  const targets = await getPostMeetingTargets()

  const stats = {
    total: targets.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  if (targets.length === 0) {
    logger.info('no_post_meeting_targets')
    return stats
  }

  logger.info('post_meeting_processing_start', { targetCount: targets.length })

  for (const target of targets) {
    try {
      const alreadySent = await isAlreadySent(
        target.userId,
        target.meetingId,
        NOTIFICATION_TEMPLATES.POST_MEETING
      )

      if (alreadySent) {
        stats.skipped++
        continue
      }

      const success = await sendPostMeetingNotification(target)
      if (success) {
        stats.sent++
      } else {
        stats.failed++
      }
    } catch (error) {
      logger.error('post_meeting_processing_error', {
        userId: target.userId,
        meetingId: target.meetingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      stats.failed++
    }
  }

  logger.info('post_meeting_processing_complete', stats)

  return stats
}
