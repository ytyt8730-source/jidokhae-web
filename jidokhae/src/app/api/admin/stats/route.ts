import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAdmin } from '@/lib/api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('system')

export interface DashboardStats {
  // 참가 현황
  registrations: {
    confirmed: number
    cancelled: number
  }
  // 수입/환불
  income: {
    total: number
    refunded: number
    refundCount: number
  }
  // 재참여율
  retention: {
    rate: number
    returningUsers: number
    totalUsers: number
  }
  // 입금대기/환불대기 (계좌이체)
  transfers: {
    pendingCount: number
    refundPendingCount: number
  }
  // 세그먼트별 회원 수
  segments: {
    new: number
    growth: number
    loyal: number
    dormantRisk: number
    dormant: number
  }
  // 이번 달 모임 현황
  meetings: {
    id: string
    title: string
    datetime: string
    currentParticipants: number
    capacity: number
    status: string
  }[]
}

export async function GET(request: Request) {
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

    // URL에서 월 파라미터 가져오기 (기본값: 현재 월)
    const { searchParams } = new URL(request.url)
    const yearMonth = searchParams.get('month') // format: "2026-01"

    const now = new Date()
    let targetYear = now.getFullYear()
    let targetMonth = now.getMonth() // 0-indexed

    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number)
      if (!isNaN(year) && !isNaN(month)) {
        targetYear = year
        targetMonth = month - 1 // 0-indexed
      }
    }

    const startOfMonth = new Date(targetYear, targetMonth, 1)
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    const startISO = startOfMonth.toISOString()
    const endISO = endOfMonth.toISOString()

    const timer = logger.startTimer()

    // 병렬로 통계 쿼리 실행
    const [
      registrationsResult,
      incomeResult,
      refundResult,
      transfersResult,
      meetingsResult,
      usersResult,
    ] = await Promise.all([
      // 1. 이번 달 신청 현황
      supabase
        .from('registrations')
        .select('status')
        .gte('created_at', startISO)
        .lte('created_at', endISO),

      // 2. 이번 달 수입
      supabase
        .from('registrations')
        .select('payment_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', startISO)
        .lte('created_at', endISO),

      // 3. 이번 달 환불
      supabase
        .from('registrations')
        .select('refund_amount')
        .in('payment_status', ['refunded', 'partial_refunded'])
        .gte('cancelled_at', startISO)
        .lte('cancelled_at', endISO),

      // 4. 입금대기/환불대기 (전체, 월 무관)
      supabase
        .from('registrations')
        .select('status, payment_status'),

      // 5. 이번 달 모임
      supabase
        .from('meetings')
        .select('id, title, datetime, current_participants, capacity, status')
        .gte('datetime', startISO)
        .lte('datetime', endISO)
        .order('datetime', { ascending: true }),

      // 6. 전체 회원 (세그먼트 계산용)
      supabase
        .from('users')
        .select('id, is_new_member, last_regular_meeting_at, total_participations, created_at')
        .eq('role', 'member'),
    ])

    // 참가 현황 계산
    const confirmed = registrationsResult.data?.filter((r: { status: string }) => r.status === 'confirmed').length || 0
    const cancelled = registrationsResult.data?.filter((r: { status: string }) => r.status === 'cancelled').length || 0

    // 수입 계산
    const totalIncome = incomeResult.data?.reduce((sum: number, r: { payment_amount: number | null }) => sum + (r.payment_amount || 0), 0) || 0

    // 환불 계산
    const refundedAmount = refundResult.data?.reduce((sum: number, r: { refund_amount: number | null }) => sum + (r.refund_amount || 0), 0) || 0
    const refundCount = refundResult.data?.length || 0

    // 입금대기/환불대기 계산
    const pendingCount = transfersResult.data?.filter((r: { status: string }) => r.status === 'pending_transfer').length || 0
    const refundPendingCount = transfersResult.data?.filter((r: { payment_status: string }) => r.payment_status === 'refund_pending').length || 0

    // 재참여율 계산 (이번 달 참가자 중 이전에 참가한 적 있는 회원 비율)
    const thisMonthParticipants = incomeResult.data?.length || 0
    // 간단하게: 신규 회원이 아닌 confirmed 신청자 비율
    const { data: returningData } = await supabase
      .from('registrations')
      .select('user_id, users!inner(is_new_member)')
      .eq('status', 'confirmed')
      .gte('created_at', startISO)
      .lte('created_at', endISO)

    const returningUsers = returningData?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.users?.is_new_member === false
    ).length || 0
    const retentionRate = thisMonthParticipants > 0
      ? Math.round((returningUsers / thisMonthParticipants) * 100)
      : 0

    // 세그먼트 계산
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const users = usersResult.data || []
    const segments = {
      new: 0,
      growth: 0,
      loyal: 0,
      dormantRisk: 0,
      dormant: 0,
    }

    interface UserSegmentData {
      id: string
      is_new_member: boolean | null
      last_regular_meeting_at: string | null
      total_participations: number | null
      created_at: string | null
    }

    users.forEach((user: UserSegmentData) => {
      const lastMeeting = user.last_regular_meeting_at
        ? new Date(user.last_regular_meeting_at)
        : null
      const participations = user.total_participations || 0

      if (user.is_new_member) {
        segments.new++
      } else if (!lastMeeting || lastMeeting < sixMonthsAgo) {
        segments.dormant++
      } else if (lastMeeting < threeMonthsAgo) {
        segments.dormantRisk++
      } else if (participations >= 10) {
        segments.loyal++
      } else {
        segments.growth++
      }
    })

    // 모임 현황 포맷팅
    interface MeetingData {
      id: string
      title: string
      datetime: string
      current_participants: number
      capacity: number
      status: string
    }

    const meetings = (meetingsResult.data || []).map((m: MeetingData) => ({
      id: m.id,
      title: m.title,
      datetime: m.datetime,
      currentParticipants: m.current_participants,
      capacity: m.capacity,
      status: m.status,
    }))

    const stats: DashboardStats = {
      registrations: { confirmed, cancelled },
      income: {
        total: totalIncome,
        refunded: refundedAmount,
        refundCount,
      },
      retention: {
        rate: retentionRate,
        returningUsers,
        totalUsers: thisMonthParticipants,
      },
      transfers: {
        pendingCount,
        refundPendingCount,
      },
      segments,
      meetings,
    }

    timer.done('Dashboard stats fetched', { month: `${targetYear}-${targetMonth + 1}` })

    return successResponse(stats)
  })
}
