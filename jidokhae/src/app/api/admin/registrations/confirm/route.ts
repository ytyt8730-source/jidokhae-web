import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, validateRequired, requireAdmin } from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const logger = createLogger('payment')

/**
 * 계좌이체 입금 확인 API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * POST /api/admin/registrations/confirm
 *
 * M5-052: 운영자 입금 확인 성공
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
        transfer_sender_name,
        users (name, phone),
        meetings (title)
      `)
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 2. 상태 확인
    if (registration.status !== 'pending_transfer') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '입금대기 상태가 아닙니다.',
        currentStatus: registration.status,
      })
    }

    // 3. 상태 업데이트
    // 트리거에서 current_participants는 이미 +1된 상태이므로 변경 없음
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
      })
      .eq('id', registrationId)

    if (updateError) {
      logger.error('Failed to confirm transfer', {
        registrationId,
        error: updateError.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 4. 알림톡 발송
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'TRANSFER_CONFIRMED',
          userId: registration.user_id,
          meetingId: registration.meeting_id,
          variables: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            이름: (registration.users as any)?.name || '회원',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            모임명: (registration.meetings as any)?.title || '모임',
          },
        }),
      })
    } catch (notifyError) {
      // 알림 발송 실패해도 확인은 완료
      logger.warn('Failed to send transfer confirmed notification', {
        error: notifyError instanceof Error ? notifyError.message : 'Unknown',
        registrationId,
      })
    }

    logger.info('Transfer confirmed by admin', {
      registrationId,
      userId: registration.user_id,
      adminId: authUser.id,
      amount: registration.payment_amount,
    })

    return successResponse({
      success: true,
      message: '입금이 확인되었습니다.',
    })
  })
}
