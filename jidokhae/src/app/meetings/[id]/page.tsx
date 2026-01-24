import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateMeetingStatus, formatMeetingDate, formatFee } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PaymentButton from '@/components/PaymentButton'
import { Calendar, MapPin, Coins, Users, ArrowLeft } from 'lucide-react'
import RefundRulesSection from '@/components/RefundRulesSection'
import AtmospherePreview from '@/components/AtmospherePreview'
import type { Metadata } from 'next'
import type { User, Meeting, RefundPolicy } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: meeting } = await supabase
    .from('meetings')
    .select('title, description')
    .eq('id', resolvedParams.id)
    .single()

  if (!meeting) {
    return { title: '모임을 찾을 수 없습니다 - 지독해' }
  }

  return {
    title: `${meeting.title} - 지독해`,
    description: meeting.description || `${meeting.title} 모임에 참여해보세요.`,
  }
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let currentUser: User | null = null

  if (authUser) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single() as { data: User | null }
    currentUser = userData
  }

  // 모임 정보 조회
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      *,
      refund_policies (
        id,
        name,
        rules
      )
    `)
    .eq('id', resolvedParams.id)
    .single() as { data: (Meeting & { refund_policies: RefundPolicy | null }) | null; error: Error | null }

  if (error || !meeting) {
    notFound()
  }

  // 이미 신청했는지 확인
  let alreadyRegistered = false
  if (currentUser) {
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('meeting_id', meeting.id)
      .neq('status', 'cancelled')
      .single()
    alreadyRegistered = !!existingReg
  }

  // M7-003: 공개 동의한 후기 조회 (신규회원에게만 표시)
  let publicReviews: { content: string }[] = []
  if (currentUser?.is_new_member) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('content')
      .eq('is_public', true)
      .limit(10)
    
    if (reviews && reviews.length > 0) {
      // 랜덤 셔플 후 3개 선택
      const shuffled = reviews.sort(() => Math.random() - 0.5)
      publicReviews = shuffled.slice(0, 3)
    }
  }

  const meetingWithStatus = calculateMeetingStatus(meeting)

  // 환불 규정
  const refundPolicy = meeting.refund_policies

  const getStatusBadge = () => {
    switch (meetingWithStatus.displayStatus) {
      case 'closing_soon':
        return <Badge variant="warning">마감 임박</Badge>
      case 'closed':
        return <Badge variant="default">마감</Badge>
      case 'waitlist_available':
        return <Badge variant="info">대기 가능</Badge>
      default:
        return <Badge variant="success">모집중</Badge>
    }
  }

  const getMeetingTypeBadge = () => {
    const types: Record<string, { label: string; variant: 'brand' | 'info' | 'default' }> = {
      regular: { label: '정기모임', variant: 'brand' },
      discussion: { label: '토론모임', variant: 'info' },
      other: { label: '특별모임', variant: 'default' },
    }
    const type = types[meeting.meeting_type] || types.other
    return <Badge variant={type.variant}>{type.label}</Badge>
  }

  // 환불 규정 데이터 추출
  const refundRules = refundPolicy?.rules as { days_before: number; refund_percent: number }[] | undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 뒤로 가기 */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        모임 목록으로
      </Link>

      <article className="card overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          {/* 뱃지들 */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {meetingWithStatus.isThisWeek && (
              <Badge variant="success">이번 주</Badge>
            )}
            {getMeetingTypeBadge()}
            {getStatusBadge()}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-brand-800 mb-4">
            {meeting.title}
          </h1>

          {/* 핵심 정보 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar size={20} className="text-brand-500" strokeWidth={1.5} />
              <span>{formatMeetingDate(meeting.datetime)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin size={20} className="text-brand-500" strokeWidth={1.5} />
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Coins size={20} className="text-brand-500" strokeWidth={1.5} />
              <span className="font-medium">{formatFee(meeting.fee)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Users size={20} className="text-brand-500" strokeWidth={1.5} />
              <span>{meeting.current_participants}명 참여</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* M7-003: 분위기 미리보기 (신규회원만) */}
          {currentUser?.is_new_member && publicReviews.length > 0 && (
            <AtmospherePreview reviews={publicReviews} />
          )}

          {/* 모임 설명 */}
          {meeting.description && (
            <div>
              <h2 className="text-lg font-semibold text-brand-800 mb-3">모임 안내</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {meeting.description}
              </p>
            </div>
          )}

          {/* 환불 규정 (M7-001: "더보기"로 접기) */}
          {refundRules && refundRules.length > 0 && (
            <RefundRulesSection 
              rules={refundRules} 
              policyName={refundPolicy?.name}
            />
          )}

          {/* 신청 버튼 (M2-007) */}
          <div className="pt-4 border-t border-gray-100">
            {/* M7-002: 첫 방문 벳지 넣지 배너 (신규회원만) */}
            {currentUser?.is_new_member && !alreadyRegistered && meetingWithStatus.displayStatus !== 'closed' && (
              <div className="mb-4 p-3 bg-brand-50 rounded-xl flex items-center gap-3 animate-pulse-slow">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎖️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-700">
                    첫 모임 신청 시 <span className="font-bold">웰컴 멤버</span> 벳지가 지급됩니다!
                  </p>
                </div>
              </div>
            )}

            {alreadyRegistered ? (
              <div>
                <Button disabled className="w-full sm:w-auto">
                  신청 완료
                </Button>
                <p className="text-xs text-brand-600 mt-3">
                  이미 신청한 모임입니다. 마이페이지에서 확인하세요.
                </p>
              </div>
            ) : meetingWithStatus.displayStatus === 'closed' ? (
              <Button disabled className="w-full sm:w-auto">
                마감되었습니다
              </Button>
            ) : (
              <PaymentButton
                meeting={meeting}
                user={currentUser}
              />
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

