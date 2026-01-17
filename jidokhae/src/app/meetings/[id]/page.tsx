import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateMeetingStatus, formatMeetingDate, formatFee } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PaymentButton from '@/components/PaymentButton'
import { Calendar, MapPin, Coins, Users, ArrowLeft, Clock } from 'lucide-react'
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

  const formatRefundRules = () => {
    if (!refundPolicy?.rules) return null

    const rules = refundPolicy.rules as { days_before: number; refund_percent: number }[]
    return rules
      .sort((a, b) => b.days_before - a.days_before)
      .map((rule, index) => (
        <li key={index} className="text-sm text-warm-600">
          {rule.days_before === 0
            ? '당일'
            : `${rule.days_before}일 전`}: {rule.refund_percent}% 환불
        </li>
      ))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 뒤로 가기 */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 mb-6"
      >
        <ArrowLeft size={16} />
        모임 목록으로
      </Link>

      <article className="card overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 sm:p-8 border-b border-warm-100">
          {/* 뱃지들 */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {meetingWithStatus.isThisWeek && (
              <Badge variant="success">이번 주</Badge>
            )}
            {getMeetingTypeBadge()}
            {getStatusBadge()}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 mb-4">
            {meeting.title}
          </h1>

          {/* 핵심 정보 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-warm-700">
              <Calendar size={20} className="text-brand-500" />
              <span>{formatMeetingDate(meeting.datetime)}</span>
            </div>
            <div className="flex items-center gap-3 text-warm-700">
              <MapPin size={20} className="text-brand-500" />
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-3 text-warm-700">
              <Coins size={20} className="text-brand-500" />
              <span className="font-medium">{formatFee(meeting.fee)}</span>
            </div>
            <div className="flex items-center gap-3 text-warm-700">
              <Users size={20} className="text-brand-500" />
              <span>{meeting.current_participants}명 참여</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* 모임 설명 */}
          {meeting.description && (
            <div>
              <h2 className="text-lg font-semibold text-warm-900 mb-3">모임 안내</h2>
              <p className="text-warm-600 whitespace-pre-wrap leading-relaxed">
                {meeting.description}
              </p>
            </div>
          )}

          {/* 환불 규정 */}
          {refundPolicy && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-warm-900 mb-3">
                <Clock size={18} />
                환불 규정
              </h2>
              <ul className="space-y-1.5 list-disc list-inside pl-1">
                {formatRefundRules()}
              </ul>
            </div>
          )}

          {/* 신청 버튼 (M2-007) */}
          <div className="pt-4 border-t border-warm-100">
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

