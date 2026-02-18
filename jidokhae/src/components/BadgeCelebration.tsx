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
import { Footprints, Target, Flame, Heart, Star, Crown, Award, type LucideIcon } from 'lucide-react'

// No-Emoji Policy: Lucide 아이콘 매핑
const BADGE_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Target,
  Flame,
  Heart,
  Star,
  Crown,
  Award, // fallback
}

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
          <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal-overlay bg-black/40 backdrop-blur-sm"
            onClick={handleNext}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="배지 획득 축하"
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
              className="bg-bg-surface rounded-2xl p-8 max-w-sm w-full text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 배지 아이콘 (No-Emoji Policy: Lucide 사용) */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-brand-100 to-amber-100 rounded-full flex items-center justify-center"
              >
                {(() => {
                  const IconComponent = BADGE_ICONS[badgeInfo.icon] || BADGE_ICONS.Award
                  return <IconComponent size={40} strokeWidth={1.5} className="text-brand-600" />
                })()}
              </motion.div>

              {/* 축하 메시지 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-brand-600 font-medium mb-2">
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
                className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors"
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
          </>
        )}
      </AnimatePresence>
    </>
  )
}
