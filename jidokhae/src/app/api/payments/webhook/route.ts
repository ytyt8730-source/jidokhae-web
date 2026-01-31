/**
 * 포트원 V2 웹훅 엔드포인트
 * M2: 결제 완료/취소 이벤트 수신 및 처리
 *
 * 포트원 V2 웹훅 문서: https://developers.portone.io/docs/ko/v2-payment/webhook
 *
 * 지원 이벤트:
 * - Transaction.Paid: 결제 완료
 * - Transaction.Cancelled: 결제 취소
 * - Transaction.PartialCancelled: 부분 취소
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'
import { env } from '@/lib/env'

const logger = createLogger('webhook')

/**
 * 포트원 V2 웹훅 서명 검증
 * HMAC-SHA256 사용
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')

    // Timing-safe 비교로 타이밍 공격 방지
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * 결제 완료 처리
 */
async function handlePaymentPaid(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  data: {
    paymentId: string
    transactionId?: string
    amount?: { total: number }
  }
): Promise<void> {
  const { paymentId, amount } = data
  const paidAmount = amount?.total

  logger.info('processing_payment_paid', { paymentId, paidAmount })

  // payment_logs에서 해당 결제 찾기
  const { data: log, error: logError } = await supabase
    .from('payment_logs')
    .select('registration_id, amount')
    .eq('payment_id', paymentId)
    .single()

  if (logError || !log) {
    logger.warn('payment_log_not_found', { paymentId, error: logError?.message })
    return
  }

  // 이미 처리된 결제인지 확인
  const { data: registration } = await supabase
    .from('registrations')
    .select('status, payment_status')
    .eq('id', log.registration_id)
    .single()

  if (registration?.payment_status === 'paid') {
    logger.info('payment_already_confirmed', { paymentId, registrationId: log.registration_id })
    return
  }

  // registration 상태 업데이트
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_amount: paidAmount ?? log.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', log.registration_id)

  if (updateError) {
    logger.error('registration_update_failed', {
      paymentId,
      registrationId: log.registration_id,
      error: updateError.message,
    })
    throw updateError
  }

  // payment_logs 상태 업데이트
  await supabase
    .from('payment_logs')
    .update({
      status: 'completed',
      webhook_received_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId)

  logger.info('payment_confirmed_via_webhook', {
    paymentId,
    registrationId: log.registration_id,
    amount: paidAmount,
  })
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCancelled(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  data: {
    paymentId: string
    cancellation?: { cancelledAmount: number }
  }
): Promise<void> {
  const { paymentId, cancellation } = data

  logger.info('processing_payment_cancelled', { paymentId, cancellation })

  // payment_logs에서 해당 결제 찾기
  const { data: log, error: logError } = await supabase
    .from('payment_logs')
    .select('registration_id')
    .eq('payment_id', paymentId)
    .single()

  if (logError || !log) {
    logger.warn('payment_log_not_found_for_cancel', { paymentId })
    return
  }

  // registration 상태 업데이트
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'cancelled',
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', log.registration_id)

  if (updateError) {
    logger.error('registration_cancel_update_failed', {
      paymentId,
      registrationId: log.registration_id,
      error: updateError.message,
    })
    throw updateError
  }

  // payment_logs 상태 업데이트
  await supabase
    .from('payment_logs')
    .update({
      status: 'refunded',
      webhook_received_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId)

  logger.info('payment_cancelled_via_webhook', {
    paymentId,
    registrationId: log.registration_id,
  })
}

/**
 * 부분 취소 처리
 */
async function handlePartialCancelled(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  data: {
    paymentId: string
    cancellation?: { cancelledAmount: number }
  }
): Promise<void> {
  const { paymentId, cancellation } = data

  logger.info('processing_partial_cancel', { paymentId, cancellation })

  // payment_logs 상태만 업데이트 (registration은 유지)
  await supabase
    .from('payment_logs')
    .update({
      status: 'partial_refunded',
      refund_amount: cancellation?.cancelledAmount,
      webhook_received_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId)

  logger.info('partial_cancel_processed', { paymentId })
}

/**
 * POST /api/payments/webhook
 * 포트원 V2 웹훅 수신 엔드포인트
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // 1. 페이로드 읽기
    const payload = await request.text()
    const signature = request.headers.get('x-portone-signature') || ''

    // 2. 웹훅 시크릿 확인
    const webhookSecret = env.server.portone.webhookSecret
    if (!webhookSecret) {
      logger.error('webhook_secret_not_configured')
      // 개발 환경에서는 경고만 출력하고 계속 진행
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Webhook secret not configured' },
          { status: 500 }
        )
      }
      logger.warn('webhook_secret_missing_dev_mode', { message: 'Skipping signature verification in development' })
    }

    // 3. 서명 검증 (프로덕션 필수, 개발 환경에서는 시크릿 있을 때만)
    if (webhookSecret && !verifyWebhookSignature(payload, signature, webhookSecret)) {
      logger.warn('webhook_signature_invalid', {
        signatureLength: signature.length,
        payloadLength: payload.length,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 4. 페이로드 파싱
    let event: { type: string; data: Record<string, unknown> }
    try {
      event = JSON.parse(payload)
    } catch {
      logger.error('webhook_payload_parse_error')
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { type, data } = event

    logger.info('webhook_received', {
      type,
      paymentId: data?.paymentId,
      timestamp: new Date().toISOString(),
    })

    // 5. Supabase 클라이언트 생성
    const supabase = await createServiceClient()

    // 6. 이벤트 타입별 처리
    switch (type) {
      case 'Transaction.Paid':
        await handlePaymentPaid(supabase, data as Parameters<typeof handlePaymentPaid>[1])
        break

      case 'Transaction.Cancelled':
        await handlePaymentCancelled(supabase, data as Parameters<typeof handlePaymentCancelled>[1])
        break

      case 'Transaction.PartialCancelled':
        await handlePartialCancelled(supabase, data as Parameters<typeof handlePartialCancelled>[1])
        break

      default:
        logger.info('webhook_event_ignored', { type })
    }

    const duration = Date.now() - startTime
    logger.info('webhook_processed', { type, duration })

    return NextResponse.json({ received: true, type })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('webhook_processing_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    })

    // 웹훅은 재시도를 위해 5xx 반환
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/webhook
 * 웹훅 엔드포인트 상태 확인 (포트원 연결 테스트용)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/payments/webhook',
    supportedEvents: [
      'Transaction.Paid',
      'Transaction.Cancelled',
      'Transaction.PartialCancelled',
    ],
    timestamp: new Date().toISOString(),
  })
}
