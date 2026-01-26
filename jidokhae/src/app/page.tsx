import MeetingList from '@/components/MeetingList'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateMeetingStatus, formatMeetingDate } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import { CalendarDays, ArrowRight, CheckCircle, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { BannerSlide } from '@/components/BannerSlide'
import type { Meeting, Registration } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // 로그인한 사용자의 신청 모임 조회
  let myRegistrations: (Registration & { meetings: Meeting })[] = []
  if (authUser) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('*, meetings(*)')
      .eq('user_id', authUser.id)
      .eq('status', 'confirmed')
      .gte('meetings.datetime', new Date().toISOString())
      .order('meetings(datetime)', { ascending: true })
      .limit(3) as { data: (Registration & { meetings: Meeting })[] | null }

    myRegistrations = (regs || []).filter(r => r.meetings && new Date(r.meetings.datetime) > new Date())
  }

  // 모임 목록 조회 (현재 이후 모임만, 최신순)
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .gte('datetime', new Date().toISOString())
    .eq('status', 'open')
    .order('datetime', { ascending: true })
    .limit(9) as { data: Meeting[] | null }

  // 활성 배너 조회
  const serviceClient = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]
  const { data: banners } = await serviceClient
    .from('banners')
    .select('id, title, image_url, link_url')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('display_order', { ascending: true })

  const meetingsWithStatus = (meetings || []).map(calculateMeetingStatus)

  // 이번 주 모임 분리
  const thisWeekMeetings = meetingsWithStatus.filter(m => m.isThisWeek)
  const upcomingMeetings = meetingsWithStatus.filter(m => !m.isThisWeek)

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 - Electric: Immersive Blue / Warm: Paper Texture */}
      <section className="hero-section border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="hero-title heading-themed text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              깊은 사유,
              <br />
              새로운 관점
            </h1>
            <p className="hero-subtitle mt-6 text-lg lg:text-xl leading-relaxed max-w-2xl">
              경주와 포항에서 매주 열리는 프라이빗 독서 클럽.
              <br className="hidden sm:block" />
              책을 통해 인사이트를 나누고, 사유를 확장합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/meetings" className="hero-btn-primary font-semibold rounded-xl px-6 py-4 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]">
                모임 일정 보기
              </Link>
              <Link href="/about" className="hero-btn-secondary font-medium rounded-xl px-6 py-4 border transition-all duration-200 active:scale-[0.98]">
                멤버십 안내
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 배너 슬라이드 */}
      {banners && banners.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerSlide banners={banners} />
          </div>
        </section>
      )}

      {/* 내 신청 모임 - 로그인 사용자만 표시 */}
      {authUser && myRegistrations.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gradient-to-r from-brand-50 to-brand-100/30 rounded-2xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-800">
                  <CheckCircle className="text-brand-600" size={20} strokeWidth={1.5} />
                  예정된 참여 일정
                </h2>
                <Link
                  href="/mypage"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  전체 보기
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myRegistrations.map((reg) => (
                  <Link
                    key={reg.id}
                    href={`/meetings/${reg.meeting_id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="success">{getDday(reg.meetings.datetime)}</Badge>
                      <span className="font-medium text-brand-800 truncate">{reg.meetings.title}</span>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 이번 주 모임 */}
      {thisWeekMeetings.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <CalendarDays className="text-brand-600" size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-brand-800">이번 주 모임</h2>
                  <p className="text-sm text-gray-500">곧 시작되는 세션</p>
                </div>
              </div>
            </div>
            <MeetingList meetings={thisWeekMeetings} />
          </div>
        </section>
      )}

      {/* 다가오는 모임 */}
      <section className="bg-bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="text-brand-600" size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-brand-800">
                  {thisWeekMeetings.length > 0 ? '다가오는 모임' : '모임 일정'}
                </h2>
                <p className="text-sm text-gray-500">큐레이션된 독서 경험</p>
              </div>
            </div>
            <Link
              href="/meetings"
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              전체 일정
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </div>

          {upcomingMeetings.length > 0 ? (
            <MeetingList meetings={upcomingMeetings} />
          ) : thisWeekMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-gray-500">현재 예정된 모임이 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-bg-surface border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="text-brand-600" size={28} strokeWidth={1.5} />
            </div>
            <h3 className="heading-themed text-2xl lg:text-3xl font-bold text-text mb-4">
              지독해 멤버십
            </h3>
            <p className="text-text-muted text-lg mb-8 leading-relaxed">
              지적인 대화와 깊은 사유를 추구하는 분들을 위한 공간입니다.
              <br className="hidden sm:block" />
              멤버십에 대해 더 알아보세요.
            </p>
            <Link href="/about" className="btn-primary">
              멤버십 안내
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
