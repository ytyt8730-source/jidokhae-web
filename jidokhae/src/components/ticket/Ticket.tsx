'use client'

/**
 * 티켓 컴포넌트
 * M9 Phase 9.1: Commitment Ritual
 *
 * 전체 티켓 UI를 렌더링하는 메인 컴포넌트
 */

import { motion } from 'framer-motion'
import { Calendar, MapPin, User } from 'lucide-react'
import {
  formatSeatNumber,
  formatParticipationCount,
  formatTicketDate,
  formatTicketTime,
  generateTicketId,
  getTicketStatusLabel,
} from '@/lib/ticket'
import type { TicketProps } from '@/types/ticket'
import TicketPerforation from './TicketPerforation'

export default function Ticket({
  data,
  variant = 'full',
  showPerforation = true,
  animated = false,
  onTear,
  className = '',
}: TicketProps) {
  const ticketId = generateTicketId(data.meetingDate, data.seatNumber)
  const isPending = data.status === 'pending_payment' || data.status === 'pending_transfer'
  const isConfirmed = data.status === 'confirmed'

  // 티켓 크기 설정
  const sizeClasses = {
    full: 'w-full max-w-sm',
    stub: 'w-full max-w-[200px]',
    mini: 'w-full max-w-[160px]',
  }

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${sizeClasses[variant]} ${className}`}
    >
      {/* 메인 티켓 */}
      <div
        className={`
          relative bg-white rounded-2xl overflow-hidden
          shadow-lg border border-gray-100
          ${isPending ? 'opacity-60' : ''}
        `}
      >
        {/* 상단 헤더 (브랜드 영역) */}
        <div className="bg-brand-600 text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium opacity-80">지독해</span>
              <span className="text-xs opacity-60">|</span>
              <span className="text-xs opacity-80">경주·포항 독서모임</span>
            </div>
            <span className="text-xs font-mono opacity-80">{ticketId}</span>
          </div>
        </div>

        {/* 모임 정보 */}
        <div className="px-5 py-4 border-b border-dashed border-gray-200">
          <h2 className="text-lg font-bold text-brand-800 mb-3 leading-tight">
            {data.meetingTitle}
          </h2>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={14} strokeWidth={1.5} className="text-gray-400" />
              <span>{formatTicketDate(data.meetingDate)}</span>
              <span className="text-brand-600 font-medium">
                {formatTicketTime(data.meetingDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} strokeWidth={1.5} className="text-gray-400" />
              <span>{data.meetingLocation}</span>
            </div>
          </div>
        </div>

        {/* 좌석 및 참여 정보 */}
        <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">좌석</p>
            <p className="text-2xl font-bold font-mono text-brand-800">
              {formatSeatNumber(data.seatNumber)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">참여</p>
            <p className="text-sm font-medium text-brand-600">
              {formatParticipationCount(data.participationCount)}
            </p>
          </div>
        </div>

        {/* 회원 정보 */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-sm font-medium text-brand-800">{data.userName}</span>
          </div>
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${isConfirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
          `}>
            {getTicketStatusLabel(data.status)}
          </span>
        </div>

        {/* 확정 도장 (confirmed 상태일 때만) */}
        {isConfirmed && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 rotate-[-15deg] pointer-events-none">
            <div className="
              border-4 border-brand-600 rounded-lg px-3 py-1
              text-brand-600 font-bold text-lg tracking-wider
              opacity-30
            ">
              CONFIRMED
            </div>
          </div>
        )}

        {/* Pending 스탬프 (대기 상태일 때) */}
        {isPending && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 rotate-[-15deg] pointer-events-none">
            <div className="
              border-4 border-orange-400 rounded-lg px-3 py-1
              text-orange-400 font-bold text-sm tracking-wider
              opacity-50
            ">
              PENDING
            </div>
          </div>
        )}
      </div>

      {/* 절취선 */}
      {showPerforation && variant === 'full' && (
        <TicketPerforation onTear={onTear} />
      )}

      {/* 스텁 (절취선 아래) */}
      {showPerforation && variant === 'full' && (
        <div className="mt-1 bg-white rounded-b-xl shadow-md border border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">{ticketId}</span>
            <span>STUB</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
