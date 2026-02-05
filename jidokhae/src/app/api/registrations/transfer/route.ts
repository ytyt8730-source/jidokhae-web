import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { calculateTransferDeadline, DEFAULT_TRANSFER_DEADLINE_HOURS } from '@/lib/transfer'

const logger = createLogger('registration')

/**
 * 계좌이체 신청 API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * POST /api/registrations/transfer
 *
 * M5-044: 입금 완료 체크 성공
 * M5-045: 입금 안내 알림톡 발송
 */
export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const supabaseAdmin = await createServiceClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    const body = await request.json()
    validateRequired(body, ['meetingId', 'senderName'])

    const { meetingId, senderName } = body as {
      meetingId: string
      senderName: string
    }

    const timer = logger.startTimer()

    // 1. 모임 정보 조회
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, title, fee, capacity, current_participants, status, datetime')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      throw new AppError(ErrorCode.MEETING_NOT_FOUND)
    }

    // 2. 정원 확인 및 예약 (FOR UPDATE 락 사용)
    // 동시 요청에서 정원 초과를 방지하기 위한 원자적 체크
    const { data: capacityResult, error: capacityError } = await supabaseAdmin
      .rpc('check_and_reserve_capacity', {
        p_meeting_id: meetingId,
        p_user_id: authUser!.id
      })

    if (capacityError) {
      logger.error('Capacity check RPC failed', {
        error: capacityError.message,
        meetingId,
        userId: authUser!.id
      })
      throw new AppError(ErrorCode.DATABASE_ERROR, { message: capacityError.message })
    }

    // RPC 결과 처리 (TABLE 형태로 반환되므로 배열의 첫 번째 요소 사용)
    const capacityCheck = (capacityResult as { success: boolean; message: string }[] | null)?.[0]
    if (!capacityCheck?.success) {
      const errorMessage = capacityCheck?.message || 'UNKNOWN_ERROR'
      switch (errorMessage) {
        case 'MEETING_NOT_FOUND':
          throw new AppError(ErrorCode.MEETING_NOT_FOUND)
        case 'MEETING_CLOSED':
          throw new AppError(ErrorCode.MEETING_CLOSED)
        case 'CAPACITY_EXCEEDED':
          throw new AppError(ErrorCode.CAPACITY_EXCEEDED)
        case 'ALREADY_REGISTERED':
          throw new AppError(ErrorCode.REGISTRATION_ALREADY_EXISTS)
        default:
          throw new AppError(ErrorCode.DATABASE_ERROR, { message: errorMessage })
      }
    }

    // RPC가 이미 pending 상태의 registration을 생성했으므로, 해당 레코드 조회
    const { data: pendingReg, error: pendingError } = await supabaseAdmin
      .from('registrations')
      .select('id')
      .eq('user_id', authUser!.id)
      .eq('meeting_id', meetingId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pendingError || !pendingReg) {
      logger.error('Failed to find pending registration after RPC', {
        error: pendingError?.message,
        meetingId,
        userId: authUser!.id
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 5. 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('name, phone')
      .eq('id', authUser!.id)
      .single()

    // 6. 입금 기한 계산
    const deadline = calculateTransferDeadline(
      Number(process.env.TRANSFER_DEADLINE_HOURS) || DEFAULT_TRANSFER_DEADLINE_HOURS
    )

    // 3. RPC가 생성한 pending 상태를 pending_transfer로 업데이트
    // 트리거가 current_participants를 관리함
    const { data: registration, error: regError } = await supabaseAdmin
      .from('registrations')
      .update({
        status: 'pending_transfer',
        payment_status: 'pending',
        payment_method: 'transfer',
        payment_amount: meeting.fee,
        transfer_sender_name: senderName,
        transfer_deadline: deadline.toISOString(),
      })
      .eq('id', pendingReg.id)
      .select()
      .single()

    if (regError) {
      logger.error('Failed to update transfer registration', {
        error: regError.message,
        userId: authUser!.id,
        meetingId,
        registrationId: pendingReg.id,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR, { message: regError.message })
    }

    // 8. 알림톡 발송 (M5-045)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'TRANSFER_PENDING',
          userId: authUser!.id,
          meetingId,
          variables: {
            이름: userData?.name || '회원',
            모임명: meeting.title,
            은행: process.env.NEXT_PUBLIC_TRANSFER_BANK_NAME || '',
            계좌번호: process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_NUMBER || '',
            금액: meeting.fee.toLocaleString(),
            입금자명형식: senderName,
            기한: deadline.toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }),
          },
        }),
      })
    } catch (notifyError) {
      // 알림 발송 실패해도 신청은 진행
      logger.warn('Failed to send transfer pending notification', {
        error: notifyError instanceof Error ? notifyError.message : 'Unknown',
        registrationId: registration.id,
      })
    }

    timer.done('Transfer registration created', {
      registrationId: registration.id,
      userId: authUser!.id,
      meetingId,
      senderName,
    })

    return successResponse({
      registrationId: registration.id,
      senderName,
      deadline: deadline.toISOString(),
      amount: meeting.fee,
      meetingTitle: meeting.title,
    })
  })
}

/**
 * 계좌이체 환불 계좌 저장 API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * PATCH /api/registrations/transfer
 *
 * M5-049: 환불 계좌 저장 성공
 */
export async function PATCH(request: Request) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const supabaseAdmin = await createServiceClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    const body = await request.json()
    validateRequired(body, ['registrationId', 'refundInfo'])

    const { registrationId, refundInfo } = body as {
      registrationId: string
      refundInfo: {
        bank: string
        account: string
        holder: string
      }
    }

    // 1. 신청 정보 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id, status, payment_method, payment_status')
      .eq('id', registrationId)
      .eq('user_id', authUser!.id)
      .single()

    if (regError || !registration) {
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 2. 계좌이체 결제인지 확인
    if (registration.payment_method !== 'transfer') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '계좌이체 결제만 환불 계좌를 입력할 수 있습니다.',
      })
    }

    // 3. 환불 계좌 저장 + 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({
        refund_info: {
          ...refundInfo,
          requested_at: new Date().toISOString(),
        },
        payment_status: 'refund_pending',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: 'user_cancelled',
      })
      .eq('id', registrationId)

    if (updateError) {
      logger.error('Failed to save refund info', {
        error: updateError.message,
        registrationId,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Refund account saved', {
      registrationId,
      userId: authUser!.id,
      bank: refundInfo.bank,
    })

    return successResponse({
      success: true,
      message: '환불 계좌가 저장되었습니다.',
    })
  })
}
