'use client'

/**
 * TicketActions 컴포넌트
 * M9 Phase 9.4: 티켓 보관함
 *
 * 이미지 저장, 캘린더 추가 버튼
 */

import { useState } from 'react'
import { Download, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { MICROCOPY } from '@/lib/constants/microcopy'
import { saveTicketAsImage, downloadICS } from '@/lib/ticket-export'
import { generateCalendarUrl } from '@/lib/ticket'
import { useFeedback } from '@/hooks/useFeedback'
import type { TicketData } from '@/types/ticket'

interface TicketActionsProps {
  ticket: TicketData
  ticketRef: React.RefObject<HTMLDivElement>
}

export default function TicketActions({ ticket, ticketRef }: TicketActionsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { feedback } = useFeedback()

  /**
   * 이미지로 저장
   */
  const handleSaveImage = async () => {
    if (!ticketRef.current || isSaving) return

    setIsSaving(true)
    feedback('send')

    const fileName = `jidokhae-${ticket.meetingTitle}-${ticket.seatNumber}.png`
    const success = await saveTicketAsImage(ticketRef.current, fileName)

    setIsSaving(false)

    if (success) {
      feedback('success')
    }
  }

  /**
   * 캘린더에 추가 (Google Calendar + ICS 다운로드)
   */
  const handleAddToCalendar = () => {
    feedback('tick')

    // Google Calendar 열기
    const calendarUrl = generateCalendarUrl(ticket)
    window.open(calendarUrl, '_blank', 'noopener,noreferrer')

    // ICS 파일도 다운로드 (Outlook, Apple Calendar 등 지원)
    setTimeout(() => {
      downloadICS(ticket)
    }, 500)
  }

  return (
    <div className="flex gap-2">
      {/* 이미지 저장 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveImage}
          disabled={isSaving}
          className="w-full"
        >
          <Download size={16} strokeWidth={1.5} />
          {isSaving ? '저장 중...' : MICROCOPY.ticket.save}
        </Button>
      </motion.div>

      {/* 캘린더 추가 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddToCalendar}
          className="w-full"
        >
          <Calendar size={16} strokeWidth={1.5} />
          {MICROCOPY.ticket.calendar}
        </Button>
      </motion.div>
    </div>
  )
}
