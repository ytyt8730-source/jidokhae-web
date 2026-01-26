/**
 * 티켓 유틸리티 함수
 * M9 Phase 9.1: Commitment Ritual
 */

import { createClient } from '@/lib/supabase/client'
import type { TicketData, TicketStatus } from '@/types/ticket'

/**
 * 사용자의 총 참여 횟수 계산 (클라이언트용)
 */
export async function getParticipationCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'confirmed')

  if (error) {
    console.error('Failed to get participation count:', error)
    return 1
  }

  return (count ?? 0) + 1 // 현재 참여 포함
}

/**
 * 티켓 상태에 따른 한글 레이블
 */
export function getTicketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    pending_payment: '결제 대기',
    pending_transfer: '입금 확인 중',
    confirmed: '확정',
    used: '참여 완료',
    cancelled: '취소됨',
  }
  return labels[status] || status
}

/**
 * 티켓 상태에 따른 색상 클래스
 */
export function getTicketStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_transfer: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-green-100 text-green-800',
    used: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * 좌석 번호 포맷팅 (예: "SEAT 07")
 */
export function formatSeatNumber(seatNumber: number): string {
  return `SEAT ${seatNumber.toString().padStart(2, '0')}`
}

/**
 * 참여 횟수 포맷팅 (예: "나의 12번째 지독해")
 */
export function formatParticipationCount(count: number): string {
  return `나의 ${count}번째 지독해`
}

/**
 * 티켓 날짜 포맷팅 (예: "2026년 1월 26일 토요일")
 */
export function formatTicketDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[date.getDay()]

  return `${year}년 ${month}월 ${day}일 ${weekday}요일`
}

/**
 * 티켓 시간 포맷팅 (예: "오후 2:00")
 */
export function formatTicketTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? '오후' : '오전'
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours

  return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`
}

/**
 * 티켓 ID 생성 (표시용, 예: "JDH-20260126-001")
 */
export function generateTicketId(date: Date, seatNumber: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seatStr = seatNumber.toString().padStart(3, '0')
  return `JDH-${dateStr}-${seatStr}`
}

/**
 * 티켓 이미지 다운로드용 캔버스 생성
 * (실제 구현은 Phase 9.4에서)
 */
export async function generateTicketImage(ticketData: TicketData): Promise<Blob | null> {
  // TODO: Phase 9.4에서 html2canvas 또는 dom-to-image 사용
  console.log('generateTicketImage not implemented yet', ticketData)
  return null
}

/**
 * 캘린더 이벤트 URL 생성 (Google Calendar)
 */
export function generateCalendarUrl(ticketData: TicketData): string {
  const startDate = ticketData.meetingDate.toISOString().replace(/-|:|\.\d+/g, '')
  const endDate = new Date(ticketData.meetingDate.getTime() + 2 * 60 * 60 * 1000)
    .toISOString()
    .replace(/-|:|\.\d+/g, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `지독해: ${ticketData.meetingTitle}`,
    dates: `${startDate}/${endDate}`,
    location: ticketData.meetingLocation,
    details: `${formatParticipationCount(ticketData.participationCount)}\n${formatSeatNumber(ticketData.seatNumber)}`,
  })

  return `https://www.google.com/calendar/render?${params.toString()}`
}
