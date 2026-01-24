'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Coins, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { cardHoverTap, staggerItem, pulseAnimation } from '@/lib/animations'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingCardProps {
  meeting: MeetingWithStatus
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const getStatusBadge = () => {
    switch (meeting.displayStatus) {
      case 'closing_soon':
        return (
          <motion.span
            variants={pulseAnimation}
            animate="pulse"
          >
            <Badge variant="warning">마감 임박</Badge>
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
      regular: { label: '정기모임', variant: 'brand' },
      discussion: { label: '토론모임', variant: 'info' },
      other: { label: '특별모임', variant: 'default' },
    }
    const type = types[meeting.meeting_type] || types.other
    return <Badge variant={type.variant}>{type.label}</Badge>
  }

  return (
    <motion.div
      variants={staggerItem}
      whileHover={cardHoverTap.hover}
      whileTap={cardHoverTap.tap}
    >
      <Link href={`/meetings/${meeting.id}`}>
        <article className="card p-6 group cursor-pointer">
        {/* 상단: 뱃지들 */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {meeting.isThisWeek && (
            <Badge variant="success">이번 주</Badge>
          )}
          {getMeetingTypeBadge()}
          {getStatusBadge()}
        </div>

        {/* 제목 */}
        <h3 className="font-serif font-semibold text-brand-800 text-lg mb-3 group-hover:text-brand-600 transition-colors">
          {meeting.title}
        </h3>

        {/* 정보 */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
            <span>{formatMeetingDate(meeting.datetime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{meeting.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
            <span>{formatFee(meeting.fee)}</span>
          </div>
        </div>

        {/* 하단: 참가 인원 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users size={16} strokeWidth={1.5} />
            <span>{meeting.current_participants}명 참여</span>
          </div>
        </div>
        </article>
      </Link>
    </motion.div>
  )
}

