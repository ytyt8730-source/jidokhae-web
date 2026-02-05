/**
 * 결제 준비 API
 * POST /api/registrations/prepare
 *
 * M2-007: 신청하기 버튼 활성화
 * M2-008~010: 자격 체크
 * M2-011~012: 정원 체크
 * M2-020: 동시성 제어
 * M2-021: 중복 신청 방지
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { checkMeetingQualification } from '@/lib/payment'
import { registrationLogger } from '@/lib/logger'
import { rateLimiters, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import type { User, Meeting, PreparePaymentResponse } from '@/types/database'

export async function POST(request: NextRequest) {
  // [보안] Rate Limiting - 결제 API는 1분에 5회 제한
  const rateLimitResult = checkRateLimit(request, rateLimiters.payment)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = await request.json()
    validateRequired(body, ['meetingId'])

    const { meetingId } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: User | null; error: Error | null }

    if (userError || !user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 모임 정보 조회
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single() as { data: Meeting | null; error: Error | null }

    if (meetingError || !meeting) {
      return errorResponse(ErrorCode.NOT_FOUND, { message: '모임을 찾을 수 없습니다' })
    }

    // 모임 상태 확인
    if (meeting.status !== 'open') {
      return successResponse<PreparePaymentResponse>({
        success: false,
        message: '마감된 모임입니다',
      })
    }

    // 자격 체크 (M2-008~010)
    const qualification = checkMeetingQualification(user, meeting)
    if (!qualification.eligible) {
      return successResponse<PreparePaymentResponse>({
        success: false,
        message: qualification.reason || '자격이 필요합니다',
      })
    }

    // 정원 및 중복 체크 (M2-011, M2-012, M2-020, M2-021)
    // check_and_reserve_capacity 함수 호출
    const { data: reserveResult, error: reserveError } = await supabase
      .rpc('check_and_reserve_capacity', {
        p_meeting_id: meetingId,
        p_user_id: authUser.id,
      })

    if (reserveError) {
      registrationLogger.error('prepare_reserve_capacity_error', {
        meetingId,
        userId: authUser.id,
        error: reserveError.message,
      })
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '신청 처리 중 오류가 발생했습니다' })
    }

    const result = reserveResult as { success: boolean; message: string }[] | null
    const reserveData = result?.[0]

    if (!reserveData?.success) {
      const message = reserveData?.message || 'UNKNOWN_ERROR'

      switch (message) {
        case 'ALREADY_REGISTERED':
          return successResponse<PreparePaymentResponse>({
            success: false,
            message: '이미 신청한 모임입니다',
          })
        case 'CAPACITY_EXCEEDED':
          return successResponse<PreparePaymentResponse>({
            success: false,
            message: '마감되었습니다. 대기 신청하시겠습니까?',
          })
        case 'MEETING_CLOSED':
          return successResponse<PreparePaymentResponse>({
            success: false,
            message: '마감된 모임입니다',
          })
        case 'MEETING_NOT_FOUND':
          return successResponse<PreparePaymentResponse>({
            success: false,
            message: '모임을 찾을 수 없습니다',
          })
        default:
          return successResponse<PreparePaymentResponse>({
            success: false,
            message: '신청 처리 중 오류가 발생했습니다',
          })
      }
    }

    // pending 상태의 registration 조회
    const { data: registration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .eq('status', 'pending')
      .single()

    if (!registration) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '신청 정보를 찾을 수 없습니다' })
    }

    // 결제 준비 완료
    return successResponse<PreparePaymentResponse>({
      success: true,
      message: 'SUCCESS',
      registrationId: registration.id,
      amount: meeting.fee,
      meetingTitle: meeting.title,
    })
  } catch (error) {
    registrationLogger.error('prepare_registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
