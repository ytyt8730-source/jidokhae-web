/**
 * 참여 완료 선택 화면
 * M4 소속감 - Phase 1
 *
 * 모임 종료 후 3일 뒤 알림 링크로 접근
 * - 칭찬하기: 참가자에게 익명 칭찬 전달
 * - 참여했어요: 단순 참여 완료 처리
 * - 후기 남기기: 모임 후기 작성
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeft, CheckCircle, BookOpen, Frown } from 'lucide-react'
import type { Metadata } from 'next'
import FeedbackOptions from './FeedbackOptions'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: meeting } = await supabase
    .from('meetings')
    .select('title')
    .eq('id', resolvedParams.id)
    .single()

  if (!meeting) {
    return { title: '모임을 찾을 수 없습니다 - 지독해' }
  }

  return {
    title: `${meeting.title} 어떠셨어요? - 지독해`,
    description: '모임 참여 경험을 알려주세요.',
  }
}

export default async function FeedbackPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/login?redirect=/meetings/${resolvedParams.id}/feedback`)
  }

  // 모임 정보 조회
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('id, title, datetime, location')
    .eq('id', resolvedParams.id)
    .single()

  if (meetingError || !meeting) {
    notFound()
  }

  // 사용자의 등록 정보 확인
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('id, status, participation_status, participation_method')
    .eq('user_id', authUser.id)
    .eq('meeting_id', meeting.id)
    .eq('status', 'confirmed')
    .single()

  if (regError || !registration) {
    // 해당 모임에 참가 기록이 없음
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <BookOpen size={48} strokeWidth={1.5} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-xl font-bold heading-themed text-brand-800 mb-2">
            참여 기록이 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            해당 모임에 참가 신청 내역이 없습니다.
          </p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            모임 목록으로
          </Link>
        </div>
      </div>
    )
  }

  // 이미 참여 완료 처리된 경우
  if (registration.participation_status === 'completed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <CheckCircle size={48} strokeWidth={1.5} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold heading-themed text-brand-800 mb-2">
            이미 참여 완료되었습니다
          </h1>
          <p className="text-gray-600 mb-2">
            {meeting.title}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {registration.participation_method === 'praise' && '칭찬하기로 완료'}
            {registration.participation_method === 'review' && '후기 남기기로 완료'}
            {registration.participation_method === 'confirm' && '참여 확인 완료'}
            {registration.participation_method === 'auto' && '자동 완료 처리됨'}
            {registration.participation_method === 'admin' && '운영자 처리'}
          </p>
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            마이페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  // 노쇼 처리된 경우
  if (registration.participation_status === 'no_show') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Frown size={24} strokeWidth={1.5} className="text-gray-500" />
          </div>
          <h1 className="text-xl font-bold heading-themed text-brand-800 mb-2">
            미참여 처리된 모임입니다
          </h1>
          <p className="text-gray-600 mb-6">
            다음 모임에서 만나요!
          </p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            다음 모임 보기
          </Link>
        </div>
      </div>
    )
  }

  const meetingDate = format(new Date(meeting.datetime), 'M월 d일', { locale: ko })

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 뒤로 가기 */}
      <Link
        href="/mypage"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        마이페이지로
      </Link>

      <div className="card overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 sm:p-8 border-b border-gray-100 text-center">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} strokeWidth={1.5} className="text-brand-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold heading-themed text-brand-800 mb-2">
            {meeting.title} 어떠셨어요?
          </h1>
          <p className="text-gray-600">
            {meetingDate}에 함께한 모임이
            <br />
            어떠셨는지 알려주세요!
          </p>
        </div>

        {/* 선택 옵션 */}
        <FeedbackOptions
          meetingId={meeting.id}
          registrationId={registration.id}
        />

        {/* 안내 문구 */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <p className="text-xs text-gray-500 text-center">
            셋 중 하나를 선택하면 참여 완료!
          </p>
        </div>
      </div>
    </div>
  )
}
