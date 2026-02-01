'use client'

import { motion } from 'framer-motion'
import MeetingCard from '@/components/MeetingCard'
import { staggerContainer } from '@/lib/animations'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingListProps {
  meetings: MeetingWithStatus[]
  className?: string
  /** 카드 동작 모드: 'link'=페이지 이동, 'sheet'=Bottom Sheet 열기 */
  mode?: 'link' | 'sheet'
  /** mode='sheet'일 때 카드 클릭 핸들러 */
  onMeetingSelect?: (meeting: MeetingWithStatus) => void
}

export default function MeetingList({
  meetings,
  className = '',
  mode = 'link',
  onMeetingSelect,
}: MeetingListProps) {
  if (meetings.length === 0) {
    return null
  }

  return (
    <motion.div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          mode={mode}
          onSelect={onMeetingSelect}
        />
      ))}
    </motion.div>
  )
}
