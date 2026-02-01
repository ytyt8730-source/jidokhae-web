'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

interface AtmosphericCoverProps {
  coverUrl?: string | null
  title: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * AtmosphericCover - Design System v3.3
 * 책 커버 이미지 뒤에 블러 처리된 배경을 추가하여 분위기 있는 효과를 연출
 * blur(25px) saturate(1.3) 적용
 */
export default function AtmosphericCover({
  coverUrl,
  title,
  className = '',
  size = 'md',
}: AtmosphericCoverProps) {
  const [imageError, setImageError] = useState(false)

  const sizeStyles = {
    sm: {
      container: 'h-24 w-16',
      cover: 'h-20 w-14',
    },
    md: {
      container: 'h-32 w-24',
      cover: 'h-28 w-20',
    },
    lg: {
      container: 'h-48 w-36',
      cover: 'h-44 w-32',
    },
  }

  const styles = sizeStyles[size]

  // 커버 이미지가 없거나 에러인 경우 플레이스홀더
  if (!coverUrl || imageError) {
    return (
      <div className={`relative ${styles.container} ${className}`}>
        <div className={`
          ${styles.cover}
          bg-gradient-to-br from-[var(--bg-base)] to-[var(--bg-surface)]
          rounded-lg flex items-center justify-center
          shadow-md
        `}>
          <BookOpen
            className="text-[var(--text-muted)]"
            size={size === 'lg' ? 32 : size === 'md' ? 24 : 16}
            strokeWidth={1.5}
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`relative ${styles.container} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Atmospheric Blur Background */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: `url(${coverUrl}) center/cover`,
          filter: 'blur(25px) saturate(1.3)',
          transform: 'scale(1.5)',
          opacity: 0.6,
        }}
      />

      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />

      {/* Main Cover Image */}
      <div className={`
        relative ${styles.cover}
        mx-auto mt-1
        rounded-lg overflow-hidden
        shadow-lg
        ring-1 ring-white/20
      `}>
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes={size === 'lg' ? '144px' : size === 'md' ? '80px' : '56px'}
        />
      </div>
    </motion.div>
  )
}
