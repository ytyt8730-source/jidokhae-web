'use client'

/**
 * 배지 획득 축하 컴포넌트
 * Confetti 효과와 배지 정보 표시
 * PRD DS-011: Confetti 효과 (배지 획득 시)
 */

import { useState, useEffect, useCallback } from 'react'
import Confetti from 'react-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { getBadgeInfo } from '@/lib/badges-client'

interface BadgeCelebrationProps {
  /**
   * 획득한 배지 타입 배열
   */
  badges: string[]
  /**
   * 축하 완료 후 콜백
   */
  onComplete?: () => void
}

export default function BadgeCelebration({ badges, onComplete }: BadgeCelebrationProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)

  // 윈도우 사이즈 추적
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Confetti 시작
  useEffect(() => {
    if (badges.length > 0) {
      setShowConfetti(true)
      setShowModal(true)

      // 3초 후 Confetti 종료
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false)
      }, 3000)

      return () => clearTimeout(confettiTimer)
    }
  }, [badges])

  // 현재 표시할 배지 정보
  const currentBadge = badges[currentBadgeIndex]
  const badgeInfo = currentBadge ? getBadgeInfo(currentBadge) : null

  // 다음 배지 또는 완료
  const handleNext = useCallback(() => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex((prev) => prev + 1)
    } else {
      setShowModal(false)
      onComplete?.()
    }
  }, [currentBadgeIndex, badges.length, onComplete])

  if (badges.length === 0) {
    return null
  }

  return (
    <>
      {/* Confetti 효과 */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#c77654', '#fbbf24', '#34d399', '#60a5fa', '#f472b6']}
        />
      )}

      {/* 배지 획득 모달 */}
      <AnimatePresence>
        {showModal && badgeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={handleNext}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 배지 아이콘 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: 0.2,
                }}
                className="text-6xl mb-4"
              >
                {badgeInfo.icon}
              </motion.div>

              {/* 축하 메시지 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-brand-500 font-medium mb-2">
                  새로운 배지 획득!
                </p>
                <h2 className="text-2xl font-bold text-brand-800 mb-2">
                  {badgeInfo.name}
                </h2>
                <p className="text-gray-600 mb-6">
                  {badgeInfo.description}
                </p>
              </motion.div>

              {/* 버튼 */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleNext}
                className="w-full py-3 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
              >
                {currentBadgeIndex < badges.length - 1 ? '다음 배지 보기' : '확인'}
              </motion.button>

              {/* 배지 카운터 (여러 개일 때) */}
              {badges.length > 1 && (
                <p className="text-sm text-gray-400 mt-4">
                  {currentBadgeIndex + 1} / {badges.length}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
