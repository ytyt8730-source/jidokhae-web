/**
 * 티켓 내보내기 유틸리티
 * M9 Phase 9.4: 티켓 보관함 + 취소 Flow
 *
 * 티켓 이미지 저장 및 ICS 파일 생성
 */

import html2canvas from 'html2canvas'
import type { TicketData } from '@/types/ticket'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ticket-export')

/**
 * 티켓 이미지 저장
 * html2canvas를 사용하여 티켓 DOM을 이미지로 변환하고 다운로드
 */
export async function saveTicketAsImage(
  ticketElement: HTMLElement,
  fileName?: string
): Promise<boolean> {
  try {
    logger.info('Starting ticket image export', { fileName })

    // html2canvas로 DOM을 캔버스로 변환
    const canvas = await html2canvas(ticketElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 고해상도
      logging: false,
      useCORS: true,
      allowTaint: false,
    })

    // 캔버스를 Blob으로 변환
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          logger.error('Failed to convert canvas to blob')
          resolve(false)
          return
        }

        // Blob을 다운로드
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || `jidokhae-ticket-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        logger.info('Ticket image saved successfully')
        resolve(true)
      }, 'image/png')
    })
  } catch (error) {
    logger.error('Failed to save ticket as image', { error })
    return false
  }
}

/**
 * ICS (iCalendar) 파일 내용 생성
 */
export function generateICS(ticket: TicketData): string {
  const startDate = ticket.meetingDate
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2시간 후

  // ISO 8601 형식으로 변환 (YYYYMMDDTHHMMSS)
  const formatICSDate = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    )
  }

  const start = formatICSDate(startDate)
  const end = formatICSDate(endDate)
  const now = formatICSDate(new Date())

  // ICS 파일 내용
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jidokhae//Ticket//KR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:jidokhae-${ticket.id}@jidokhae.kr`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:지독해: ${ticket.meetingTitle}`,
    `DESCRIPTION:나의 ${ticket.participationCount}번째 지독해\\n좌석: SEAT ${ticket.seatNumber.toString().padStart(2, '0')}`,
    `LOCATION:${ticket.meetingLocation}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:1시간 후 모임이 시작됩니다',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return icsContent
}

/**
 * ICS 파일 다운로드
 */
export function downloadICS(ticket: TicketData): void {
  try {
    logger.info('Generating ICS file', { ticketId: ticket.id })

    const icsContent = generateICS(ticket)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jidokhae-${ticket.meetingTitle}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    logger.info('ICS file downloaded successfully')
  } catch (error) {
    logger.error('Failed to download ICS file', { error })
  }
}
