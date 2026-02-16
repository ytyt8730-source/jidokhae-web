import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

// 동적 렌더링 명시 (request.url 사용으로 인한 정적 렌더링 불가)
export const dynamic = 'force-dynamic'

const logger = createLogger('reviews')

// 공개 후기 응답 타입
interface PublicReview {
  id: string
  content: string
  created_at: string
  user: {
    name: string
    joined_year: number
  }
  meeting: {
    title: string
  }
}

/**
 * GET /api/reviews/public
 * 공개 동의한 후기 목록 조회 (랜딩페이지용)
 * - is_public = true 인 후기만 조회
 * - 최신순으로 최대 6개
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 10)

    const supabase = await createClient()

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        content,
        created_at,
        user:users!reviews_user_id_fkey (
          name,
          nickname,
          created_at
        ),
        meeting:meetings!reviews_meeting_id_fkey (
          title
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('public_reviews_fetch_error', { error: error.message })
      return NextResponse.json(
        { success: false, error: { code: 5001, message: 'Failed to fetch reviews' } },
        { status: 500 }
      )
    }

    // 응답 형식 가공 (익명화된 이름, 가입 연도)
    interface ReviewData {
      id: string
      content: string
      created_at: string
      user: { name: string; nickname: string | null; created_at: string } | null
      meeting: { title: string } | null
    }

    const publicReviews: PublicReview[] = ((reviews || []) as ReviewData[]).map((review) => {
      const user = review.user
      const meeting = review.meeting

      // 닉네임 기반 익명화: 닉네임이 있으면 닉네임 첫 글자 + **, 없으면 이름 기반
      const displayName = user?.nickname || user?.name
      const anonymizedName = displayName
        ? `${displayName.charAt(0)}${'*'.repeat(Math.max(displayName.length - 1, 2))}`
        : '익명'

      // 가입 연도 추출
      const joinedYear = user?.created_at
        ? new Date(user.created_at).getFullYear()
        : new Date().getFullYear()

      return {
        id: review.id,
        content: review.content,
        created_at: review.created_at,
        user: {
          name: anonymizedName,
          joined_year: joinedYear,
        },
        meeting: {
          title: meeting?.title || '모임',
        },
      }
    })

    logger.info('public_reviews_fetched', { count: publicReviews.length })

    return NextResponse.json({
      success: true,
      data: publicReviews,
      meta: { total: publicReviews.length },
    })
  } catch (err) {
    logger.error('public_reviews_unexpected_error', { error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { success: false, error: { code: 5002, message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
