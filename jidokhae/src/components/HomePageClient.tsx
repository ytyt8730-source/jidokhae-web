'use client'

/**
 * HomePageClient - Design System v3.3 (One-Page Architecture)
 *
 * 홈페이지 클라이언트 래퍼:
 * - Bottom Sheet 상태 관리
 * - URL 파라미터 동기화 (?meeting=uuid)
 * - 딥링크 처리
 *
 * Design Note (Marcus Wei):
 * - 서버 컴포넌트에서 데이터 패칭 후 클라이언트에서 인터랙션 처리
 *
 * UX Note (Sarah Chen):
 * - 홈에서 3-Click 결제 플로우 완성
 * - 컨텍스트 유지하면서 모임 정보 확인
 */

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import MeetingList from '@/components/MeetingList'
import MeetingBottomSheet from '@/components/MeetingBottomSheet'
import type { MeetingWithStatus, User } from '@/types/database'

interface HomePageClientProps {
  /** 이번 주 모임 목록 */
  thisWeekMeetings: MeetingWithStatus[]
  /** 다가오는 모임 목록 */
  upcomingMeetings: MeetingWithStatus[]
  /** 현재 사용자 */
  user: User | null
  /** 섹션 제목 (이번 주 모임 섹션용) */
  thisWeekTitle?: React.ReactNode
  /** 섹션 제목 (다가오는 모임 섹션용) */
  upcomingTitle?: React.ReactNode
  /** 빈 상태 컴포넌트 */
  emptyState?: React.ReactNode
}

export default function HomePageClient({
  thisWeekMeetings,
  upcomingMeetings,
  user,
  thisWeekTitle,
  upcomingTitle,
  emptyState,
}: HomePageClientProps) {
  const searchParams = useSearchParams()
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithStatus | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // 모든 모임 합치기 (딥링크용)
  const allMeetings = [...thisWeekMeetings, ...upcomingMeetings]

  // 딥링크 처리: URL 파라미터에서 모임 ID 읽기
  useEffect(() => {
    const meetingId = searchParams.get('meeting')
    if (meetingId) {
      const meeting = allMeetings.find((m) => m.id === meetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
        setIsSheetOpen(true)
      }
    }
  }, [searchParams, allMeetings])

  // popstate 이벤트 처리 (브라우저 뒤로/앞으로 버튼)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const meetingId = params.get('meeting')

      if (meetingId) {
        const meeting = allMeetings.find((m) => m.id === meetingId)
        if (meeting) {
          setSelectedMeeting(meeting)
          setIsSheetOpen(true)
        }
      } else {
        setIsSheetOpen(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [allMeetings])

  // 카드 클릭 핸들러
  const handleMeetingSelect = useCallback((meeting: MeetingWithStatus) => {
    setSelectedMeeting(meeting)
    setIsSheetOpen(true)
  }, [])

  // Sheet 닫기 핸들러
  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false)
    // URL 정리는 MeetingBottomSheet 내부에서 처리
  }, [])

  return (
    <>
      {/* 이번 주 모임 섹션 */}
      {thisWeekMeetings.length > 0 && (
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            {thisWeekTitle}
            <MeetingList
              meetings={thisWeekMeetings}
              mode="sheet"
              onMeetingSelect={handleMeetingSelect}
            />
          </div>
        </section>
      )}

      {/* 다가오는 모임 섹션 */}
      <section className="bg-bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {upcomingTitle}
          {upcomingMeetings.length > 0 ? (
            <MeetingList
              meetings={upcomingMeetings}
              mode="sheet"
              onMeetingSelect={handleMeetingSelect}
            />
          ) : thisWeekMeetings.length === 0 ? (
            emptyState || (
              <div className="bg-[var(--bg-surface)] rounded-2xl p-12 text-center shadow-sm">
                <p className="text-[var(--text-muted)]">현재 예정된 모임이 없습니다.</p>
              </div>
            )
          ) : null}
        </div>
      </section>

      {/* Bottom Sheet */}
      <MeetingBottomSheet
        meeting={selectedMeeting}
        user={user}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />
    </>
  )
}
