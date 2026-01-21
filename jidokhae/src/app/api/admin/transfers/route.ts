import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAdmin } from '@/lib/api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('system')

/**
 * 입금대기/환불대기 목록 조회 API
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * GET /api/admin/transfers
 *
 * M5-051: 입금대기 목록 화면
 * M5-054: 환불대기 목록 표시
 */
export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new Error('Unauthorized')
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    requireAdmin(user?.role)

    const timer = logger.startTimer()

    // 병렬로 조회
    const [pendingResult, refundPendingResult] = await Promise.all([
      // 입금대기 목록
      supabase
        .from('registrations')
        .select(`
          id,
          user_id,
          meeting_id,
          status,
          payment_status,
          payment_amount,
          transfer_sender_name,
          transfer_deadline,
          refund_info,
          users (name, phone),
          meetings (title)
        `)
        .eq('status', 'pending_transfer')
        .order('transfer_deadline', { ascending: true }),

      // 환불대기 목록
      supabase
        .from('registrations')
        .select(`
          id,
          user_id,
          meeting_id,
          status,
          payment_status,
          payment_amount,
          transfer_sender_name,
          transfer_deadline,
          refund_info,
          users (name, phone),
          meetings (title)
        `)
        .eq('payment_status', 'refund_pending')
        .eq('payment_method', 'transfer')
        .order('cancelled_at', { ascending: false }),
    ])

    timer.done('Transfers list fetched', {
      pending: pendingResult.data?.length || 0,
      refundPending: refundPendingResult.data?.length || 0,
    })

    return successResponse({
      pending: pendingResult.data || [],
      refundPending: refundPendingResult.data || [],
    })
  })
}
