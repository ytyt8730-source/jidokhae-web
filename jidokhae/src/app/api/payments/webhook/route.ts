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

// [보안] Replay Attack 방지: 타임스탬프 허용 오차 (5분)
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300

/**
 * 포트원 V2 웹훅 서명 검증
 * Standard Webhooks 스펙 준수
 * https://github.com/standard-webhooks/standard-webhooks
 *
 * [보안] Replay Attack 방지를 위해 타임스탬프 검증 추가
 */
function verifyWebhookSignature(
  payload: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): { valid: boolean; error?: string } {
  if (!webhookId || !webhookTimestamp || !webhookSignature || !secret) {
    return { valid: false, error: 'missing_headers' }
  }

  try {
    // [보안] Replay Attack 방지: 타임스탬프 검증
    const timestampSeconds = parseInt(webhookTimestamp, 10)
    if (isNaN(timestampSeconds)) {
      return { valid: false, error: 'invalid_timestamp_format' }
    }

    const nowSeconds = Math.floor(Date.now() / 1000)
    const timeDiff = Math.abs(nowSeconds - timestampSeconds)
    if (timeDiff > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) {
      logger.warn('webhook_timestamp_expired', {
        webhookTimestamp: timestampSeconds,
        now: nowSeconds,
        diff: timeDiff,
      })
      return { valid: false, error: 'timestamp_expired' }
    }

    // 시크릿에서 whsec_ 접두어 제거 후 base64 디코딩
    const secretBytes = Buffer.from(
      secret.startsWith('whsec_') ? secret.slice(6) : secret,
      'base64'
    )

    // 서명할 메시지: {id}.{timestamp}.{body}
    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`

    // HMAC-SHA256으로 서명 생성
    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent, 'utf8')
      .digest('base64')

    // webhook-signature 헤더는 "v1,{base64_signature}" 형식
    // 여러 서명이 있을 수 있으므로 모두 확인
    const signatures = webhookSignature.split(' ')
    for (const sig of signatures) {
      const [version, signatureValue] = sig.split(',')
      if (version === 'v1' && signatureValue) {
        // Timing-safe 비교
        const expected = Buffer.from(expectedSignature, 'base64')
        const received = Buffer.from(signatureValue, 'base64')
        if (expected.length === received.length &&
            crypto.timingSafeEqual(expected, received)) {
          return { valid: true }
        }
      }
    }

    return { valid: false, error: 'signature_mismatch' }
  } catch (error) {
    logger.error('signature_verification_error', { error: String(error) })
    return { valid: false, error: 'verification_exception' }
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
    // 1. 페이로드 및 Standard Webhooks 헤더 읽기
    const payload = await request.text()
    const webhookId = request.headers.get('webhook-id') || ''
    const webhookTimestamp = request.headers.get('webhook-timestamp') || ''
    const webhookSignature = request.headers.get('webhook-signature') || ''

    // 2. 웹훅 시크릿 확인 - [보안] 개발환경 우회 제거
    const webhookSecret = env.server.portone.webhookSecret
    if (!webhookSecret) {
      logger.error('webhook_secret_not_configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // 3. 서명 검증 (Standard Webhooks 스펙 + Replay Attack 방지)
    const verification = verifyWebhookSignature(payload, webhookId, webhookTimestamp, webhookSignature, webhookSecret)
    if (!verification.valid) {
      logger.warn('webhook_signature_invalid', {
        webhookId,
        webhookTimestamp,
        signatureLength: webhookSignature.length,
        payloadLength: payload.length,
        error: verification.error,
      })
      return NextResponse.json({ error: `Invalid signature: ${verification.error}` }, { status: 401 })
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
