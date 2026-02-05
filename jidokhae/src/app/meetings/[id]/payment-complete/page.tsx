/**
 * 결제 완료 페이지
 * M2-017: 결제 완료 화면 표시
 *
 * Design Enhancement:
 * - Confetti 효과로 결제 완료 축하 (Sarah Chen: 성취감 극대화)
 * - Spring 애니메이션으로 자연스러운 진입 효과
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import Button from '@/components/ui/Button'
import SuccessConfetti from '@/components/SuccessConfetti'
import { CheckCircle, Calendar, MapPin, ArrowRight } from 'lucide-react'
import type { Meeting, Registration } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentCompletePage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">로그인이 필요합니다.</p>
        <Link href="/auth/login" className="text-primary hover:underline">
          로그인하기
        </Link>
      </div>
    )
  }

  // 모임 정보 조회
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', resolvedParams.id)
    .single() as { data: Meeting | null }

  // 신청 정보 조회 (confirmed 또는 pending - 타이밍 이슈 대응)
  const { data: registration } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('meeting_id', resolvedParams.id)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as { data: Registration | null }

  if (!meeting || !registration) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">신청 정보를 찾을 수 없습니다.</p>
        <Link href="/meetings" className="text-primary hover:underline">
          모임 목록으로
        </Link>
      </div>
    )
  }

  const dday = getDday(meeting.datetime)

  return (
    <>
      {/* Confetti 축하 효과 */}
      <SuccessConfetti />

      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold heading-themed text-text mb-2">
            신청이 완료되었습니다!
          </h1>
          <p className="text-text-muted">
            모임에서 뵙겠습니다 :)
          </p>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-semibold text-text">{meeting.title}</h2>
            <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {dday}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-text-muted">
              <Calendar size={16} strokeWidth={1.5} className="text-primary/60" />
              <span>{formatMeetingDate(meeting.datetime)}</span>
            </div>
            <div className="flex items-center gap-3 text-text-muted">
              <MapPin size={16} strokeWidth={1.5} className="text-primary/60" />
              <span>{meeting.location}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">결제 금액</span>
              <span className="font-semibold text-text">
                {formatFee(registration.payment_amount || meeting.fee)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/mypage" className="block">
            <Button className="w-full">
              마이페이지에서 확인
              <ArrowRight size={16} strokeWidth={1.5} className="ml-1" />
            </Button>
          </Link>
          <Link href="/meetings" className="block">
            <Button variant="secondary" className="w-full">
              다른 모임 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
