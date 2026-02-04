/**
 * 결제 완료 API
 * POST /api/registrations/complete
 *
 * M2-014~015: 결제 완료 처리
 * M2-016: 참가 인원 증가 (트리거로 자동 처리)
 * M2-017: 결제 완료 처리
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { registrationLogger } from '@/lib/logger'

interface CompletePaymentRequest extends Record<string, unknown> {
  registrationId: string
  paymentId: string
  paymentMethod: string
  amount: number
  idempotencyKey?: string
}

interface CompletePaymentResponse {
  success: boolean
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CompletePaymentRequest
    validateRequired(body, ['registrationId', 'paymentId', 'amount'])

    const { registrationId, paymentId, paymentMethod, amount, idempotencyKey } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 중복 결제 방지 (멱등성 체크)
    if (idempotencyKey) {
      const { data: existingPayment } = await supabase
        .from('payment_logs')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single()

      if (existingPayment) {
        return successResponse<CompletePaymentResponse>({
          success: true,
          message: '이미 처리된 결제입니다',
        })
      }
    }

    // registration 조회 및 소유권 확인 (meeting 정보도 함께 조회)
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id, meeting_id, status, meetings(fee)')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return errorResponse(ErrorCode.REGISTRATION_NOT_FOUND, { message: '신청 정보를 찾을 수 없습니다' })
    }

    if (registration.user_id !== authUser.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED, { message: '권한이 없습니다' })
    }

    if (registration.status === 'confirmed') {
      return successResponse<CompletePaymentResponse>({
        success: true,
        message: '이미 결제 완료된 신청입니다',
      })
    }

    if (registration.status === 'cancelled') {
      return errorResponse(ErrorCode.VALIDATION_ERROR, { message: '취소된 신청입니다' })
    }

    // [보안] 서버 측 결제 금액 검증 - 클라이언트 금액을 신뢰하지 않음
    const meeting = registration.meetings as { fee: number } | null
    const expectedFee = meeting?.fee ?? 0

    // 무료 모임(fee=0)이 아닌데 금액이 0이거나, 금액이 일치하지 않으면 거부
    if (expectedFee > 0 && amount !== expectedFee) {
      registrationLogger.warn('payment_amount_mismatch', {
        registrationId,
        clientAmount: amount,
        expectedFee,
        userId: authUser.id,
      })
      return errorResponse(ErrorCode.VALIDATION_ERROR, {
        message: '결제 금액이 일치하지 않습니다'
      })
    }

    // 결제 로그 저장
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        registration_id: registrationId,
        payment_id: paymentId,
        payment_method: paymentMethod || 'unknown',
        amount,
        status: 'paid',
        idempotency_key: idempotencyKey,
        raw_data: {
          paymentId,
          paymentMethod,
          amount,
          completedAt: new Date().toISOString(),
        },
      })

    if (logError) {
      registrationLogger.error('complete_payment_log_insert_error', {
        registrationId,
        paymentId,
        error: logError.message,
      })
      // 로그 실패해도 결제 처리는 계속
    }

    // registration 상태 업데이트 (M2-014~016)
    // 트리거가 current_participants를 자동 증가시킴
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateError) {
      registrationLogger.error('complete_registration_update_error', {
        registrationId,
        error: updateError.message,
      })
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '결제 처리 중 오류가 발생했습니다' })
    }

    return successResponse<CompletePaymentResponse>({
      success: true,
      message: '신청이 완료되었습니다',
    })
  } catch (error) {
    registrationLogger.error('complete_registration_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
