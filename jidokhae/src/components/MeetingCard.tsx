'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, ChevronRight, BookOpen } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { KongIcon } from '@/components/icons/KongIcon'
import { formatFee } from '@/lib/utils'
import { cardHoverTap, staggerItem, pulseAnimation } from '@/lib/animations'
import { useMeetingParticipants } from '@/hooks/useMeetingParticipants'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingCardProps {
  meeting: MeetingWithStatus
  /** Realtime 구독 활성화 여부 (기본: true) */
  enableRealtime?: boolean
}

// 숫자 변경 애니메이션
const countAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.2 }
}

/**
 * MeetingCard - Design System v3.3 (목업 반영)
 * Atmospheric Cover 영역 + 메타 정보 + 가격
 * Beta: Realtime 참가 인원 업데이트
 */
export default function MeetingCard({ meeting, enableRealtime = true }: MeetingCardProps) {
  // Realtime 참가 인원 구독
  const { participantCount } = useMeetingParticipants({
    meetingId: meeting.id,
    initialCount: meeting.current_participants,
  })

  // Realtime이 비활성화된 경우 원본 값 사용
  const displayCount = enableRealtime ? participantCount : meeting.current_participants

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
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayCount}
                    {...countAnimation}
                  >
                    {displayCount}명 참여
                  </motion.span>
                </AnimatePresence>
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

