'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, ChevronRight, BookOpen } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { KongIcon } from '@/components/icons/KongIcon'
import { formatFee } from '@/lib/utils'
import { cardHoverTap, staggerItem, pulseAnimation } from '@/lib/animations'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingCardProps {
  meeting: MeetingWithStatus
}

/**
 * MeetingCard - Design System v3.3 (목업 반영)
 * Atmospheric Cover 영역 + 메타 정보 + 가격
 */
export default function MeetingCard({ meeting }: MeetingCardProps) {
  const getStatusBadge = () => {
    switch (meeting.displayStatus) {
      case 'closing_soon':
        return (
          <motion.span
            variants={pulseAnimation}
            animate="pulse"
          >
            <Badge variant="warning">마감임박</Badge>
          </motion.span>
        )
      case 'closed':
        return <Badge variant="default">마감</Badge>
      case 'waitlist_available':
        return <Badge variant="info">대기 가능</Badge>
      default:
        return null
    }
  }

  const getMeetingTypeBadge = () => {
    const types: Record<string, { label: string; variant: 'brand' | 'info' | 'default' }> = {
      regular: { label: '정기', variant: 'brand' },
      discussion: { label: '토론', variant: 'info' },
      other: { label: '특별', variant: 'default' },
    }
    const type = types[meeting.meeting_type] || types.other
    return <Badge variant={type.variant}>{type.label}</Badge>
  }

  // 날짜/시간 파싱
  const datetime = new Date(meeting.datetime)
  const dateStr = datetime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const timeStr = datetime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <motion.div
      variants={staggerItem}
      whileHover={cardHoverTap.hover}
      whileTap={cardHoverTap.tap}
    >
      <Link href={`/meetings/${meeting.id}`}>
        <article className="card overflow-hidden group cursor-pointer">
          {/* Atmospheric Cover Area */}
          <div className="session-cover relative h-40">
            {/* Atmospheric Blur Background (placeholder gradient) */}
            <div
              className="absolute inset-[-30px] bg-gradient-to-br from-warm-200 via-warm-100 to-warm-300"
              style={{ filter: 'blur(25px) saturate(1.3)' }}
            />

            {/* Book Cover Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-auto h-[140px] aspect-[3/4] bg-white/90 rounded shadow-lg flex items-center justify-center">
                <BookOpen
                  className="text-warm-400"
                  size={32}
                  strokeWidth={1.5}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
              {getMeetingTypeBadge()}
              {getStatusBadge()}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="font-semibold text-[var(--text)] text-[1.1rem] mb-3 truncate group-hover:text-[var(--primary)] transition-colors">
              {meeting.title}
            </h3>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-[13px] text-[var(--text-muted)] mb-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} strokeWidth={1.5} />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} strokeWidth={1.5} />
                {timeStr}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} strokeWidth={1.5} />
                {meeting.location.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} strokeWidth={1.5} />
                {meeting.current_participants}명 참여
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <KongIcon size={18} />
                <span className="font-semibold text-[var(--text)]">{formatFee(meeting.fee)}</span>
              </div>
              <ChevronRight size={20} className="text-[var(--text-muted)]" />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

