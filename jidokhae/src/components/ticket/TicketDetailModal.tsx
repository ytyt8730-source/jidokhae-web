'use client'

/**
 * TicketDetailModal 컴포넌트
 * M9 Phase 9.4: 티켓 보관함
 *
 * 티켓 상세 모달 (전체 티켓 + 액션 버튼 + 취소 버튼)
 */

import { useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import Ticket from './Ticket'
import TicketActions from './TicketActions'
import Button from '@/components/ui/Button'
import { MICROCOPY } from '@/lib/constants/microcopy'
import type { TicketData } from '@/types/ticket'

interface TicketDetailModalProps {
  ticket: TicketData | null
  isOpen: boolean
  onClose: () => void
  onCancel?: (ticket: TicketData) => void
  onTear?: (ticket: TicketData) => void
}

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  onCancel,
  onTear,
}: TicketDetailModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  if (!ticket) return null

  const isConfirmed = ticket.status === 'confirmed'
  const isPast = ticket.meetingDate < new Date()
  // 확정된 미래 티켓만 절취선 표시 (찢기 가능)
  const canTear = isConfirmed && !isPast && !!onTear

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

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              variants={modalAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-bg-base rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            >
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg-surface hover:bg-bg-hover transition-colors"
                aria-label="닫기"
              >
                <X size={20} strokeWidth={1.5} className="text-text-secondary" />
              </button>

              {/* 티켓 */}
              <div className="p-6 pb-4" ref={ticketRef}>
                <Ticket
                  data={ticket}
                  variant="full"
                  showPerforation={canTear}
                  onTear={() => onTear?.(ticket)}
                  animated={false}
                />
              </div>

              {/* 찢기 힌트 (canTear일 때만) */}
              {canTear && (
                <div className="px-6 pb-2">
                  <p className="text-xs text-center text-text-tertiary">
                    가위를 밀어서 티켓을 뜯으면 스텁이 보관함에 저장됩니다
                  </p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="px-6 pb-4">
                <TicketActions ticket={ticket} ticketRef={ticketRef} />
              </div>

              {/* 취소 버튼 (confirmed 상태 + 미래 모임만) */}
              {isConfirmed && !isPast && onCancel && (
                <div className="px-6 pb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(ticket)}
                    className="w-full text-text-tertiary"
                  >
                    {MICROCOPY.buttons.cancel}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
