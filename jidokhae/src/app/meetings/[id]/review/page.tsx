/**
 * 후기 작성 페이지
 * M4 소속감 - Phase 2
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, PenLine, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'
import ReviewForm from './ReviewForm'

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
    title: `후기 남기기 - ${meeting.title} - 지독해`,
    description: '모임 경험을 나눠주세요.',
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/login?redirect=/meetings/${resolvedParams.id}/review`)
  }

  // 모임 정보 조회
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('id, title, datetime')
    .eq('id', resolvedParams.id)
    .single()

  if (meetingError || !meeting) {
    notFound()
  }

  // 본인의 등록 정보 확인
  const { data: registration } = await supabase
    .from('registrations')
    .select('id, participation_status')
    .eq('user_id', authUser.id)
    .eq('meeting_id', meeting.id)
    .eq('status', 'confirmed')
    .single()

  if (!registration) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <PenLine size={48} strokeWidth={1.5} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-xl font-bold font-serif text-brand-800 mb-2">
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

  // 이미 후기를 작성했는지 확인
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, content')
    .eq('user_id', authUser.id)
    .eq('meeting_id', meeting.id)
    .single()

  if (existingReview) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <CheckCircle size={48} strokeWidth={1.5} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold font-serif text-brand-800 mb-2">
            이미 후기를 작성했어요
          </h1>
          <p className="text-gray-600 mb-6">
            소중한 후기를 남겨주셔서 감사합니다.
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 뒤로 가기 */}
      <Link
        href={`/meetings/${meeting.id}/feedback`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        뒤로
      </Link>

      <div className="card overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 sm:p-8 border-b border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <PenLine size={24} strokeWidth={1.5} className="text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-brand-800 mb-2">
            모임은 어떠셨나요?
          </h1>
          <p className="text-gray-600 text-sm">
            {meeting.title}
          </p>
        </div>

        {/* 후기 폼 */}
        <ReviewForm
          meetingId={meeting.id}
        />
      </div>
    </div>
  )
}
