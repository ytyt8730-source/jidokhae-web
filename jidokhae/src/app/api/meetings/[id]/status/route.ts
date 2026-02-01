import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'
import type { RefundPolicy, Waitlist } from '@/types/database'

export const dynamic = 'force-dynamic'

const logger = createLogger('meeting')

// 응답 타입
interface MeetingStatusResponse {
  alreadyRegistered: boolean
  registrationId: string | null
  userWaitlist: { id: string; position: number } | null
  refundPolicy: RefundPolicy | null
  publicReviews: { id: string; content: string }[]
}

/**
 * GET /api/meetings/[id]/status
 *
 * Bottom Sheet에서 필요한 사용자별 모임 상태 정보 조회
 * - 이미 등록했는지 여부
 * - 대기자 등록 여부 및 순번
 * - 환불 정책
 * - 공개 후기 (최대 3개)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params
    const supabase = await createClient()

    // 현재 로그인 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // 병렬로 데이터 조회
    const [
      registrationResult,
      waitlistResult,
      meetingResult,
      reviewsResult,
    ] = await Promise.all([
      // 1. 사용자 등록 여부 (로그인 시에만)
      userId
        ? supabase
            .from('registrations')
            .select('id, status')
            .eq('meeting_id', meetingId)
            .eq('user_id', userId)
            .neq('status', 'cancelled')
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      // 2. 대기자 등록 여부 (로그인 시에만)
      userId
        ? supabase
            .from('waitlists')
            .select('id, position')
            .eq('meeting_id', meetingId)
            .eq('user_id', userId)
            .eq('status', 'waiting')
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      // 3. 모임 정보 (환불 정책 ID 포함)
      supabase
        .from('meetings')
        .select(`
          id,
          refund_policy_id,
          refund_policy:refund_policies!meetings_refund_policy_id_fkey (
            id,
            name,
            meeting_type,
            rules,
            created_at
          )
        `)
        .eq('id', meetingId)
        .single(),

      // 4. 공개 후기 (최대 3개)
      supabase
        .from('reviews')
        .select('id, content')
        .eq('meeting_id', meetingId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    // 에러 체크
    if (meetingResult.error) {
      logger.error('meeting_fetch_error', {
        meetingId,
        error: meetingResult.error.message
      })
      return NextResponse.json(
        { success: false, error: { code: 5001, message: 'Meeting not found' } },
        { status: 404 }
      )
    }

    // 등록 상태 확인
    const registration = registrationResult.data
    const alreadyRegistered = registration !== null &&
      (registration.status === 'pending' ||
       registration.status === 'pending_transfer' ||
       registration.status === 'confirmed')

    // 대기자 정보
    const waitlistData = waitlistResult.data as Waitlist | null
    const userWaitlist = waitlistData
      ? { id: waitlistData.id, position: waitlistData.position }
      : null

    // 환불 정책 (Supabase join 결과 처리)
    interface MeetingWithPolicy {
      id: string
      refund_policy_id: string | null
      refund_policy: RefundPolicy | null
    }
    const meetingData = meetingResult.data as MeetingWithPolicy
    const refundPolicy = meetingData.refund_policy || null

    // 공개 후기
    const publicReviews = (reviewsResult.data || []).map((r: { id: string; content: string }) => ({
      id: r.id,
      content: r.content,
    }))

    const response: MeetingStatusResponse = {
      alreadyRegistered,
      registrationId: registration?.id || null,
      userWaitlist,
      refundPolicy,
      publicReviews,
    }

    logger.info('meeting_status_fetched', {
      meetingId,
      userId: userId || 'anonymous',
      alreadyRegistered,
      hasWaitlist: userWaitlist !== null,
    })

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (err) {
    logger.error('meeting_status_unexpected_error', {
      error: err instanceof Error ? err.message : 'Unknown'
    })
    return NextResponse.json(
      { success: false, error: { code: 5002, message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
