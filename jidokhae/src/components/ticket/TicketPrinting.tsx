'use client'

/**
 * 티켓 인쇄 애니메이션 컴포넌트
 * M9 Phase 9.2: Commitment Ritual
 *
 * 위->아래 타자기처럼 출력되는 발권 효과
 */

import { motion } from 'framer-motion'
import { Calendar, MapPin, User } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useFeedback } from '@/hooks/useFeedback'
import {
  formatSeatNumber,
  formatParticipationCount,
  formatTicketDate,
  formatTicketTime,
  generateTicketId,
} from '@/lib/ticket'
import { ticketSlit, ticketPrinting } from '@/lib/animations'
import type { TicketData } from '@/types/ticket'

interface TicketPrintingProps {
  /** 티켓 데이터 */
  data: TicketData
  /** 인쇄 시작 여부 */
  isPrinting: boolean
  /** 인쇄 완료 콜백 */
  onComplete?: () => void
  /** 추가 클래스 */
  className?: string
}

export function TicketPrinting({
  data,
  isPrinting,
  onComplete,
  className = '',
}: TicketPrintingProps) {
  const { feedback } = useFeedback()
  const ticketId = generateTicketId(data.meetingDate, data.seatNumber)

  // 각 필드별 타자 효과
  const title = useTypewriter(data.meetingTitle, {
    speed: 40,
    delay: 500,
    onType: () => feedback('tick'),
  })

  const date = useTypewriter(
    `${formatTicketDate(data.meetingDate)} ${formatTicketTime(data.meetingDate)}`,
    {
      speed: 30,
      delay: title.isComplete ? 0 : 999999,
      onType: () => feedback('tick'),
    }
  )

  const location = useTypewriter(data.meetingLocation, {
    speed: 30,
    delay: date.isComplete ? 0 : 999999,
    onType: () => feedback('tick'),
  })

  const seat = useTypewriter(formatSeatNumber(data.seatNumber), {
    speed: 60,
    delay: location.isComplete ? 0 : 999999,
    onType: () => feedback('tick'),
  })

  const participation = useTypewriter(
    formatParticipationCount(data.participationCount),
    {
      speed: 40,
      delay: seat.isComplete ? 0 : 999999,
      onType: () => feedback('tick'),
      onComplete: () => {
        feedback('success')
        onComplete?.()
      },
    }
  )

  if (!isPrinting) return null

  return (
    <motion.div
      variants={ticketSlit}
      initial="hidden"
      animate="visible"
      className={`w-full max-w-sm mx-auto ${className}`}
    >
      <motion.div
        variants={ticketPrinting}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
      >
        {/* 상단 헤더 (브랜드 영역) */}
        <div className="bg-brand-600 text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium opacity-80">지독해</span>
              <span className="text-xs opacity-60">|</span>
              <span className="text-xs opacity-80">경주/포항 독서모임</span>
            </div>
            <span className="text-xs font-mono opacity-80">{ticketId}</span>
          </div>
        </div>

        {/* 모임 정보 (타자 효과) */}
        <div className="px-5 py-4 border-b border-dashed border-gray-200">
          <h2 className="text-lg font-bold text-brand-800 mb-3 leading-tight min-h-[28px]">
            {title.displayText}
            {!title.isComplete && (
              <span className="animate-pulse text-brand-400">|</span>
            )}
          </h2>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 min-h-[20px]">
              <Calendar size={14} strokeWidth={1.5} className="text-gray-400" />
              <span>
                {date.displayText}
                {title.isComplete && !date.isComplete && (
                  <span className="animate-pulse text-gray-400">|</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 min-h-[20px]">
              <MapPin size={14} strokeWidth={1.5} className="text-gray-400" />
              <span>
                {location.displayText}
                {date.isComplete && !location.isComplete && (
                  <span className="animate-pulse text-gray-400">|</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 좌석 및 참여 정보 */}
        <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">좌석</p>
            <p className="text-2xl font-bold font-mono text-brand-800 min-h-[32px]">
              {seat.displayText}
              {location.isComplete && !seat.isComplete && (
                <span className="animate-pulse text-brand-400">|</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">참여</p>
            <p className="text-sm font-medium text-brand-600 min-h-[20px]">
              {participation.displayText}
              {seat.isComplete && !participation.isComplete && (
                <span className="animate-pulse text-brand-400">|</span>
              )}
            </p>
          </div>
        </div>

        {/* 회원 정보 */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-sm font-medium text-brand-800">
              {data.userName}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
            발권 중
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TicketPrinting
