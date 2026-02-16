import { Metadata } from 'next'
import LandingContent from './LandingContent'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '지독해 - 책을 사랑하는 사람들이 모이는 곳',
  description: '경주, 포항에서 매주 열리는 독서 모임. 책 한 권을 읽고, 생각을 나누고, 친구가 됩니다. 250명의 회원이 함께하는 따뜻한 독서 커뮤니티.',
  keywords: ['독서모임', '경주', '포항', '책읽기', '북클럽', '독서토론'],
  openGraph: {
    title: '지독해 - 책을 사랑하는 사람들이 모이는 곳',
    description: '경주, 포항에서 매주 열리는 독서 모임. 250명의 회원이 함께하는 따뜻한 독서 커뮤니티.',
    images: ['/og-landing.png'],
    type: 'website',
    locale: 'ko_KR',
    siteName: '지독해',
  },
  twitter: {
    card: 'summary_large_image',
    title: '지독해 - 책을 사랑하는 사람들이 모이는 곳',
    description: '경주, 포항에서 매주 열리는 독서 모임',
    images: ['/og-landing.png'],
  },
  alternates: {
    canonical: '/about',
  },
}

// 공개 후기 타입
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

// 갤러리 이미지 타입
interface GalleryImage {
  id: string
  image_url: string
  alt_text: string
}

// 통계 데이터 조회
async function getStats() {
  const supabase = await createClient()

  // 회원 수
  const { count: memberCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // 총 모임 수
  const { count: meetingCount } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'closed')

  return {
    memberCount: memberCount || 0,
    meetingCount: meetingCount || 0,
  }
}

// 갤러리 이미지 조회
async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = await createClient()

  const { data: images } = await supabase
    .from('gallery_images')
    .select('id, image_url, alt_text')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return images || []
}

// 공개 후기 조회
async function getPublicReviews(): Promise<PublicReview[]> {
  const supabase = await createClient()

  const { data: reviews } = await supabase
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
    .limit(6)

  if (!reviews) return []

  interface ReviewData {
    id: string
    content: string
    created_at: string
    user: { name: string; nickname: string | null; created_at: string } | null
    meeting: { title: string } | null
  }

  return (reviews as ReviewData[]).map((review) => {
    const user = review.user
    const meeting = review.meeting

    // 닉네임 기반 익명화
    const displayName = user?.nickname || user?.name
    const anonymizedName = displayName
      ? `${displayName.charAt(0)}${'*'.repeat(Math.max(displayName.length - 1, 2))}`
      : '익명'

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
}

export default async function AboutPage() {
  const [stats, reviews, galleryImages] = await Promise.all([
    getStats(),
    getPublicReviews(),
    getGalleryImages(),
  ])

  return <LandingContent stats={stats} reviews={reviews} galleryImages={galleryImages} />
}
