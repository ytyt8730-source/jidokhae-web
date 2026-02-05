/**
 * 대기 등록 API
 * POST /api/waitlists/register
 *
 * M2-034: 대기 등록 성공
 * M2-035: 대기 순번 표시
 * M2-040: 중복 대기 방지
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { waitlistLogger } from '@/lib/logger'
import { checkMeetingQualification } from '@/lib/payment'
import type { Meeting, User } from '@/types/database'

interface RegisterWaitlistRequest extends Record<string, unknown> {
  meetingId: string
}

interface RegisterWaitlistResponse {
  success: boolean
  message: string
  position?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterWaitlistRequest
    validateRequired(body, ['meetingId'])

    const { meetingId } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 모임 정보 조회
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single() as { data: Meeting | null; error: Error | null }

    if (meetingError || !meeting) {
      return errorResponse(ErrorCode.MEETING_NOT_FOUND)
    }

    // 과거 모임 체크
    if (new Date(meeting.datetime) < new Date()) {
      return successResponse<RegisterWaitlistResponse>({
        success: false,
        message: '이미 종료된 모임입니다.',
      })
    }

    // 사용자 정보 조회 (자격 검증용)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: User | null }

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 자격 체크 (토론모임 등)
    const qualification = checkMeetingQualification(user, meeting)
    if (!qualification.eligible) {
      return successResponse<RegisterWaitlistResponse>({
        success: false,
        message: qualification.reason || '자격이 필요합니다',
      })
    }

    // 모임이 마감되었는지 확인
    if (meeting.current_participants < meeting.capacity) {
      return successResponse<RegisterWaitlistResponse>({
        success: false,
        message: '아직 자리가 있습니다. 신청하기를 이용해주세요.',
      })
    }

    // 이미 신청한 사용자인지 확인
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .neq('status', 'cancelled')
      .single()

    if (existingReg) {
      return successResponse<RegisterWaitlistResponse>({
        success: false,
        message: '이미 신청한 모임입니다.',
      })
    }

    // 이미 대기 중인지 확인 (M2-040)
    const { data: existingWaitlist } = await supabase
      .from('waitlists')
      .select('id, position')
      .eq('user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .eq('status', 'waiting')
      .single()

    if (existingWaitlist) {
      return successResponse<RegisterWaitlistResponse>({
        success: false,
        message: `이미 대기 중입니다. (${existingWaitlist.position}번째)`,
      })
    }

    // 현재 대기 인원 조회하여 순번 계산
    const { count: waitlistCount } = await supabase
      .from('waitlists')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_id', meetingId)
      .eq('status', 'waiting')

    const newPosition = (waitlistCount || 0) + 1

    // 대기 등록 (M2-034)
    const { error: insertError } = await supabase
      .from('waitlists')
      .insert({
        user_id: authUser.id,
        meeting_id: meetingId,
        position: newPosition,
        status: 'waiting',
      })

    if (insertError) {
      waitlistLogger.error('register_waitlist_insert_error', {
        meetingId,
        userId: authUser.id,
        error: insertError.message,
      })

      // 중복 키 오류 (동시성 이슈)
      if (insertError.message.includes('duplicate')) {
        return successResponse<RegisterWaitlistResponse>({
          success: false,
          message: '이미 대기 중입니다.',
        })
      }

      return errorResponse(ErrorCode.INTERNAL_ERROR)
    }

    return successResponse<RegisterWaitlistResponse>({
      success: true,
      message: `대기 등록이 완료되었습니다. (${newPosition}번째)`,
      position: newPosition,
    })
  } catch (error) {
    waitlistLogger.error('register_waitlist_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
