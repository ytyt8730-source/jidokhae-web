import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, validateRequired, requireAdmin } from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const logger = createLogger('payment')

/**
 * 계좌이체 환불 완료 API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * POST /api/admin/registrations/refund-complete
 *
 * M5-055: 운영자 환불 완료 체크
 */
export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const supabaseAdmin = await createServiceClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    requireAdmin(adminUser?.role)

    const body = await request.json()
    validateRequired(body, ['registrationId'])

    const { registrationId } = body as { registrationId: string }

    // 1. 신청 정보 조회
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        meeting_id,
        status,
        payment_status,
        payment_method,
        payment_amount,
        refund_info,
        users (name, phone),
        meetings (title)
      `)
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 2. 상태 확인
    if (registration.payment_status !== 'refund_pending') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '환불대기 상태가 아닙니다.',
        currentStatus: registration.payment_status,
      })
    }

    // 3. 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({
        payment_status: 'refunded',
        refund_completed_at: new Date().toISOString(),
        refund_amount: registration.payment_amount,
      })
      .eq('id', registrationId)

    if (updateError) {
      logger.error('Failed to mark refund complete', {
        registrationId,
        error: updateError.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 4. 알림톡 발송 (선택적)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'REFUND_COMPLETED',
          userId: registration.user_id,
          meetingId: registration.meeting_id,
          variables: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            이름: (registration.users as any)?.name || '회원',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            모임명: (registration.meetings as any)?.title || '모임',
            환불금액: registration.payment_amount?.toLocaleString() || '0',
          },
        }),
      })
    } catch (notifyError) {
      // 알림 발송 실패해도 환불 완료는 처리
      logger.warn('Failed to send refund completed notification', {
        error: notifyError instanceof Error ? notifyError.message : 'Unknown',
        registrationId,
      })
    }

    logger.info('Transfer refund completed by admin', {
      registrationId,
      userId: registration.user_id,
      adminId: authUser.id,
      amount: registration.payment_amount,
    })

    return successResponse({
      success: true,
      message: '환불이 완료 처리되었습니다.',
    })
  })
}
