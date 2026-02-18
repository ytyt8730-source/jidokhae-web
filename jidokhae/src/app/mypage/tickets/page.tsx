'use client'

/**
 * 티켓 보관함 페이지
 * M9 Phase 9.4: Commitment Ritual
 *
 * 사용자의 티켓 목록 (예정/지난)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTickets } from '@/hooks/useTickets'
import { useFeedback } from '@/hooks/useFeedback'
import { useToast } from '@/components/ui/Toast'
import { createLogger } from '@/lib/logger'
import TicketsPageHeader from '@/components/ticket/TicketsPageHeader'
import TicketsTabs from '@/components/ticket/TicketsTabs'
import TicketList from '@/components/ticket/TicketList'
import TicketDetailModal from '@/components/ticket/TicketDetailModal'
import CancelBottomSheet from '@/components/cancel/CancelBottomSheet'
import CancelComplete from '@/components/cancel/CancelComplete'
import { MICROCOPY } from '@/lib/constants/microcopy'
import type { TicketData } from '@/types/ticket'

const logger = createLogger('tickets-page')

type Tab = 'upcoming' | 'past'

export default function TicketsPage() {
  const router = useRouter()
  const { feedback } = useFeedback()
  const { showToast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false)
  const [isCancelComplete, setIsCancelComplete] = useState(false)

  const { upcoming, past, loading, error, refetch } = useTickets(userId || '')

  // 사용자 ID 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirectTo=/mypage/tickets')
        return
      }
      setUserId(user.id)
    }
    fetchUser()
  }, [router])

  /**
   * 티켓 클릭 (상세 모달 열기)
   */
  const handleTicketClick = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setIsDetailModalOpen(true)
    feedback('tick')
  }

  /**
   * 상세 모달 닫기
   */
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setTimeout(() => setSelectedTicket(null), 300)
  }

  /**
   * 취소 버튼 클릭 (Bottom Sheet 열기)
   */
  const handleOpenCancelSheet = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setIsDetailModalOpen(false)
    setTimeout(() => setIsCancelSheetOpen(true), 300)
  }

  /**
   * 취소 Sheet 닫기
   */
  const handleCloseCancelSheet = () => {
    setIsCancelSheetOpen(false)
  }

  /**
   * 취소 확정 (API 호출)
   * - 환불 계산, 대기자 알림, 결제 로그 모두 서버에서 처리
   */
  const handleConfirmCancel = async (ticket: TicketData) => {
    try {
      logger.info('Cancelling registration via API', { registrationId: ticket.id })

      const response = await fetch('/api/registrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: ticket.id,
          cancelReason: 'user_requested',
        }),
      })

      const result = await response.json()

      // API 에러 처리
      if (!response.ok) {
        throw new Error(result.error?.message || '취소 처리 중 오류가 발생했습니다')
      }

      // 비즈니스 로직 실패 (이미 취소됨 등)
      if (!result.data?.success) {
        showToast(result.data?.message || '취소할 수 없습니다', 'error')
        setIsCancelSheetOpen(false)
        return
      }

      logger.info('Registration cancelled successfully', {
        refundAmount: result.data.refundAmount,
        refundPercent: result.data.refundPercent,
      })

      feedback('success')

      // 환불 정보 포함 Toast 표시
      showToast(result.data.message, 'success')

      // 취소 완료 화면으로 전환
      setIsCancelSheetOpen(false)
      setIsCancelComplete(true)

      // 티켓 목록 새로고침
      await refetch()
    } catch (err) {
      logger.error('Failed to cancel registration', { error: err })
      feedback('error')
      showToast(err instanceof Error ? err.message : '취소 처리 중 문제가 발생했습니다', 'error')
      setIsCancelSheetOpen(false)
    }
  }

  /**
   * 홈으로 이동
   */
  const handleGoHome = () => {
    router.push('/')
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary">{MICROCOPY.status.loading}</p>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary">{error}</p>
      </div>
    )
  }

  // 취소 완료 화면
  if (isCancelComplete) {
    return <CancelComplete onGoHome={handleGoHome} />
  }

  // 메인 화면
  const displayTickets = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <TicketsPageHeader />
      <TicketsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 티켓 목록 */}
      <TicketList
        tickets={displayTickets}
        onTicketClick={handleTicketClick}
        emptyMessage={
          activeTab === 'upcoming'
            ? MICROCOPY.empty.registrations
            : MICROCOPY.empty.completedMeetings
        }
      />

      {/* 티켓 상세 모달 */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onCancel={handleOpenCancelSheet}
      />

      {/* 취소 Bottom Sheet */}
      <CancelBottomSheet
        ticket={selectedTicket}
        isOpen={isCancelSheetOpen}
        onClose={handleCloseCancelSheet}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
