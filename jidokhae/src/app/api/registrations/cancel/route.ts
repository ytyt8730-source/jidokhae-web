/**
 * 신청 취소 API
 * POST /api/registrations/cancel
 *
 * M2-022~032: 취소/환불 처리
 * M3-018: 취소 시 대기자 자동 알림
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { calculateRefundAmount } from '@/lib/payment'
import { triggerWaitlistNotification } from '@/lib/waitlist-notification'
import { registrationLogger } from '@/lib/logger'
import type { Registration, Meeting, RefundRule } from '@/types/database'

interface CancelRequest extends Record<string, unknown> {
  registrationId: string
  cancelReason: string
}

interface CancelResponse {
  success: boolean
  message: string
  refundAmount?: number
  refundPercent?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CancelRequest
    validateRequired(body, ['registrationId', 'cancelReason'])

    const { registrationId, cancelReason } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // registration 조회 및 소유권 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*, meetings(*)')
      .eq('id', registrationId)
      .single() as { data: (Registration & { meetings: Meeting }) | null; error: Error | null }

    if (regError || !registration) {
      return errorResponse(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    if (registration.user_id !== authUser.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 이미 취소된 신청 확인
    if (registration.status === 'cancelled') {
      return successResponse<CancelResponse>({
        success: false,
        message: '이미 취소된 신청입니다',
      })
    }

    // 결제 완료 상태만 취소 가능
    if (registration.status !== 'confirmed') {
      return successResponse<CancelResponse>({
        success: false,
        message: '결제 완료된 신청만 취소할 수 있습니다',
      })
    }

    const meeting = registration.meetings

    // 환불 정책 조회
    let refundRules: RefundRule[] = []
    if (meeting.refund_policy_id) {
      const { data: policy } = await supabase
        .from('refund_policies')
        .select('rules')
        .eq('id', meeting.refund_policy_id)
        .single() as { data: { rules: RefundRule[] } | null }

      if (policy) {
        refundRules = policy.rules
      }
    }

    // 환불 금액 계산 (M2-024~028)
    const paymentAmount = registration.payment_amount || meeting.fee
    const meetingDate = new Date(meeting.datetime)
    const refundAmount = calculateRefundAmount(paymentAmount, meetingDate, refundRules)
    const refundPercent = Math.round((refundAmount / paymentAmount) * 100)

    // 환불 처리 (M2-031)
    // TODO: 실제 포트원 환불 API 호출
    // 현재는 DB 업데이트만 진행

    // registration 상태 업데이트 (M2-030: 트리거가 participants 자동 감소)
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'cancelled',
        payment_status: refundAmount > 0
          ? (refundAmount === paymentAmount ? 'refunded' : 'partial_refunded')
          : 'paid',
        refund_amount: refundAmount,
        cancel_reason: cancelReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateError) {
      registrationLogger.error('cancel_registration_update_error', {
        registrationId,
        error: updateError.message,
      })
      return errorResponse(ErrorCode.INTERNAL_ERROR)
    }

    // 환불 로그 저장
    if (refundAmount > 0) {
      await supabase
        .from('payment_logs')
        .insert({
          registration_id: registrationId,
          payment_id: `REFUND_${registrationId}_${Date.now()}`,
          payment_method: 'refund',
          amount: -refundAmount,
          status: 'cancelled',
          raw_data: {
            originalAmount: paymentAmount,
            refundAmount,
            refundPercent,
            cancelReason,
            cancelledAt: new Date().toISOString(),
          },
        })
    }

    // M3-018: 대기자에게 자리 발생 알림 (비동기로 처리)
    triggerWaitlistNotification(meeting.id).catch(err => {
      registrationLogger.error('waitlist_notification_trigger_failed', {
        meetingId: meeting.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    })

    return successResponse<CancelResponse>({
      success: true,
      message: refundAmount > 0
        ? `취소가 완료되었습니다. ${refundAmount.toLocaleString()}원이 환불됩니다.`
        : '취소가 완료되었습니다. 환불 불가 기간입니다.',
      refundAmount,
      refundPercent,
    })
  } catch (error) {
    registrationLogger.error('cancel_registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
