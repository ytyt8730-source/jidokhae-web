'use client'

import { motion } from 'framer-motion'
import MeetingCard from '@/components/MeetingCard'
import { staggerContainer } from '@/lib/animations'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingListProps {
  meetings: MeetingWithStatus[]
  className?: string
}

export default function MeetingList({ meetings, className = '' }: MeetingListProps) {
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
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </motion.div>
  )
}
