'use client'

/**
 * 확정 모달 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * 입금 확인 후 자동으로 표시되는 축하 모달
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Download } from 'lucide-react'
import { Confetti } from '@/components/effects/Confetti'
import { ConfirmStamp } from './ConfirmStamp'
import Ticket from './Ticket'
import { generateCalendarUrl } from '@/lib/ticket'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import type { TicketData } from '@/types/ticket'

interface ConfirmationModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean
  /** 닫기 콜백 */
  onClose: () => void
  /** 티켓 데이터 */
  ticketData: TicketData
  /** 이미지 저장 콜백 */
  onSaveImage?: () => void
}

export function ConfirmationModal({
  isOpen,
  onClose,
  ticketData,
  onSaveImage,
}: ConfirmationModalProps) {
  const [showStamp, setShowStamp] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // 모달이 열릴 때 애니메이션 시퀀스 시작
  useEffect(() => {
    if (isOpen) {
      // 약간의 딜레이 후 confetti
      const confettiTimer = setTimeout(() => {
        setShowConfetti(true)
      }, 300)

      // confetti 후 도장
      const stampTimer = setTimeout(() => {
        setShowStamp(true)
      }, 800)

      return () => {
        clearTimeout(confettiTimer)
        clearTimeout(stampTimer)
      }
    } else {
      setShowStamp(false)
      setShowConfetti(false)
    }
  }, [isOpen])

  const handleAddToCalendar = () => {
    const url = generateCalendarUrl(ticketData)
    window.open(url, '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti 효과 */}
          <Confetti trigger={showConfetti} />

          {/* 배경 오버레이 */}
          <motion.div
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* 모달 콘텐츠 */}
          <motion.div
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-xl">
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
              >
                <X size={20} />
              </button>

              {/* 헤더 */}
              <div className="text-center pt-8 pb-4 px-6">
                <h2 className="text-xl font-bold text-brand-800">
                  참여가 확정되었어요
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  함께 읽을 준비가 되었습니다
                </p>
              </div>

              {/* 티켓 */}
              <div className="px-6 py-4 relative">
                <Ticket
                  data={{ ...ticketData, status: 'confirmed' }}
                  variant="full"
                  showPerforation={false}
                  animated
                />

                {/* 확정 도장 */}
                <ConfirmStamp isVisible={showStamp} />
              </div>

              {/* 액션 버튼들 */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={handleAddToCalendar}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-3 px-4 rounded-xl
                    bg-brand-50 text-brand-700
                    hover:bg-brand-100 transition-colors
                    font-medium
                  "
                >
                  <Calendar size={18} />
                  캘린더에 추가
                </button>

                {onSaveImage && (
                  <button
                    onClick={onSaveImage}
                    className="
                      w-full flex items-center justify-center gap-2
                      py-3 px-4 rounded-xl
                      border border-gray-200 text-gray-700
                      hover:bg-gray-50 transition-colors
                      font-medium
                    "
                  >
                    <Download size={18} />
                    이미지로 저장
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="
                    w-full py-3 px-4 rounded-xl
                    bg-brand-600 text-white
                    hover:bg-brand-700 transition-colors
                    font-medium
                  "
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal
