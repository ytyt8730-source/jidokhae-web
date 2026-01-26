'use client'

/**
 * 티켓 스텁 컴포넌트
 * M9 Phase 9.1: Commitment Ritual
 *
 * 티켓 보관함에서 사용하는 작은 스텁 형태
 */

import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import {
  formatSeatNumber,
  formatTicketDate,
  getTicketStatusColor,
} from '@/lib/ticket'
import type { TicketStubProps } from '@/types/ticket'

export default function TicketStub({
  data,
  onClick,
  className = '',
}: TicketStubProps) {
  const isPending = data.status === 'pending_payment' || data.status === 'pending_transfer'
  const isUsed = data.status === 'used'
  const isCancelled = data.status === 'cancelled'

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left bg-white rounded-xl overflow-hidden
        shadow-sm border border-gray-100
        hover:shadow-md transition-shadow
        ${isPending ? 'opacity-70' : ''}
        ${isCancelled ? 'opacity-50 grayscale' : ''}
        ${className}
      `}
    >
      {/* 상단 색상 바 */}
      <div className={`h-1 ${
        isPending ? 'bg-yellow-400' :
        isUsed ? 'bg-gray-400' :
        isCancelled ? 'bg-red-400' :
        'bg-brand-600'
      }`} />

      <div className="p-3">
        {/* 모임 제목 */}
        <h3 className="font-semibold text-brand-800 text-sm mb-2 line-clamp-1">
          {data.meetingTitle}
        </h3>

        {/* 날짜/시간 */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
          <Calendar size={12} strokeWidth={1.5} />
          <span>{formatTicketDate(data.meetingDate)}</span>
        </div>

        {/* 장소 */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <MapPin size={12} strokeWidth={1.5} />
          <span className="line-clamp-1">{data.meetingLocation}</span>
        </div>

        {/* 좌석 및 상태 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-brand-600 font-medium">
            {formatSeatNumber(data.seatNumber)}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTicketStatusColor(data.status)}`}>
            {data.status === 'confirmed' ? '확정' :
             data.status === 'pending_transfer' ? '입금대기' :
             data.status === 'pending_payment' ? '결제대기' :
             data.status === 'used' ? '완료' : '취소'}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
