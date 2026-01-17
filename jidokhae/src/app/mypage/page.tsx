import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { User, Calendar, Award, BookOpen, ArrowRight } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import Badge from '@/components/ui/Badge'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday } from '@/lib/payment'
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

  // 확정 신청 (다가오는 모임만)
  const confirmedRegistrations = (registrations || []).filter(
    r => r.status === 'confirmed' && new Date(r.meetings.datetime) > new Date()
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
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-warm-900 mb-2">
          <User className="text-brand-500" size={28} />
          마이페이지
        </h1>
        <p className="text-warm-600">
          내 정보와 참여 기록을 확인하세요.
        </p>
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
            <h2 className="text-xl font-semibold text-warm-900">{user.name}</h2>
            <p className="text-warm-500">{user.email}</p>
            {user.phone && (
              <p className="text-sm text-warm-400 mt-1">{user.phone}</p>
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
          <Calendar className="mx-auto text-warm-400 mb-2" size={24} />
          <p className="text-2xl font-bold text-warm-900">{user.total_participations}</p>
          <p className="text-xs text-warm-500">총 참여</p>
        </div>
        <div className="card p-4 text-center">
          <Award className="mx-auto text-warm-400 mb-2" size={24} />
          <p className="text-2xl font-bold text-warm-900">{user.consecutive_weeks}</p>
          <p className="text-xs text-warm-500">연속 참여 (주)</p>
        </div>
        <div className="card p-4 text-center">
          <span className="block text-2xl mb-2">💛</span>
          <p className="text-2xl font-bold text-warm-900">{user.total_praises_received}</p>
          <p className="text-xs text-warm-500">받은 칭찬</p>
        </div>
        <div className="card p-4 text-center">
          <BookOpen className="mx-auto text-warm-400 mb-2" size={24} />
          <p className="text-2xl font-bold text-warm-900">0</p>
          <p className="text-xs text-warm-500">등록한 책</p>
        </div>
      </div>

      {/* 정기모임 자격 상태 */}
      <div className="card p-6">
        <h3 className="font-semibold text-warm-900 mb-4">정기모임 자격 상태</h3>
        <div className={`p-4 rounded-xl ${
          qualification.status === 'active' ? 'bg-green-50' :
          qualification.status === 'warning' ? 'bg-orange-50' :
          qualification.status === 'expired' ? 'bg-red-50' :
          'bg-warm-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              qualification.status === 'active' ? 'bg-green-500' :
              qualification.status === 'warning' ? 'bg-orange-500' :
              qualification.status === 'expired' ? 'bg-red-500' :
              'bg-warm-400'
            }`} />
            <p className={`font-medium ${
              qualification.status === 'active' ? 'text-green-800' :
              qualification.status === 'warning' ? 'text-orange-800' :
              qualification.status === 'expired' ? 'text-red-800' :
              'text-warm-600'
            }`}>
              {qualification.message}
            </p>
          </div>
          {user.last_regular_meeting_at && (
            <p className="text-xs text-warm-500 mt-2 ml-6">
              마지막 참여: {new Date(user.last_regular_meeting_at).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>

      {/* 신청 내역 (M2-043~047) */}
      <div className="card p-6">
        <h3 className="font-semibold text-warm-900 mb-4">내 신청 모임</h3>

        {/* 확정된 신청 (M2-044) */}
        {confirmedRegistrations.length > 0 ? (
          <div className="space-y-3">
            {confirmedRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/meetings/${reg.meeting_id}`}
                className="block p-4 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">확정</Badge>
                      <span className="text-sm font-medium text-brand-600">
                        {getDday(reg.meetings.datetime)}
                      </span>
                    </div>
                    <h4 className="font-medium text-warm-900 truncate">{reg.meetings.title}</h4>
                    <p className="text-sm text-warm-500 mt-1">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-warm-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-warm-500 text-center py-8">
            신청한 모임이 없습니다.
          </p>
        )}

        {/* 대기 중 (M2-045) */}
        {waitlists && waitlists.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-warm-700 mb-3">대기 중</h4>
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
                      <h4 className="font-medium text-warm-900 truncate">{wl.meetings.title}</h4>
                      <p className="text-sm text-warm-500 mt-1">
                        {formatMeetingDate(wl.meetings.datetime)}
                      </p>
                    </div>
                    <ArrowRight size={20} className="text-warm-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 취소된 신청 (M2-046) */}
        {cancelledRegistrations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-warm-100">
            <h4 className="text-sm font-medium text-warm-500 mb-3">취소된 신청</h4>
            <div className="space-y-2">
              {cancelledRegistrations.slice(0, 3).map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 bg-warm-50 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default">취소됨</Badge>
                    <span className="text-sm text-warm-600 truncate">{reg.meetings.title}</span>
                  </div>
                  {reg.refund_amount > 0 && (
                    <p className="text-xs text-warm-500 mt-1">
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

