'use client'

import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import type { ReactNode } from 'react'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

/**
 * BentoGrid - Design System v3.3 (목업 반영)
 * 대시보드 스타일 그리드 레이아웃
 * 데스크톱: 4열 (Weekly Curator 2열 + Growth 1열 + D-Day 1열)
 * 모바일: 2열
 */
export default function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <motion.div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  span?: 'full' | 'half'
  variant?: 'default' | 'primary' | 'accent'
}

/**
 * BentoCard - 개별 Bento 카드
 */
export function BentoCard({
  children,
  className = '',
  span = 'half',
  variant = 'default',
}: BentoCardProps) {
  // span 'full'은 모바일 2열, 데스크톱 2열 차지
  const spanClass = span === 'full' ? 'col-span-2' : 'col-span-1'

  const variantStyles = {
    default: 'bg-[var(--bg-surface)]',
    primary: 'bg-gradient-to-br from-[var(--primary)] to-blue-600 text-white',
    accent: 'bg-gradient-to-br from-[var(--accent)] to-amber-500',
  }

  return (
    <motion.div
      className={`
        ${spanClass}
        ${variantStyles[variant]}
        rounded-2xl p-5
        shadow-card
        transition-all duration-300
        hover:shadow-card-hover
        ${className}
      `}
      variants={staggerItem}
      whileHover={{ y: -2 }}
    >
      {children}
    </motion.div>
  )
}
