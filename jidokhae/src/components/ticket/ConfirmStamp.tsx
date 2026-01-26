'use client'

/**
 * 확정 도장 애니메이션 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * 확정 시 쿵 찍히는 도장 효과
 */

import { motion } from 'framer-motion'
import { useFeedback } from '@/hooks/useFeedback'
import { confirmStamp } from '@/lib/animations'

interface ConfirmStampProps {
  /** 도장 표시 여부 */
  isVisible: boolean
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void
  /** 추가 클래스 */
  className?: string
}

export function ConfirmStamp({
  isVisible,
  onComplete,
  className = '',
}: ConfirmStampProps) {
  const { feedback } = useFeedback()

  const handleAnimationComplete = () => {
    feedback('confirm')
    onComplete?.()
  }

  if (!isVisible) return null

  return (
    <motion.div
      variants={confirmStamp}
      initial="hidden"
      animate="visible"
      onAnimationComplete={handleAnimationComplete}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${className}`}
    >
      <div
        className="
          border-4 border-brand-600 text-brand-600
          px-4 py-2 rounded-lg
          font-bold text-lg tracking-wider
          rotate-[-5deg]
          bg-white/50
        "
      >
        CONFIRMED
      </div>
    </motion.div>
  )
}

export default ConfirmStamp
