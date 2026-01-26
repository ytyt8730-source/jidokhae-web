import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Clock, ArrowLeft, AlertCircle } from 'lucide-react'
import {
  TRANSFER_BANK_NAME,
  TRANSFER_ACCOUNT_NUMBER,
  TRANSFER_ACCOUNT_HOLDER,
  formatTransferDeadline,
} from '@/lib/transfer'
import CopyButton from './CopyButton'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '입금대기 안내 - 지독해',
}

export default async function TransferPendingPage({ params }: PageProps) {
  const resolvedParams = await params

  const supabase = await createClient()

  // 현재 로그인 사용자
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect(`/auth/login?redirectTo=/meetings/${resolvedParams.id}`)
  }

  // 모임 정보
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, title, datetime, location, fee')
    .eq('id', resolvedParams.id)
    .single()

  if (!meeting) {
    notFound()
  }

  // 신청 정보
  const { data: registration } = await supabase
    .from('registrations')
    .select('id, status, transfer_sender_name, transfer_deadline, payment_amount')
    .eq('user_id', authUser.id)
    .eq('meeting_id', resolvedParams.id)
    .eq('status', 'pending_transfer')
    .single()

  // 신청이 없거나 이미 확정된 경우
  if (!registration) {
    // 확정된 신청이 있는지 확인
    const { data: confirmedReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('meeting_id', resolvedParams.id)
      .eq('status', 'confirmed')
      .single()

    if (confirmedReg) {
      redirect(`/meetings/${resolvedParams.id}/payment-complete`)
    }

    redirect(`/meetings/${resolvedParams.id}`)
  }

  const formatAmount = (amount: number) => amount.toLocaleString() + '원'
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 뒤로 가기 */}
      <Link
        href={`/meetings/${resolvedParams.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        모임 상세로
      </Link>

      <div className="card overflow-hidden">
        {/* 헤더 */}
        <div className="bg-yellow-50 p-6 text-center border-b border-yellow-100">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-yellow-600" size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold heading-themed text-brand-800 mb-2">입금대기 중</h1>
          <p className="text-gray-600">
            아래 계좌로 입금해주시면 참가가 확정됩니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 모임 정보 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-brand-800 mb-1">{meeting.title}</p>
            <p className="text-sm text-gray-600">{formatDate(meeting.datetime)}</p>
          </div>

          {/* 계좌 정보 */}
          <div className="space-y-4">
            <h2 className="font-semibold text-brand-800">입금 계좌 정보</h2>

            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              {/* 은행 */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">은행</span>
                <span className="font-medium text-brand-800">{TRANSFER_BANK_NAME}</span>
              </div>

              {/* 계좌번호 */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">계좌번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-brand-800 font-mono">
                    {TRANSFER_ACCOUNT_NUMBER}
                  </span>
                  <CopyButton text={TRANSFER_ACCOUNT_NUMBER} label="계좌번호" />
                </div>
              </div>

              {/* 예금주 */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">예금주</span>
                <span className="font-medium text-brand-800">{TRANSFER_ACCOUNT_HOLDER}</span>
              </div>

              <hr className="border-gray-200" />

              {/* 입금자명 */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">입금자명</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-600 font-mono text-lg">
                    {registration.transfer_sender_name}
                  </span>
                  <CopyButton
                    text={registration.transfer_sender_name || ''}
                    label="입금자명"
                    highlight
                  />
                </div>
              </div>

              {/* 입금 금액 */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">입금 금액</span>
                <span className="font-bold text-brand-800 text-lg">
                  {formatAmount(registration.payment_amount || meeting.fee)}
                </span>
              </div>
            </div>
          </div>

          {/* 입금 기한 */}
          {registration.transfer_deadline && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-xl">
              <AlertCircle size={20} strokeWidth={1.5} className="text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-orange-800 font-medium">
                  입금 기한: {formatTransferDeadline(registration.transfer_deadline)}
                </p>
                <p className="text-orange-600 text-sm mt-0.5">
                  기한 내 미입금 시 자동 취소됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 안내사항 */}
          <div className="text-sm text-gray-500 space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle size={16} strokeWidth={1.5} className="text-brand-600 mt-0.5 flex-shrink-0" />
              <span>입금자명을 반드시 위와 같이 입력해주세요.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle size={16} strokeWidth={1.5} className="text-brand-600 mt-0.5 flex-shrink-0" />
              <span>입금 확인 후 알림톡으로 참가 확정 안내가 발송됩니다.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle size={16} strokeWidth={1.5} className="text-brand-600 mt-0.5 flex-shrink-0" />
              <span>입금자명이 다를 경우 확인이 지연될 수 있습니다.</span>
            </p>
          </div>

          {/* 버튼 */}
          <div className="space-y-3 pt-2">
            <Link
              href="/mypage"
              className="block w-full py-3 bg-brand-600 text-white text-center rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              마이페이지에서 확인
            </Link>
            <Link
              href="/meetings"
              className="block w-full py-3 border border-gray-200 text-gray-700 text-center rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              다른 모임 둘러보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
