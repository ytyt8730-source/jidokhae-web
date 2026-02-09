import { Suspense } from 'react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateMeetingStatus, formatMeetingDate } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import { CalendarDays, ArrowRight, CheckCircle, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { BannerSlide } from '@/components/BannerSlide'
import BentoGridSection from '@/components/BentoGridSection'
import HomePageClient from '@/components/HomePageClient'
import type { Meeting, Registration, User as UserType } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // 로그인한 사용자 정보 및 신청 모임 조회
  let myRegistrations: (Registration & { meetings: Meeting })[] = []
  let userData: UserType | null = null

  if (authUser) {
    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: UserType | null }
    userData = user

    // 신청 모임 조회
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
              경주와 포항에서 매주 열리는 독서 클럽.
              <br className="hidden sm:block" />
              같이 읽고, 같이 이야기합니다.
            </p>
            {/* Sarah Chen: 단일 CTA로 전환율 극대화 - 인지 부하 감소 */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/meetings"
                className="hero-btn-primary inline-flex items-center gap-2 font-semibold rounded-xl px-8 py-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg active:scale-[0.98]"
              >
                이번 달 일정 보기
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="/about"
                className="text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors"
              >
                소개 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 배너 슬라이드 */}
      {banners && banners.length > 0 && (
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerSlide banners={banners} />
          </div>
        </section>
      )}

      {/* Bento Grid 대시보드 - Design System v3.3 */}
      <BentoGridSection
        user={userData}
        thisWeekMeeting={thisWeekMeetings[0] || null}
        nextRegistration={myRegistrations[0] || null}
      />

      {/* 내 신청 모임 - 로그인 사용자만 표시 */}
      {authUser && myRegistrations.length > 0 && (
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
                  <CheckCircle className="text-primary" size={20} strokeWidth={1.5} />
                  예정된 참여 일정
                </h2>
                <Link
                  href="/mypage"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  전체 보기
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myRegistrations.map((reg) => (
                  <Link
                    key={reg.id}
                    href={`/meetings/${reg.meeting_id}`}
                    className="flex items-center justify-between p-4 bg-[var(--bg-base)] rounded-xl hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="success">{getDday(reg.meetings.datetime)}</Badge>
                      <span className="font-medium text-text truncate">{reg.meetings.title}</span>
                    </div>
                    <span className="text-sm text-text-muted flex-shrink-0 ml-2">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 모임 섹션 - One-Page Architecture with Bottom Sheet */}
      <Suspense fallback={
        <div className="bg-bg-base py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--bg-surface)] rounded-2xl h-64" />
              ))}
            </div>
          </div>
        </div>
      }>
        <HomePageClient
          thisWeekMeetings={thisWeekMeetings}
          upcomingMeetings={upcomingMeetings}
          user={userData}
          thisWeekTitle={
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CalendarDays className="text-primary" size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">이번 주 모임</h2>
                  <p className="text-sm text-text-muted">곧 시작되는 세션</p>
                </div>
              </div>
            </div>
          }
          upcomingTitle={
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-surface)] rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="text-primary" size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">
                    {thisWeekMeetings.length > 0 ? '다가오는 모임' : '모임 일정'}
                  </h2>
                  <p className="text-sm text-text-muted">이번 달 모임 일정</p>
                </div>
              </div>
              <Link
                href="/meetings"
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                전체 일정
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          }
        />
      </Suspense>

      {/* CTA 섹션 */}
      <section className="bg-bg-surface border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="text-primary" size={28} strokeWidth={1.5} />
            </div>
            <h3 className="heading-themed text-2xl lg:text-3xl font-bold text-text mb-4">
              지독해 멤버십
            </h3>
            <p className="text-text-muted text-lg mb-8 leading-relaxed">
              경주와 포항에서 매주 책 읽는 사람들.
              <br className="hidden sm:block" />
              250명이 함께하고 있어요.
            </p>
            <Link href="/about" className="btn-primary">
              소개 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
