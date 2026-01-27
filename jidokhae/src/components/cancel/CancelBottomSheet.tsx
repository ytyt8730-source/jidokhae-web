'use client'

/**
 * CancelBottomSheet 컴포넌트
 * M9 Phase 9.4: 취소 Flow
 *
 * Bottom Sheet 스타일 취소 확인 모달
 * - 긍정적 리마인더
 * - 환불 규정 Collapsible
 * - 두 개의 버튼 (다시 생각하기 / 취소하기)
 */

import { useState } from 'react'
import { Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayAnimation } from '@/lib/animations'
import Button from '@/components/ui/Button'
import RefundPolicySection from './RefundPolicySection'
import { MICROCOPY } from '@/lib/constants/microcopy'
import type { TicketData } from '@/types/ticket'

interface CancelBottomSheetProps {
  ticket: TicketData | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (ticket: TicketData) => void
}

// Bottom Sheet 애니메이션 (아래에서 올라옴)
const bottomSheetAnimation = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

export default function CancelBottomSheet({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}: CancelBottomSheetProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  if (!ticket) return null

  /**
   * 취소 확정
   */
  const handleConfirmCancel = async () => {
    setIsCancelling(true)
    onConfirm(ticket)
  }

  /**
   * 환불 금액 계산 (간단한 버전, 실제는 서버에서 계산)
   */
  const getRefundAmount = (): number => {
    const now = new Date()
    const meetingDate = ticket.meetingDate
    const daysUntilMeeting = Math.ceil(
      (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 간단한 규칙 (실제는 DB refund_policies 기반)
    if (daysUntilMeeting >= 3) return ticket.amount // 100%
    if (daysUntilMeeting >= 2) return Math.floor(ticket.amount * 0.5) // 50%
    return 0 // 0%
  }

  const refundAmount = getRefundAmount()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center">
            <motion.div
              variants={bottomSheetAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-bg-base rounded-t-3xl w-full max-w-md shadow-2xl"
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* 내용 */}
              <div className="px-6 pb-6">
                {/* 타이틀 */}
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  {MICROCOPY.cancel.title}
                </h2>

                {/* 긍정적 리마인더 */}
                <div className="bg-bg-surface rounded-xl p-4 mb-4">
                  <div className="flex gap-3">
                    <Info size={20} strokeWidth={1.5} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">
                        {MICROCOPY.cancel.reminder}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {MICROCOPY.cancel.reminderSub}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 환불 규정 Collapsible */}
                <div className="mb-6">
                  <RefundPolicySection refundAmount={refundAmount} />
                </div>

                {/* 버튼 */}
                <div className="flex flex-col gap-2">
                  {/* 취소하기 */}
                  <Button
                    variant="ghost"
                    onClick={handleConfirmCancel}
                    disabled={isCancelling}
                    className="w-full text-text-tertiary"
                  >
                    {isCancelling ? '처리 중...' : MICROCOPY.cancel.confirmCancel}
                  </Button>

                  {/* 다시 생각하기 (Primary) */}
                  <Button
                    variant="primary"
                    onClick={onClose}
                    disabled={isCancelling}
                    className="w-full"
                  >
                    {MICROCOPY.cancel.thinkAgain}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
