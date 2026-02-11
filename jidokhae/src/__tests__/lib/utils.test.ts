/**
 * Utils 테스트
 *
 * lib/utils.ts의 유틸리티 함수들을 테스트합니다.
 */
import { describe, it, expect } from 'vitest'
import {
  cn,
  formatFee,
  formatMeetingDate,
  calculateRefundAmount,
  calculateMeetingStatus,
} from '@/lib/utils'
import type { Meeting } from '@/types/database'

describe('cn (클래스 병합)', () => {
  it('단일 클래스를 반환한다', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('여러 클래스를 병합한다', () => {
    expect(cn('p-4', 'mt-2', 'text-center')).toBe('p-4 mt-2 text-center')
  })

  it('조건부 클래스를 처리한다', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('Tailwind 충돌을 해결한다', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
})

describe('formatFee (참가비 포맷팅)', () => {
  it('0원을 포맷팅한다', () => {
    expect(formatFee(0)).toBe('0콩')
  })

  it('천 단위 구분자를 추가한다', () => {
    expect(formatFee(1000)).toBe('1,000콩')
    expect(formatFee(10000)).toBe('10,000콩')
    expect(formatFee(100000)).toBe('100,000콩')
  })

  it('작은 금액을 포맷팅한다', () => {
    expect(formatFee(500)).toBe('500콩')
  })
})

describe('formatMeetingDate (날짜 포맷팅)', () => {
  it('날짜를 한국어 형식으로 포맷팅한다', () => {
    // 2025년 3월 15일 토요일 14:30
    const result = formatMeetingDate('2025-03-15T14:30:00')
    expect(result).toBe('3월 15일 (토) 14:30')
  })

  it('자정을 00:00으로 표시한다', () => {
    const result = formatMeetingDate('2025-01-01T00:00:00')
    expect(result).toBe('1월 1일 (수) 00:00')
  })

  it('오전 시간을 올바르게 표시한다', () => {
    const result = formatMeetingDate('2025-06-10T09:05:00')
    expect(result).toBe('6월 10일 (화) 09:05')
  })
})

describe('calculateRefundAmount (환불 금액 계산)', () => {
  const rules = [
    { days_before: 7, refund_percent: 100 },
    { days_before: 3, refund_percent: 50 },
    { days_before: 1, refund_percent: 0 },
  ]

  it('7일 이상 전이면 100% 환불', () => {
    const meetingDate = new Date()
    meetingDate.setDate(meetingDate.getDate() + 10)

    const refund = calculateRefundAmount(10000, meetingDate, rules)
    expect(refund).toBe(10000)
  })

  it('3~6일 전이면 50% 환불', () => {
    const meetingDate = new Date()
    meetingDate.setDate(meetingDate.getDate() + 5)

    const refund = calculateRefundAmount(10000, meetingDate, rules)
    expect(refund).toBe(5000)
  })

  it('1~2일 전이면 환불 불가', () => {
    const meetingDate = new Date()
    meetingDate.setDate(meetingDate.getDate() + 2)

    const refund = calculateRefundAmount(10000, meetingDate, rules)
    expect(refund).toBe(0)
  })

  it('당일이면 환불 불가', () => {
    const meetingDate = new Date()

    const refund = calculateRefundAmount(10000, meetingDate, rules)
    expect(refund).toBe(0)
  })
})

describe('calculateMeetingStatus (모임 상태 계산)', () => {
  // datetime을 미래로 설정 (함수가 과거 모임을 closed로 처리하므로)
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const baseMeeting: Meeting = {
    id: 'test-id',
    title: '테스트 모임',
    description: '테스트 설명',
    datetime: futureDate.toISOString(),
    location: '테스트 장소',
    capacity: 10,
    current_participants: 0,
    fee: 5000,
    meeting_type: 'regular',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    refund_policy_id: null,
  }

  it('남은 자리가 3명 초과면 open 상태', () => {
    const meeting = { ...baseMeeting, current_participants: 5 }
    const result = calculateMeetingStatus(meeting)

    expect(result.displayStatus).toBe('open')
    expect(result.remainingSpots).toBe(5)
  })

  it('남은 자리가 3명 이하면 closing_soon 상태', () => {
    const meeting = { ...baseMeeting, current_participants: 8 }
    const result = calculateMeetingStatus(meeting)

    expect(result.displayStatus).toBe('closing_soon')
    expect(result.remainingSpots).toBe(2)
  })

  it('정원이 다 차면 waitlist_available 상태', () => {
    const meeting = { ...baseMeeting, current_participants: 10 }
    const result = calculateMeetingStatus(meeting)

    expect(result.displayStatus).toBe('waitlist_available')
    expect(result.remainingSpots).toBe(0)
  })

  it('정원 초과시에도 waitlist_available 상태', () => {
    const meeting = { ...baseMeeting, current_participants: 12 }
    const result = calculateMeetingStatus(meeting)

    expect(result.displayStatus).toBe('waitlist_available')
    expect(result.remainingSpots).toBe(-2)
  })
})
