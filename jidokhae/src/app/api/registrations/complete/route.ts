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

    if (registration.status === 'confirmed') {
      return successResponse<CompletePaymentResponse>({
        success: true,
        message: '이미 결제 완료된 신청입니다',
      })
    }

    if (registration.status === 'cancelled') {
      return errorResponse(ErrorCode.VALIDATION_ERROR, { message: '취소된 신청입니다' })
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
      console.error('Payment log error:', logError)
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
      console.error('Registration update error:', updateError)
      return errorResponse(ErrorCode.INTERNAL_ERROR, { message: '결제 처리 중 오류가 발생했습니다' })
    }

    return successResponse<CompletePaymentResponse>({
      success: true,
      message: '신청이 완료되었습니다',
    })
  } catch (error) {
    console.error('Complete registration error:', error)
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
