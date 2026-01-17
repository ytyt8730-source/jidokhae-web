/**
 * 7일 미응답 자동 완료 로직
 * M4 소속감 - Phase 1
 *
 * 모임 종료 후 10일(3일 알림 + 7일 대기) 경과 시 자동 참여 완료
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'

const logger = cronLogger

interface AutoCompleteTarget {
  registrationId: string
  userId: string
  meetingId: string
  meetingTitle: string
  meetingType: string
  meetingDatetime: Date
}

/**
 * 자동 완료 대상자 조회
 * - 모임 종료 후 10일 경과
 * - 결제 완료(confirmed) 상태
 * - 아직 참여 완료 처리 안 된 사람
 */
export async function getAutoCompleteTargets(): Promise<AutoCompleteTarget[]> {
  const supabase = await createServiceClient()

  // 10일 전 = 지금 시각 - 240시간 (3일 알림 + 7일 대기)
  const now = new Date()
  const tenDaysAgo = new Date(now.getTime() - 240 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      meeting_id,
      meetings!registrations_meeting_id_fkey (
        id,
        title,
        meeting_type,
        datetime
      )
    `)
    .eq('status', 'confirmed')
    .is('participation_status', null)
    .lte('meetings.datetime', tenDaysAgo.toISOString())

  if (error) {
    logger.error('get_auto_complete_targets_error', { error: error.message })
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  const targets: AutoCompleteTarget[] = []

  for (const registration of data) {
    const meeting = registration.meetings as unknown as {
      id: string
      title: string
      meeting_type: string
      datetime: string
    }

    if (!meeting) {
      continue
    }

    targets.push({
      registrationId: registration.id,
      userId: registration.user_id,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingType: meeting.meeting_type,
      meetingDatetime: new Date(meeting.datetime),
    })
  }

  return targets
}

/**
 * 단일 대상 자동 완료 처리
 */
export async function processAutoComplete(
  target: AutoCompleteTarget
): Promise<boolean> {
  const supabase = await createServiceClient()

  try {
    const now = new Date().toISOString()

    // 참여 완료 처리
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        participation_status: 'completed',
        participation_method: 'auto',
        updated_at: now,
      })
      .eq('id', target.registrationId)
      .is('participation_status', null) // 이미 처리된 경우 방지

    if (updateError) {
      logger.error('auto_complete_update_failed', {
        registrationId: target.registrationId,
        error: updateError.message,
      })
      return false
    }

    // 사용자 통계 업데이트
    await updateUserStatsForAutoComplete(supabase, target)

    logger.info('auto_complete_processed', {
      registrationId: target.registrationId,
      userId: target.userId,
      meetingId: target.meetingId,
    })

    return true
  } catch (error) {
    logger.error('auto_complete_processing_error', {
      registrationId: target.registrationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

/**
 * 자동 완료 시 사용자 통계 업데이트
 */
async function updateUserStatsForAutoComplete(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  target: AutoCompleteTarget
) {
  try {
    // 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_participations, first_regular_meeting_at, is_new_member')
      .eq('id', target.userId)
      .single()

    if (userError || !user) {
      return
    }

    const updates: Record<string, unknown> = {
      total_participations: (user.total_participations || 0) + 1,
      updated_at: new Date().toISOString(),
    }

    // 정기모임인 경우 추가 업데이트
    if (target.meetingType === 'regular') {
      if (!user.first_regular_meeting_at) {
        updates.first_regular_meeting_at = target.meetingDatetime.toISOString()
      }
      updates.last_regular_meeting_at = target.meetingDatetime.toISOString()

      if (user.is_new_member) {
        updates.is_new_member = false
      }
    }

    await supabase
      .from('users')
      .update(updates)
      .eq('id', target.userId)
  } catch (error) {
    logger.error('auto_complete_stats_update_failed', {
      userId: target.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * 모든 대상 자동 완료 처리
 */
export async function processAllAutoComplete(): Promise<{
  total: number
  completed: number
  failed: number
}> {
  const targets = await getAutoCompleteTargets()

  const stats = {
    total: targets.length,
    completed: 0,
    failed: 0,
  }

  if (targets.length === 0) {
    logger.info('no_auto_complete_targets')
    return stats
  }

  logger.info('auto_complete_processing_start', { targetCount: targets.length })

  for (const target of targets) {
    const success = await processAutoComplete(target)
    if (success) {
      stats.completed++
    } else {
      stats.failed++
    }
  }

  logger.info('auto_complete_processing_complete', stats)

  return stats
}
