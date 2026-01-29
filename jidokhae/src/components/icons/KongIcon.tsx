'use client'

/**
 * Kong(콩) 아이콘
 * M9 Phase 9.2: Commitment Ritual
 * MX-L01: 색상 변경 (Gold/Brown → Green)
 *
 * 초록색 그라데이션 콩 아이콘
 */

import { motion } from 'framer-motion'

interface KongIconProps {
  /** 아이콘 크기 (px) */
  size?: number
  /** 추가 클래스 */
  className?: string
  /** Idle 애니메이션 활성화 */
  animated?: boolean
  /** 고유 ID (여러 개 렌더링 시 그라데이션 구분용) */
  id?: string
}

// Kong Idle 애니메이션 variants
const kongIdleVariants = {
  idle: {
    rotate: [-3, 3, -3],
    y: [-1, 1, -1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

export function KongIcon({
  size = 24,
  className = '',
  animated = false,
  id = 'kong',
}: KongIconProps) {
  const gradientId = `kong-gradient-${id}`
  const highlightId = `kong-highlight-${id}`

  const SvgContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-label="콩"
    >
      <defs>
        {/* 메인 그라데이션 (Green) */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" /> {/* Light Green */}
          <stop offset="50%" stopColor="#22C55E" /> {/* Green */}
          <stop offset="100%" stopColor="#166534" /> {/* Dark Green */}
        </linearGradient>

        {/* 하이라이트 그라데이션 */}
        <radialGradient
          id={highlightId}
          cx="30%"
          cy="30%"
          r="50%"
          fx="30%"
          fy="30%"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* 콩 본체 (타원형) */}
      <ellipse
        cx="12"
        cy="12"
        rx="8"
        ry="10"
        fill={`url(#${gradientId})`}
        stroke="#166534"
        strokeWidth="0.5"
      />

      {/* 콩 중앙 라인 */}
      <path
        d="M12 3 Q10 12 12 21"
        stroke="#166534"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />

      {/* 광택 하이라이트 */}
      <ellipse cx="9" cy="8" rx="2.5" ry="3.5" fill={`url(#${highlightId})`} />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        variants={kongIdleVariants}
        animate="idle"
        className="inline-flex"
      >
        {SvgContent}
      </motion.div>
    )
  }

  return SvgContent
}

export default KongIcon
