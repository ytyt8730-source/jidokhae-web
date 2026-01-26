'use client'

/**
 * 스텁 날아가는 효과 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * 절취선에서 찢은 후 스텁이 보관함으로 날아가는 효과
 */

import { motion, AnimatePresence } from 'framer-motion'
import { stubFlyaway } from '@/lib/animations'
import { useFeedback } from '@/hooks/useFeedback'
import { useEffect } from 'react'

interface StubFlyawayProps {
  /** 날아가기 시작 여부 */
  isFlying: boolean
  /** 날아갈 목표 위치 (뷰포트 기준) */
  targetPosition?: { x: number; y: number }
  /** 완료 콜백 */
  onComplete?: () => void
  /** 스텁 내용 */
  children: React.ReactNode
  /** 추가 클래스 */
  className?: string
}

export function StubFlyaway({
  isFlying,
  targetPosition = { x: 100, y: -100 },
  onComplete,
  children,
  className = '',
}: StubFlyawayProps) {
  const { feedback } = useFeedback()

  useEffect(() => {
    if (isFlying) {
      feedback('tear')
    }
  }, [isFlying, feedback])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!isFlying ? (
        <motion.div
          key="stub"
          variants={stubFlyaway}
          initial="hidden"
          exit="flyaway"
          custom={targetPosition}
          className={className}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="stub-flying"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: 0,
            x: targetPosition.x,
            y: targetPosition.y,
            scale: 0.5,
            rotate: 15,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default StubFlyaway
