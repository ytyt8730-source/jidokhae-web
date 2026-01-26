'use client'

/**
 * 콩 쏟아지는 효과 컴포넌트
 * M9 Phase 9.2: Commitment Ritual
 *
 * 결제 시 콩이 위에서 쏟아지는 시각 효과
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KongIcon } from '@/components/icons/KongIcon'
import { kongPourContainer, kongPourItem } from '@/lib/animations'
import { useFeedback } from '@/hooks/useFeedback'

interface KongPosition {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  delay: number
}

interface KongPourProps {
  /** 표시 여부 */
  isVisible: boolean
  /** 쏟아지는 콩 개수 */
  count?: number
  /** 완료 콜백 */
  onComplete?: () => void
  /** 사운드/햅틱 활성화 */
  withFeedback?: boolean
  /** 추가 클래스 */
  className?: string
}

// 랜덤 위치 생성
function generateKongPositions(count: number): KongPosition[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10, // 10% ~ 90%
    y: Math.random() * 30 + 20, // 20% ~ 50%
    rotation: Math.random() * 60 - 30, // -30 ~ 30
    scale: Math.random() * 0.5 + 0.75, // 0.75 ~ 1.25
    delay: i * 0.05, // stagger
  }))
}

export function KongPour({
  isVisible,
  count = 15,
  onComplete,
  withFeedback = true,
  className = '',
}: KongPourProps) {
  const [kongs, setKongs] = useState<KongPosition[]>([])
  const { feedback } = useFeedback()

  const initializeKongs = useCallback(() => {
    setKongs(generateKongPositions(count))
  }, [count])

  useEffect(() => {
    if (isVisible) {
      initializeKongs()

      // 피드백 트리거
      if (withFeedback) {
        feedback('payment')
      }

      // 완료 콜백 (애니메이션 시간 후)
      const timer = setTimeout(() => {
        onComplete?.()
      }, count * 50 + 500) // stagger 시간 + 애니메이션 시간

      return () => clearTimeout(timer)
    } else {
      setKongs([])
    }
  }, [isVisible, count, onComplete, withFeedback, feedback, initializeKongs])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={kongPourContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
        >
          {kongs.map((kong) => (
            <motion.div
              key={kong.id}
              variants={kongPourItem}
              custom={kong.delay}
              style={{
                position: 'absolute',
                left: `${kong.x}%`,
                top: `${kong.y}%`,
                transform: `rotate(${kong.rotation}deg) scale(${kong.scale})`,
              }}
            >
              <KongIcon size={32} id={`pour-${kong.id}`} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default KongPour
