/**
 * 결제 완료 페이지
 * M2-017: 결제 완료 화면 표시
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import Button from '@/components/ui/Button'
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
        <p className="text-gray-600">로그인이 필요합니다.</p>
        <Link href="/auth/login" className="text-brand-600 hover:underline">
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

  // 신청 정보 조회
  const { data: registration } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('meeting_id', resolvedParams.id)
    .eq('status', 'confirmed')
    .single() as { data: Registration | null }

  if (!meeting || !registration) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">신청 정보를 찾을 수 없습니다.</p>
        <Link href="/meetings" className="text-brand-600 hover:underline">
          모임 목록으로
        </Link>
      </div>
    )
  }

  const dday = getDday(meeting.datetime)

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold font-serif text-brand-800 mb-2">
          신청이 완료되었습니다!
        </h1>
        <p className="text-gray-600">
          모임에서 뵙겠습니다 :)
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-brand-800">{meeting.title}</h2>
          <span className="text-sm font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
            {dday}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar size={16} strokeWidth={1.5} className="text-gray-400" />
            <span>{formatMeetingDate(meeting.datetime)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin size={16} strokeWidth={1.5} className="text-gray-400" />
            <span>{meeting.location}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-medium text-brand-800">
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
  )
}
