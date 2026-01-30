'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getDday } from '@/lib/payment'
import { staggerItem } from '@/lib/animations'
import type { Meeting, Registration } from '@/types/database'

interface DdayCardProps {
  registration: (Registration & { meetings: Meeting }) | null
  className?: string
}

/**
 * DdayCard - Design System v3.3 (목업 반영)
 * Electric: accent 테두리 + 흰 배경
 * Warm: accent 배경 + 흰 텍스트
 */
export default function DdayCard({ registration, className = '' }: DdayCardProps) {
  // 신청 내역이 없는 경우
  if (!registration) {
    return (
      <motion.div
        className={`
          col-span-1
          dday-card
          rounded-2xl p-5
          shadow-card
          text-center
          flex flex-col items-center justify-center
          ${className}
        `}
        variants={staggerItem}
      >
        <span className="section-label dday-label">NEXT</span>
        <p className="mt-2 text-body-sm dday-text-muted">
          예정된 모임이 없습니다.
        </p>
        <Link
          href="/meetings"
          className="mt-3 text-xs font-medium dday-link underline"
        >
          모임 둘러보기
        </Link>
      </motion.div>
    )
  }

  const meeting = registration.meetings
  const dday = getDday(meeting.datetime)
  const isToday = dday === 'D-Day'

  return (
    <motion.div
      className={`
        col-span-1
        dday-card
        rounded-2xl p-5
        shadow-card
        hover:shadow-card-hover
        transition-all duration-300
        text-center
        flex flex-col items-center justify-center
        ${className}
      `}
      variants={staggerItem}
      whileHover={{ y: -2 }}
    >
      <Link href={`/meetings/${meeting.id}`} className="block">
        {/* Section Label */}
        <span className="section-label dday-label">NEXT</span>

        {/* D-Day Number */}
        <motion.div
          className="my-2"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-[3.5rem] font-black leading-none dday-number">
            {isToday ? 'D-Day' : dday}
          </span>
        </motion.div>

        {/* Meeting Name */}
        <p className="text-[13px] dday-meeting-name truncate max-w-full">
          {meeting.title}
        </p>

        {/* Link */}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium dday-link underline">
          준비물 확인하기
          <ArrowRight size={12} />
        </span>
      </Link>
    </motion.div>
  )
}
