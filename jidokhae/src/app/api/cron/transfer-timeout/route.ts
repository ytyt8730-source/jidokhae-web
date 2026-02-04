import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { createLogger } from '@/lib/logger'
import { NOTIFICATION_TEMPLATES } from '@/lib/notification/types'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

const logger = createLogger('cron')

/**
 * 계좌이체 미입금 자동 취소 Cron API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * GET /api/cron/transfer-timeout
 *
 * M5-056: 24시간 미입금 자동 취소
 * M5-057: 입금 기한 임박 알림 (6시간 전)
 *
 * 실행 주기: 매 시간 (Vercel Cron 또는 외부 호출)
 */
export async function GET(request: NextRequest) {
  // [보안] Cron 인증 확인
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/transfer-timeout', request)
  }

  return withErrorHandler(async () => {

    const supabase = await createServiceClient()
    const timer = logger.startTimer()
    const now = new Date()
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000)

    // 1. 기한 만료된 입금대기 건 조회
    const { data: expiredRegistrations, error: expiredError } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        meeting_id,
        transfer_sender_name,
        payment_amount,
        users (name, phone),
        meetings (title)
      `)
      .eq('status', 'pending_transfer')
      .lt('transfer_deadline', now.toISOString())

    if (expiredError) {
      logger.error('Failed to fetch expired registrations', {
        error: expiredError.message,
      })
      throw expiredError
    }

    let processedCount = 0
    let warnedCount = 0

    // 2. 만료된 건 자동 취소
    for (const reg of expiredRegistrations || []) {
      try {
        // 상태 업데이트 (트리거가 current_participants -1 처리)
        const { error: updateError } = await supabase
          .from('registrations')
          .update({
            status: 'cancelled',
            payment_status: 'refunded', // 입금 전이므로 실제 환불 없음
            cancel_reason: 'transfer_expired',
            cancelled_at: now.toISOString(),
          })
          .eq('id', reg.id)

        if (updateError) {
          logger.error('Failed to cancel expired registration', {
            registrationId: reg.id,
            error: updateError.message,
          })
          continue
        }

        // 알림톡 발송 (M5-056)
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateCode: NOTIFICATION_TEMPLATES.TRANSFER_EXPIRED,
              userId: reg.user_id,
              meetingId: reg.meeting_id,
              variables: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                이름: (reg.users as any)?.name || '회원',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                모임명: (reg.meetings as any)?.title || '모임',
              },
            }),
          })
        } catch {
          // 알림 실패 무시
        }

        processedCount++
        logger.info('Transfer registration expired', {
          registrationId: reg.id,
          userId: reg.user_id,
        })
      } catch (err) {
        logger.error('Error processing expired registration', {
          registrationId: reg.id,
          error: err instanceof Error ? err.message : 'Unknown',
        })
      }
    }

    // 3. 기한 임박 건 조회 (6시간 이내, 아직 알림 안 보낸 건)
    // deadline_warning_sent 필드가 없으므로, 6시간 이내에 있는 건 모두 조회
    // (실제로는 별도 필드로 중복 알림 방지 필요)
    const { data: warningRegistrations, error: warningError } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        meeting_id,
        transfer_sender_name,
        transfer_deadline,
        payment_amount,
        users (name, phone),
        meetings (title)
      `)
      .eq('status', 'pending_transfer')
      .gt('transfer_deadline', now.toISOString())
      .lt('transfer_deadline', sixHoursFromNow.toISOString())

    if (!warningError && warningRegistrations) {
      for (const reg of warningRegistrations) {
        try {
          // 알림톡 발송 (M5-057)
          // 참고: 중복 발송 방지를 위해 실제로는 notification_logs 확인 필요
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateCode: NOTIFICATION_TEMPLATES.TRANSFER_DEADLINE_WARNING,
              userId: reg.user_id,
              meetingId: reg.meeting_id,
              variables: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                이름: (reg.users as any)?.name || '회원',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                모임명: (reg.meetings as any)?.title || '모임',
                기한: reg.transfer_deadline
                  ? new Date(reg.transfer_deadline).toLocaleString('ko-KR')
                  : '',
              },
            }),
          })
          warnedCount++
        } catch {
          // 알림 실패 무시
        }
      }
    }

    timer.done('Transfer timeout cron completed', {
      expired: processedCount,
      warned: warnedCount,
    })

    return successResponse({
      processed: processedCount,
      warned: warnedCount,
      timestamp: now.toISOString(),
    })
  })
}
