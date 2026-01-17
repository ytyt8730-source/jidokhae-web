/**
 * 결제 관련 유틸리티 함수
 * WP-M2 Phase 2: 결제 연동 (포트원)
 */

import type { User, Meeting, QualificationResult, RefundRule } from '@/types/database'

// 포트원 관련 상수
export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || ''
export const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || ''

/**
 * 정기모임 자격 검증 (M2-008, M2-009, M2-010)
 * 토론모임 신청 시 정기모임 참여 이력 확인
 *
 * @param user 사용자 정보
 * @param meeting 모임 정보
 * @returns 자격 검증 결과
 */
export function checkMeetingQualification(
  user: User,
  meeting: Meeting
): QualificationResult {
  // 정기모임은 자격 체크 불필요
  if (meeting.meeting_type === 'regular') {
    return { eligible: true }
  }

  // 토론모임/특별모임: 정기모임 자격 필요
  // 신규 회원은 자격 있음 (M2-008)
  if (user.is_new_member) {
    return { eligible: true }
  }

  // 6개월 이내 정기모임 참여 이력 확인 (M2-009, M2-010)
  if (user.last_regular_meeting_at) {
    const lastParticipation = new Date(user.last_regular_meeting_at)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    if (lastParticipation >= sixMonthsAgo) {
      return { eligible: true }
    }
  }

  // 6개월 초과 또는 참여 이력 없음
  return {
    eligible: false,
    reason: '정기모임 자격이 필요합니다',
    redirectTo: '/meetings?type=regular',
  }
}

/**
 * 환불 금액 계산
 *
 * @param paymentAmount 결제 금액
 * @param meetingDate 모임 일시
 * @param rules 환불 규칙
 * @returns 환불 금액
 */
export function calculateRefundAmount(
  paymentAmount: number,
  meetingDate: Date,
  rules: RefundRule[]
): number {
  const now = new Date()
  const diffTime = meetingDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // 규칙을 days_before 기준으로 내림차순 정렬
  const sortedRules = [...rules].sort((a, b) => b.days_before - a.days_before)

  for (const rule of sortedRules) {
    if (diffDays >= rule.days_before) {
      return Math.floor(paymentAmount * (rule.refund_percent / 100))
    }
  }

  // 기본: 환불 불가
  return 0
}

/**
 * 환불 비율 텍스트 생성
 *
 * @param meetingDate 모임 일시
 * @param rules 환불 규칙
 * @returns 환불 비율 텍스트
 */
export function getRefundPercentText(
  meetingDate: Date,
  rules: RefundRule[]
): string {
  const now = new Date()
  const diffTime = meetingDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const sortedRules = [...rules].sort((a, b) => b.days_before - a.days_before)

  for (const rule of sortedRules) {
    if (diffDays >= rule.days_before) {
      return `${rule.refund_percent}%`
    }
  }

  return '0%'
}

/**
 * D-day 계산
 *
 * @param meetingDate 모임 일시
 * @returns D-day 문자열
 */
export function getDday(meetingDate: Date | string): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const meeting = new Date(meetingDate)
  meeting.setHours(0, 0, 0, 0)

  const diffTime = meeting.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'D-DAY'
  if (diffDays > 0) return `D-${diffDays}`
  return `D+${Math.abs(diffDays)}`
}

/**
 * 결제 고유 키 생성
 *
 * @param userId 사용자 ID
 * @param meetingId 모임 ID
 * @returns 멱등성 키
 */
export function generateIdempotencyKey(userId: string, meetingId: string): string {
  const timestamp = Date.now()
  return `${userId}_${meetingId}_${timestamp}`
}

/**
 * 결제 상태 메시지
 */
export const PAYMENT_MESSAGES = {
  SUCCESS: '신청이 완료되었습니다',
  CANCELLED: '결제가 취소되었습니다',
  FAILED: '결제에 실패했습니다. 다시 시도해주세요',
  ALREADY_REGISTERED: '이미 신청한 모임입니다',
  MEETING_CLOSED: '마감되었습니다',
  CAPACITY_EXCEEDED: '마감되었습니다. 대기 신청하시겠습니까?',
  QUALIFICATION_REQUIRED: '정기모임 자격이 필요합니다',
} as const
