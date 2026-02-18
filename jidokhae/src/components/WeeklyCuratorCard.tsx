'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { staggerItem } from '@/lib/animations'
import { formatFee } from '@/lib/utils'
import { KongIcon } from '@/components/icons/KongIcon'
import type { Meeting } from '@/types/database'

interface WeeklyCuratorCardProps {
  meeting: Meeting | null
  className?: string
}

/**
 * WeeklyCuratorCard - Design System v3.3 (목업 반영)
 * Atmospheric Cover + 책/저자 정보 + 가격
 */
export default function WeeklyCuratorCard({ meeting, className = '' }: WeeklyCuratorCardProps) {
  if (!meeting) {
    return (
      <motion.div
        className={`
          col-span-2
          bg-[var(--bg-surface)]
          rounded-2xl p-6
          shadow-card
          border border-[var(--border)]
          ${className}
        `}
        variants={staggerItem}
      >
        <span className="section-label">Weekly Curator</span>
        <p className="mt-3 text-body text-[var(--text-muted)]">
          이번 주 추천 모임이 없습니다.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`
        col-span-2
        bg-[var(--bg-surface)]
        rounded-2xl
        shadow-card
        hover:shadow-card-hover
        transition-all duration-300
        border border-[var(--border)]
        overflow-hidden
        ${className}
      `}
      variants={staggerItem}
      whileHover={{ y: -2 }}
    >
      <Link href={`/meetings/${meeting.id}`} className="flex gap-5 p-6">
        {/* Atmospheric Cover */}
        <div className="flex-shrink-0 w-[100px] sm:w-[140px] h-[140px] sm:h-[180px] relative rounded-2xl overflow-hidden">
          {/* Blur Background */}
          <div
            className="absolute inset-[-20px] bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-base)] to-[var(--border)] opacity-60"
            style={{ filter: 'blur(25px) saturate(1.3)' }}
          />

          {/* Book Cover Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-[70px] sm:w-[100px] h-[100px] sm:h-[140px] bg-white rounded shadow-lg flex items-center justify-center` /* bg-white-allowed: book cover */}>
              <BookOpen
                className="text-[var(--text-muted)]"
                size={32}
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <span className="section-label">Weekly Curator</span>

          <h3 className="mt-2 text-xl font-bold heading-themed line-clamp-2">
            {meeting.title}
          </h3>

          {meeting.description && (
            <p className="text-sm text-[var(--text-muted)] mt-3 line-clamp-2">
              {meeting.description}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto pt-4 flex items-center gap-1.5">
            <KongIcon size={18} />
            <span className="font-bold text-[var(--text)]">{formatFee(meeting.fee)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
