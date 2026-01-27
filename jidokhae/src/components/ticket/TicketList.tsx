'use client'

/**
 * TicketList 컴포넌트
 * M9 Phase 9.4: 티켓 보관함
 *
 * 티켓 스텁 그리드 표시
 */

import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import TicketStub from './TicketStub'
import type { TicketData } from '@/types/ticket'
import { MICROCOPY } from '@/lib/constants/microcopy'

interface TicketListProps {
  tickets: TicketData[]
  onTicketClick: (ticket: TicketData) => void
  emptyMessage?: string
}

export default function TicketList({
  tickets,
  onTicketClick,
  emptyMessage,
}: TicketListProps) {
  // 빈 상태
  if (tickets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-16 text-center"
      >
        <p className="text-text-secondary">
          {emptyMessage || MICROCOPY.empty.registrations}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4"
    >
      {tickets.map((ticket) => (
        <motion.div key={ticket.id} variants={staggerItem}>
          <TicketStub
            data={ticket}
            onClick={() => onTicketClick(ticket)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
