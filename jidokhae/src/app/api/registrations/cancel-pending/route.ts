/**
 * Pending 상태 신청 취소 API
 * POST /api/registrations/cancel-pending
 *
 * M2-018~019: 결제 실패/취소 시 pending registration 정리
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'

interface CancelPendingRequest extends Record<string, unknown> {
  registrationId: string
  reason?: string
}

interface CancelPendingResponse {
  success: boolean
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CancelPendingRequest
    validateRequired(body, ['registrationId'])

    const { registrationId, reason } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // registration 조회 및 소유권 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id, status')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return errorResponse(ErrorCode.REGISTRATION_NOT_FOUND, { message: '신청 정보를 찾을 수 없습니다' })
    }

    if (registration.user_id !== authUser.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED, { message: '권한이 없습니다' })
    }

    // pending 상태만 취소 가능
    if (registration.status !== 'pending') {
      return successResponse<CancelPendingResponse>({
        success: false,
        message: 'pending 상태의 신청만 취소할 수 있습니다',
      })
    }

    // 삭제 (pending은 실제 참가자가 아니므로 삭제)
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Delete pending registration error:', deleteError)
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '취소 처리 중 오류가 발생했습니다' })
    }

    return successResponse<CancelPendingResponse>({
      success: true,
      message: reason === 'user_cancelled' ? '결제가 취소되었습니다' : '결제에 실패했습니다',
    })
  } catch (error) {
    console.error('Cancel pending registration error:', error)
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
