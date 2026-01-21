import MeetingList from '@/components/MeetingList'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateMeetingStatus, formatMeetingDate } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import { CalendarDays, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { BannerSlide } from '@/components/BannerSlide'
import type { Meeting, Registration } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // 로그인한 사용자의 신청 모임 조회 (M2-048)
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
    .limit(6) as { data: Meeting[] | null }

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* 배너 슬라이드 */}
      {banners && banners.length > 0 && (
        <section>
          <BannerSlide banners={banners} />
        </section>
      )}

      {/* 히어로 섹션 */}
      <section className="text-center py-12 space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-warm-900">
          <span className="text-gradient">지독해</span>와 함께하는
          <br />
          따뜻한 독서 시간
        </h1>
        <p className="text-warm-600 text-lg max-w-xl mx-auto">
          경주와 포항에서 매주 열리는 독서모임입니다.
          <br className="hidden sm:block" />
          함께 책을 읽고, 생각을 나눠요.
        </p>
      </section>

      {/* 내 신청 모임 (M2-048) - 로그인 사용자만 표시 */}
      {authUser && myRegistrations.length > 0 && (
        <section className="card bg-gradient-to-r from-brand-50 to-brand-100/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-warm-900">
              <CheckCircle className="text-brand-500" size={20} />
              내 신청 모임
            </h2>
            <Link
              href="/mypage"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {myRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/meetings/${reg.meeting_id}`}
                className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="success">{getDday(reg.meetings.datetime)}</Badge>
                  <span className="font-medium text-warm-900">{reg.meetings.title}</span>
                </div>
                <span className="text-sm text-warm-500">
                  {formatMeetingDate(reg.meetings.datetime)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 이번 주 모임 */}
      {thisWeekMeetings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-warm-900">
              <CalendarDays className="text-brand-500" size={24} />
              이번 주 모임
            </h2>
          </div>
          <MeetingList meetings={thisWeekMeetings} />
        </section>
      )}

      {/* 다가오는 모임 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-warm-900">
            {thisWeekMeetings.length > 0 ? '다가오는 모임' : '모임 일정'}
          </h2>
          <Link 
            href="/meetings"
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            전체 보기
            <ArrowRight size={16} />
          </Link>
        </div>
        
        {upcomingMeetings.length > 0 ? (
          <MeetingList meetings={upcomingMeetings} />
        ) : thisWeekMeetings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-warm-500">등록된 모임이 없습니다.</p>
          </div>
        ) : null}
      </section>

      {/* CTA 섹션 */}
      <section className="card bg-gradient-to-br from-brand-50 to-brand-100 p-8 text-center">
        <h3 className="text-xl font-semibold text-warm-900 mb-2">
          지독해가 처음이신가요?
        </h3>
        <p className="text-warm-600 mb-6">
          독서모임이 어떤 곳인지 궁금하다면 소개 페이지를 확인해보세요.
        </p>
        <Link href="/about" className="btn-primary">
          지독해 알아보기
        </Link>
      </section>
    </div>
  )
}
