/**
 * 칭찬하기 페이지
 * M4 소속감 - Phase 2
 *
 * 같은 모임 참가자 중 1명 선택 + 칭찬 문구 선택
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import PraiseForm from './PraiseForm'

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
    title: `칭찬하기 - ${meeting.title} - 지독해`,
    description: '모임에서 좋았던 분에게 익명으로 감사를 전해보세요.',
  }
}

export default async function PraisePage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 현재 로그인 사용자 조회
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/login?redirect=/meetings/${resolvedParams.id}/praise`)
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
  const { data: myRegistration } = await supabase
    .from('registrations')
    .select('id, participation_status')
    .eq('user_id', authUser.id)
    .eq('meeting_id', meeting.id)
    .eq('status', 'confirmed')
    .single()

  if (!myRegistration) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <Heart size={48} className="mx-auto text-warm-400 mb-4" />
          <h1 className="text-xl font-bold text-warm-900 mb-2">
            참여 기록이 없습니다
          </h1>
          <p className="text-warm-600 mb-6">
            해당 모임에 참가 신청 내역이 없습니다.
          </p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            모임 목록으로
          </Link>
        </div>
      </div>
    )
  }

  // 같은 모임의 다른 참가자 목록 조회 (본인 제외)
  const { data: participants } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      users!registrations_user_id_fkey (
        id,
        name
      )
    `)
    .eq('meeting_id', meeting.id)
    .eq('status', 'confirmed')
    .neq('user_id', authUser.id)

  const participantList = participants?.map((p: { users: unknown }) => {
    const user = p.users as { id: string; name: string }
    return {
      id: user.id,
      name: user.name,
    }
  }) || []

  // 이미 이 모임에서 칭찬했는지 확인
  const { data: existingPraise } = await supabase
    .from('praises')
    .select('id, to_user_id, message_type')
    .eq('from_user_id', authUser.id)
    .eq('meeting_id', meeting.id)
    .single()

  if (existingPraise) {
    const praiseReceiver = participantList.find((p: { id: string }) => p.id === existingPraise.to_user_id)
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-6">
            <Heart size={32} className="text-yellow-600" />
          </div>
          <h1 className="text-xl font-bold text-warm-900 mb-2">
            이미 칭찬했어요
          </h1>
          <p className="text-warm-600 mb-6">
            {praiseReceiver?.name || '참가자'}님에게<br />
            따뜻한 마음을 전달했습니다.
          </p>
          <Link
            href={`/meetings/${meeting.id}/feedback/complete`}
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            완료 화면으로
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
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 mb-6"
      >
        <ArrowLeft size={16} />
        뒤로
      </Link>

      <div className="card overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 sm:p-8 border-b border-warm-100 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <Heart size={24} className="text-yellow-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-warm-900 mb-2">
            누구에게 칭찬을 전할까요?
          </h1>
          <p className="text-warm-600 text-sm">
            익명으로 전달됩니다
          </p>
        </div>

        {/* 칭찬 폼 */}
        {participantList.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-warm-600">
              다른 참가자가 없습니다.
            </p>
          </div>
        ) : (
          <PraiseForm
            meetingId={meeting.id}
            participants={participantList}
          />
        )}
      </div>
    </div>
  )
}
