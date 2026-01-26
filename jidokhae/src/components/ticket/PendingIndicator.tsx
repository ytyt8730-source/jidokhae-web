'use client'

/**
 * 대기 중 상태 표시 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * "확인을 기다리는 중" 점 애니메이션 포함
 */

import { motion } from 'framer-motion'

interface PendingIndicatorProps {
  /** 표시 텍스트 */
  text?: string
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 추가 클래스 */
  className?: string
}

const sizeStyles = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-1.5',
  lg: 'text-base gap-2',
}

const dotSizes = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
}

export function PendingIndicator({
  text = '확인을 기다리는 중',
  size = 'md',
  className = '',
}: PendingIndicatorProps) {
  return (
    <div
      className={`
        flex items-center ${sizeStyles[size]}
        text-orange-600
        ${className}
      `}
    >
      <span>{text}</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
            className={`${dotSizes[size]} rounded-full bg-current`}
          />
        ))}
      </div>
    </div>
  )
}

export default PendingIndicator
