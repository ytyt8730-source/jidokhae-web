/**
 * 참여 완료 API
 * M4 소속감 - Phase 1
 *
 * POST /api/participations/complete
 * - 참여 완료 처리 (confirm, praise, review 방법)
 * - 사용자 통계 업데이트
 * - 배지 체크 및 부여
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  successResponse,
  withErrorHandler,
  requireAuth,
} from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { registrationLogger } from '@/lib/logger'
import type { ParticipationMethod } from '@/lib/notification/types'
import { checkAndAwardBadges } from '@/lib/badges'

const logger = registrationLogger

interface CompleteRequestBody {
  registrationId: string
  method: ParticipationMethod
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 요청 바디 파싱
    const body = await request.json() as CompleteRequestBody
    const { registrationId, method } = body

    // [보안] 유효한 방법인지 확인 - 'auto', 'admin'은 시스템 전용 (클라이언트 사용 불가)
    const clientAllowedMethods: ParticipationMethod[] = ['confirm', 'praise', 'review']
    if (!clientAllowedMethods.includes(method)) {
      logger.warn('invalid_participation_method', {
        userId: authUser.id,
        method,
        allowed: clientAllowedMethods,
      })
      throw new AppError(ErrorCode.PARTICIPATION_INVALID_METHOD)
    }

    // 서비스 클라이언트로 전환 (RLS 우회)
    const serviceClient = await createServiceClient()

    // 등록 정보 조회
    const { data: registration, error: regError } = await serviceClient
      .from('registrations')
      .select(`
        id,
        user_id,
        meeting_id,
        status,
        participation_status,
        meetings!registrations_meeting_id_fkey (
          id,
          meeting_type,
          datetime
        )
      `)
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      logger.error('registration_not_found', { registrationId })
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 본인 등록인지 확인
    if (registration.user_id !== authUser.id) {
      logger.warn('unauthorized_participation_complete', {
        registrationId,
        userId: authUser.id,
        ownerId: registration.user_id,
      })
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 이미 참여 완료인지 확인
    if (registration.participation_status === 'completed') {
      throw new AppError(ErrorCode.PARTICIPATION_ALREADY_COMPLETED)
    }

    // 노쇼 처리된 경우
    if (registration.participation_status === 'no_show') {
      throw new AppError(ErrorCode.PARTICIPATION_NO_SHOW)
    }

    // 참여 완료 처리
    const now = new Date().toISOString()
    const { error: updateError } = await serviceClient
      .from('registrations')
      .update({
        participation_status: 'completed',
        participation_method: method,
        updated_at: now,
      })
      .eq('id', registrationId)

    if (updateError) {
      logger.error('participation_update_failed', {
        registrationId,
        error: updateError.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 사용자 통계 업데이트
    const meeting = registration.meetings as unknown as {
      id: string
      meeting_type: string
      datetime: string
    }

    await updateUserStats(serviceClient, registration.user_id, meeting)

    // 배지 체크 및 부여
    const awardedBadges = await checkAndAwardBadges(registration.user_id)

    logger.info('participation_completed', {
      registrationId,
      userId: registration.user_id,
      meetingId: registration.meeting_id,
      method,
      awardedBadges,
    })

    return successResponse({
      message: '참여가 완료되었습니다.',
      registrationId,
      method,
      awardedBadges,
    })
  })
}

/**
 * 사용자 통계 업데이트
 * - total_participations 증가
 * - consecutive_weeks 계산
 * - 정기모임인 경우 last_regular_meeting_at 업데이트
 */
async function updateUserStats(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  meeting: { id: string; meeting_type: string; datetime: string }
) {
  try {
    // 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_participations, consecutive_weeks, last_regular_meeting_at, first_regular_meeting_at, is_new_member')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('user_not_found_for_stats', { userId })
      return
    }

    const updates: Record<string, unknown> = {
      total_participations: (user.total_participations || 0) + 1,
      updated_at: new Date().toISOString(),
    }

    // 정기모임인 경우 추가 업데이트
    if (meeting.meeting_type === 'regular') {
      const meetingDate = new Date(meeting.datetime)

      // 첫 정기모임 기록
      if (!user.first_regular_meeting_at) {
        updates.first_regular_meeting_at = meetingDate.toISOString()
      }

      // 마지막 정기모임 업데이트
      updates.last_regular_meeting_at = meetingDate.toISOString()

      // 신규 회원 해제
      if (user.is_new_member) {
        updates.is_new_member = false
      }

      // 연속 참여 주 계산
      const consecutiveWeeks = await calculateConsecutiveWeeks(supabase, userId, meetingDate)
      updates.consecutive_weeks = consecutiveWeeks
    }

    await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    logger.info('user_stats_updated', {
      userId,
      totalParticipations: updates.total_participations,
    })
  } catch (error) {
    logger.error('update_user_stats_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * 연속 참여 주 계산
 * - 최근 4주간의 참여 기록을 확인
 * - 매주 참여했으면 연속 주 수 증가
 */
async function calculateConsecutiveWeeks(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  currentMeetingDate: Date
): Promise<number> {
  try {
    // 최근 4주간의 참여 완료된 모임 조회
    const fourWeeksAgo = new Date(currentMeetingDate)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const { data: participations, error } = await supabase
      .from('registrations')
      .select(`
        id,
        meetings!registrations_meeting_id_fkey (
          datetime,
          meeting_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('participation_status', 'completed')
      .gte('meetings.datetime', fourWeeksAgo.toISOString())
      .order('meetings.datetime', { ascending: false })

    if (error || !participations || participations.length === 0) {
      return 1 // 현재 참여가 첫 번째
    }

    // 주 단위로 그룹화
    const weekNumbers = new Set<number>()

    for (const p of participations) {
      const meeting = p.meetings as unknown as { datetime: string; meeting_type: string }
      if (!meeting || meeting.meeting_type !== 'regular') continue

      const meetingDate = new Date(meeting.datetime)
      const weekNumber = getWeekNumber(meetingDate)
      weekNumbers.add(weekNumber)
    }

    // 현재 주 추가
    const currentWeekNumber = getWeekNumber(currentMeetingDate)
    weekNumbers.add(currentWeekNumber)

    // 연속 주 계산 (현재 주부터 역순으로)
    let consecutiveCount = 0
    let checkWeek = currentWeekNumber

    while (weekNumbers.has(checkWeek)) {
      consecutiveCount++
      checkWeek--
    }

    return consecutiveCount
  } catch (error) {
    logger.error('calculate_consecutive_weeks_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 1
  }
}

/**
 * 연도 내 주 번호 계산
 */
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  return Math.floor(diff / oneWeek)
}
