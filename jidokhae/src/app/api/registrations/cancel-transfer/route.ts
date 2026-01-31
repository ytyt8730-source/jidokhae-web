/**
 * 입금대기 상태 취소 API
 * POST /api/registrations/cancel-transfer
 *
 * MX-C02: 입금대기 상태에서 취소
 * - 실제 결제가 이루어지지 않았으므로 환불 계좌 불필요
 * - current_participants 감소 필요
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { triggerWaitlistNotification } from '@/lib/waitlist-notification'
import { registrationLogger } from '@/lib/logger'

interface CancelTransferRequest extends Record<string, unknown> {
  registrationId: string
  cancelReason?: string
}

interface CancelTransferResponse {
  success: boolean
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CancelTransferRequest
    validateRequired(body, ['registrationId'])

    const { registrationId, cancelReason } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // registration 조회 및 소유권 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id, meeting_id, status')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return errorResponse(ErrorCode.REGISTRATION_NOT_FOUND, { message: '신청 정보를 찾을 수 없습니다' })
    }

    if (registration.user_id !== authUser.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED, { message: '권한이 없습니다' })
    }

    // 입금대기 상태만 취소 가능
    if (registration.status !== 'pending_transfer') {
      return successResponse<CancelTransferResponse>({
        success: false,
        message: '입금대기 상태의 신청만 취소할 수 있습니다',
      })
    }

    // Service role로 업데이트 (트리거 실행 보장)
    const serviceClient = await createServiceClient()

    // registration 상태 업데이트
    // payment_status는 변경하지 않음 (결제가 이루어지지 않은 상태)
    const { error: updateError } = await serviceClient
      .from('registrations')
      .update({
        status: 'cancelled',
        cancel_reason: cancelReason || '사용자 취소',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateError) {
      registrationLogger.error('cancel_transfer_update_error', {
        registrationId,
        error: updateError.message,
      })
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '취소 처리 중 오류가 발생했습니다' })
    }

    // 모임 현재 참가자 수 조회 후 감소 (atomic하게 처리)
    const { data: meeting } = await serviceClient
      .from('meetings')
      .select('id, current_participants')
      .eq('id', registration.meeting_id)
      .single()

    if (meeting && meeting.current_participants > 0) {
      await serviceClient
        .from('meetings')
        .update({
          current_participants: meeting.current_participants - 1,
        })
        .eq('id', registration.meeting_id)
    }

    // 대기자에게 알림 (비동기)
    triggerWaitlistNotification(registration.meeting_id).catch(err => {
      registrationLogger.error('waitlist_notification_trigger_failed', {
        meetingId: registration.meeting_id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    })

    registrationLogger.info('transfer_cancelled', {
      registrationId,
      userId: authUser.id,
      meetingId: registration.meeting_id,
    })

    return successResponse<CancelTransferResponse>({
      success: true,
      message: '신청이 취소되었습니다.',
    })
  } catch (error) {
    registrationLogger.error('cancel_transfer_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
