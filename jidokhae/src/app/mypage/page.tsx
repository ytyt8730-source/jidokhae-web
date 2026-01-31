import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import ThemeToggle from '@/components/ThemeToggle'
import { getUserBadges } from '@/lib/badges'
import {
  ProfileCard,
  StatsGrid,
  BadgeSection,
  QualificationStatus,
  RegistrationList,
} from './components'
import type { User as UserType, Meeting, Registration, Waitlist } from '@/types/database'

export const metadata = {
  title: '마이페이지 - 지독해',
  description: '내 정보와 참여 기록을 확인하세요.',
}

/**
 * MyPage - 마이페이지 (Phase 3-2 리팩토링)
 *
 * 컴포넌트 분리:
 * - ProfileCard: 프로필 정보
 * - StatsGrid: 참여 통계
 * - BadgeSection: 배지 (Trophy Glow)
 * - QualificationStatus: 정기모임 자격
 * - RegistrationList: 신청 내역
 */
export default async function MyPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single() as { data: UserType | null }

  if (!user) {
    redirect('/auth/login')
  }

  // 신청 내역 조회
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, meetings(*)')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false }) as { data: (Registration & { meetings: Meeting })[] | null }

  // 대기 내역 조회
  const { data: waitlists } = await supabase
    .from('waitlists')
    .select('*, meetings(*)')
    .eq('user_id', authUser.id)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false }) as { data: (Waitlist & { meetings: Meeting })[] | null }

  // 배지 조회
  const userBadges = await getUserBadges(authUser.id)

  // 등록한 책 수 조회
  const { count: bookCount } = await supabase
    .from('bookshelf')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', authUser.id)

  // 데이터 분류
  const confirmedRegistrations = (registrations || []).filter(
    r => r.status === 'confirmed' && new Date(r.meetings.datetime) > new Date()
  )
  const pendingTransferRegistrations = (registrations || []).filter(
    r => r.status === 'pending_transfer' && new Date(r.meetings.datetime) > new Date()
  )
  const completedRegistrations = (registrations || []).filter(
    r => r.participation_status === 'completed'
  )
  const cancelledRegistrations = (registrations || []).filter(r => r.status === 'cancelled')

  // 계산된 값
  const daysWithUs = differenceInDays(new Date(), new Date(user.created_at))
  const qualification = getQualificationStatus(user)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold heading-themed text-text mb-2">
            <User className="text-primary" size={28} strokeWidth={1.5} />
            마이페이지
          </h1>
          <p className="text-text-muted">
            내 정보와 참여 기록을 확인하세요.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* 프로필 카드 */}
      <ProfileCard user={user} daysWithUs={daysWithUs} />

      {/* 참여 통계 */}
      <StatsGrid user={user} bookCount={bookCount || 0} />

      {/* 배지 섹션 */}
      <BadgeSection badges={userBadges} />

      {/* 정기모임 자격 상태 */}
      <QualificationStatus
        qualification={qualification}
        lastRegularMeetingAt={user.last_regular_meeting_at}
      />

      {/* 신청 내역 */}
      <RegistrationList
        confirmedRegistrations={confirmedRegistrations}
        pendingTransferRegistrations={pendingTransferRegistrations}
        waitlists={waitlists || []}
        completedRegistrations={completedRegistrations}
        cancelledRegistrations={cancelledRegistrations}
      />
    </div>
  )
}

// 정기모임 자격 상태 계산 함수
function getQualificationStatus(user: UserType): {
  status: 'none' | 'active' | 'warning' | 'expired'
  message: string
} {
  if (!user.last_regular_meeting_at) {
    return { status: 'none', message: '정기모임 참여 기록 없음' }
  }

  const lastMeeting = new Date(user.last_regular_meeting_at)
  const daysSinceLast = differenceInDays(new Date(), lastMeeting)
  const monthsRemaining = Math.max(0, 6 - Math.floor(daysSinceLast / 30))

  if (daysSinceLast > 180) {
    return { status: 'expired', message: '자격 만료됨' }
  } else if (daysSinceLast > 150) {
    return { status: 'warning', message: `자격 만료 임박 (${monthsRemaining}개월 남음)` }
  } else {
    return { status: 'active', message: `활성 (${monthsRemaining}개월 남음)` }
  }
}
