'use client'

/**
 * 티켓 발권 전체 Flow 컴포넌트
 * M9 Phase 9.2: Commitment Ritual
 *
 * 결제 -> 콩 쏟아짐 -> 발권 애니메이션 순서
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KongPour } from '@/components/effects/KongPour'
import { TicketPrinting } from '@/components/ticket/TicketPrinting'
import Ticket from '@/components/ticket/Ticket'
import { useFeedback } from '@/hooks/useFeedback'
import type { TicketData } from '@/types/ticket'

type IssuancePhase = 'idle' | 'kong' | 'printing' | 'complete'

interface TicketIssuanceProps {
  /** 티켓 데이터 */
  ticketData: TicketData
  /** 발권 시작 트리거 */
  isTriggered: boolean
  /** 발권 완료 콜백 */
  onComplete?: () => void
  /** 추가 클래스 */
  className?: string
}

export function TicketIssuance({
  ticketData,
  isTriggered,
  onComplete,
  className = '',
}: TicketIssuanceProps) {
  const [phase, setPhase] = useState<IssuancePhase>('idle')
  const { feedback } = useFeedback()

  // 발권 시작
  useEffect(() => {
    if (isTriggered && phase === 'idle') {
      setPhase('kong')
    }
  }, [isTriggered, phase])

  // 콩 애니메이션 완료
  const handleKongComplete = useCallback(() => {
    // 짧은 딜레이 후 인쇄 시작
    setTimeout(() => {
      setPhase('printing')
    }, 300)
  }, [])

  // 인쇄 완료
  const handlePrintingComplete = useCallback(() => {
    // 짧은 딜레이 후 완료 상태
    setTimeout(() => {
      setPhase('complete')
      feedback('success')
      onComplete?.()
    }, 500)
  }, [feedback, onComplete])

  return (
    <div className={`relative ${className}`}>
      {/* 콩 쏟아지는 효과 */}
      <KongPour
        isVisible={phase === 'kong'}
        count={20}
        onComplete={handleKongComplete}
        withFeedback
      />

      {/* 메인 콘텐츠 */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[400px]"
          >
            <p className="text-gray-500">결제를 진행해주세요</p>
          </motion.div>
        )}

        {phase === 'kong' && (
          <motion.div
            key="kong"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] gap-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
              className="text-4xl"
            >
              <span className="text-brand-600 font-bold">
                {ticketData.amount?.toLocaleString() || '15,000'}콩
              </span>
            </motion.div>
            <p className="text-sm text-gray-500">결제 처리 중...</p>
          </motion.div>
        )}

        {phase === 'printing' && (
          <motion.div
            key="printing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TicketPrinting
              data={ticketData}
              isPrinting
              onComplete={handlePrintingComplete}
            />
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Ticket
              data={ticketData}
              variant="full"
              showPerforation
              animated
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TicketIssuance
