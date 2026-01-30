import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import type { Meeting, MeetingWithStatus } from '@/types/database'

/**
 * Tailwind CSS 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 모임 상태 계산
 * - 모집중: 기본 상태 (남은 자리 > 3)
 * - 마감 임박: 남은 자리 3명 이하
 * - 마감: 정원 도달
 */
export function calculateMeetingStatus(meeting: Meeting): MeetingWithStatus {
  const remainingSpots = meeting.capacity - meeting.current_participants

  let displayStatus: MeetingWithStatus['displayStatus'] = 'open'

  if (remainingSpots <= 0) {
    // 정원 마감이지만 모임 status가 'open'이면 대기 신청 가능
    displayStatus = meeting.status === 'open' ? 'waitlist_available' : 'closed'
  } else if (remainingSpots <= 3) {
    displayStatus = 'closing_soon'
  }

  // 이번 주 모임인지 확인
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // 월요일 시작
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const meetingDate = new Date(meeting.datetime)
  const isThisWeek = isWithinInterval(meetingDate, { start: weekStart, end: weekEnd })

  return {
    ...meeting,
    remainingSpots,
    displayStatus,
    isThisWeek,
  }
}

/**
 * 참가비 포맷팅 (콩 단위)
 */
export function formatFee(fee: number): string {
  return `${fee.toLocaleString()}콩`
}

/**
 * 날짜 포맷팅
 */
export function formatMeetingDate(dateString: string): string {
  const date = new Date(dateString)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = days[date.getDay()]
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  
  return `${month}월 ${day}일 (${dayOfWeek}) ${time}`
}

/**
 * 환불 금액 계산
 */
export function calculateRefundAmount(
  paymentAmount: number,
  meetingDate: Date,
  rules: { days_before: number; refund_percent: number }[]
): number {
  const now = new Date()
  const daysUntilMeeting = differenceInDays(meetingDate, now)

  // 규칙을 days_before 내림차순으로 정렬
  const sortedRules = [...rules].sort((a, b) => b.days_before - a.days_before)

  for (const rule of sortedRules) {
    if (daysUntilMeeting >= rule.days_before) {
      return Math.floor(paymentAmount * (rule.refund_percent / 100))
    }
  }

  // 기본: 환불 불가
  return 0
}

