import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { User, Calendar, Award, BookOpen, ArrowRight, Trophy, Heart } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import Badge from '@/components/ui/Badge'
import BadgeIcon from '@/components/BadgeIcon'
import ThemeToggle from '@/components/ThemeToggle'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import { getUserBadges, getBadgeInfo } from '@/lib/badges'
import type { User as UserType, Meeting, Registration, Waitlist } from '@/types/database'

export const metadata = {
  title: '마이페이지 - 지독해',
  description: '내 정보와 참여 기록을 확인하세요.',
}

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

  // 신청 내역 조회 (M2-043~047)
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

  // 확정 신청 (다가오는 모임만)
  const confirmedRegistrations = (registrations || []).filter(
    r => r.status === 'confirmed' && new Date(r.meetings.datetime) > new Date()
  )

  // 입금대기 신청 (M5-046)
  const pendingTransferRegistrations = (registrations || []).filter(
    r => r.status === 'pending_transfer' && new Date(r.meetings.datetime) > new Date()
  )

  // MX-H01: 참여 완료 모임
  const completedRegistrations = (registrations || []).filter(
    r => r.participation_status === 'completed'
  )

  // 취소된 신청
  const cancelledRegistrations = (registrations || []).filter(r => r.status === 'cancelled')

  // 함께한 일수 계산
  const daysWithUs = differenceInDays(new Date(), new Date(user.created_at))

  // 정기모임 자격 상태 계산
  const getQualificationStatus = () => {
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

  const qualification = getQualificationStatus()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold heading-themed text-brand-800 mb-2">
            <User className="text-brand-600" size={28} strokeWidth={1.5} />
            마이페이지
          </h1>
          <p className="text-gray-600">
            내 정보와 참여 기록을 확인하세요.
          </p>
        </div>
        {/* Theme Toggle - Design System v3.3 */}
        <ThemeToggle />
      </div>

      {/* 프로필 카드 */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-brand-600">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-brand-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            {user.phone && (
              <p className="text-sm text-gray-400 mt-1">{user.phone}</p>
            )}
          </div>
        </div>

        {/* 함께한 기간 */}
        <div className="mt-6 p-4 bg-brand-50 rounded-xl text-center">
          <p className="text-sm text-brand-600">지독해와 함께한 지</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">
            {daysWithUs}일째
          </p>
        </div>
      </div>

      {/* 참여 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <Calendar className="mx-auto text-gray-400 mb-2" size={24} strokeWidth={1.5} />
          <p className="text-2xl font-bold text-brand-800">{user.total_participations}</p>
          <p className="text-xs text-gray-500">총 참여</p>
        </div>
        <div className="card p-4 text-center">
          <Award className="mx-auto text-gray-400 mb-2" size={24} strokeWidth={1.5} />
          <p className="text-2xl font-bold text-brand-800">{user.consecutive_weeks}</p>
          <p className="text-xs text-gray-500">연속 참여 (주)</p>
        </div>
        <div className="card p-4 text-center">
          <Heart className="mx-auto text-yellow-500 mb-2" size={24} strokeWidth={1.5} fill="currentColor" />
          <p className="text-2xl font-bold text-brand-800">{user.total_praises_received}</p>
          <p className="text-xs text-gray-500">받은 칭찬</p>
        </div>
        <Link href="/mypage/bookshelf" className="card p-4 text-center hover:shadow-md transition-shadow">
          <BookOpen className="mx-auto text-gray-400 mb-2" size={24} strokeWidth={1.5} />
          <p className="text-2xl font-bold text-brand-800">{bookCount || 0}</p>
          <p className="text-xs text-gray-500">등록한 책</p>
        </Link>
      </div>

      {/* 배지 섹션 */}
      {userBadges.length > 0 && (
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-semibold text-brand-800 mb-4">
            <Trophy size={20} className="text-yellow-500" strokeWidth={1.5} />
            나의 배지
          </h3>
          <div className="flex flex-wrap gap-3">
            {userBadges.map((badge: { id: string; badge_type: string }) => {
              const info = getBadgeInfo(badge.badge_type)
              if (!info) return null
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                  title={info.description}
                >
                  <BadgeIcon icon={info.icon} size={20} className="text-brand-600" />
                  <span className="text-sm font-medium text-gray-700">{info.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 정기모임 자격 상태 */}
      <div className="card p-6">
        <h3 className="font-semibold text-brand-800 mb-4">정기모임 자격 상태</h3>
        <div className={`p-4 rounded-xl ${qualification.status === 'active' ? 'bg-green-50' :
            qualification.status === 'warning' ? 'bg-orange-50' :
              qualification.status === 'expired' ? 'bg-red-50' :
                'bg-gray-50'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${qualification.status === 'active' ? 'bg-green-500' :
                qualification.status === 'warning' ? 'bg-orange-500' :
                  qualification.status === 'expired' ? 'bg-red-500' :
                    'bg-gray-400'
              }`} />
            <p className={`font-medium ${qualification.status === 'active' ? 'text-green-800' :
                qualification.status === 'warning' ? 'text-orange-800' :
                  qualification.status === 'expired' ? 'text-red-800' :
                    'text-gray-600'
              }`}>
              {qualification.message}
            </p>
          </div>
          {user.last_regular_meeting_at && (
            <p className="text-xs text-gray-500 mt-2 ml-6">
              마지막 참여: {new Date(user.last_regular_meeting_at).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>

      {/* 신청 내역 (M2-043~047) */}
      <div className="card p-6">
        <h3 className="font-semibold text-brand-800 mb-4">내 신청 모임</h3>

        {/* 확정된 신청 (M2-044) */}
        {confirmedRegistrations.length > 0 ? (
          <div className="space-y-3">
            {confirmedRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/meetings/${reg.meeting_id}`}
                className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">확정</Badge>
                      <span className="text-sm font-medium text-brand-600">
                        {getDday(reg.meetings.datetime)}
                      </span>
                    </div>
                    <h4 className="font-medium text-brand-800 truncate">{reg.meetings.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            신청한 모임이 없습니다.
          </p>
        )}

        {/* 입금대기 (M5-046) */}
        {pendingTransferRegistrations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">입금대기</h4>
            <div className="space-y-3">
              {pendingTransferRegistrations.map((reg) => (
                <Link
                  key={reg.id}
                  href={`/meetings/${reg.meeting_id}/transfer-pending`}
                  className="block p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="warning">입금대기</Badge>
                        <span className="text-sm font-medium text-brand-600">
                          {getDday(reg.meetings.datetime)}
                        </span>
                      </div>
                      <h4 className="font-medium text-brand-800 truncate">{reg.meetings.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatMeetingDate(reg.meetings.datetime)}
                      </p>
                      <p className="text-xs text-yellow-700 mt-2">
                        입금 정보 확인하기 →
                      </p>
                    </div>
                    <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 대기 중 (M2-045) */}
        {waitlists && waitlists.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">대기 중</h4>
            <div className="space-y-3">
              {waitlists.map((wl) => (
                <Link
                  key={wl.id}
                  href={`/meetings/${wl.meeting_id}`}
                  className="block p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info">대기 {wl.position}번째</Badge>
                      </div>
                      <h4 className="font-medium text-brand-800 truncate">{wl.meetings.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatMeetingDate(wl.meetings.datetime)}
                      </p>
                    </div>
                    <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* MX-H01: 참여 완료 */}
        {completedRegistrations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">참여 완료</h4>
            <div className="space-y-3">
              {completedRegistrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="p-4 bg-green-50 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="success">참여 완료</Badge>
                      </div>
                      <h4 className="font-medium text-brand-800 truncate">{reg.meetings.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatMeetingDate(reg.meetings.datetime)}
                      </p>
                    </div>
                    {/* 칭찬하기 / 후기 쓰기 버튼 */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/meetings/${reg.meeting_id}/praise`}
                        className="text-xs text-brand-600 hover:text-brand-700 px-2 py-1 bg-white rounded-lg border border-brand-200 hover:border-brand-300"
                      >
                        칭찬하기
                      </Link>
                      <Link
                        href={`/meetings/${reg.meeting_id}/feedback`}
                        className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        후기 쓰기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {completedRegistrations.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  외 {completedRegistrations.length - 5}개 모임
                </p>
              )}
            </div>
          </div>
        )}

        {/* 취소된 신청 (M2-046) */}
        {cancelledRegistrations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3">취소된 신청</h4>
            <div className="space-y-2">
              {cancelledRegistrations.slice(0, 3).map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 bg-gray-50 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default">취소됨</Badge>
                    <span className="text-sm text-gray-600 truncate">{reg.meetings.title}</span>
                  </div>
                  {reg.refund_amount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      환불: {formatFee(reg.refund_amount)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

