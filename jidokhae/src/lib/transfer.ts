/**
 * 계좌이체 관련 유틸리티 함수
 * WP-M5 Phase 1: 계좌이체 결제
 */

import { format, addHours } from 'date-fns'
import type { RefundAccountInfo } from '@/types/database'

// 기본 입금 기한 (시간)
export const DEFAULT_TRANSFER_DEADLINE_HOURS = 24

// 환경변수에서 계좌이체 정보 가져오기
export const TRANSFER_BANK_NAME = process.env.NEXT_PUBLIC_TRANSFER_BANK_NAME || ''
export const TRANSFER_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_NUMBER || ''
export const TRANSFER_ACCOUNT_HOLDER = process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_HOLDER || ''

/**
 * 한국 은행 목록 (환불 계좌 선택용)
 */
export const KOREAN_BANKS = [
  { code: 'kakao', name: '카카오뱅크' },
  { code: 'toss', name: '토스뱅크' },
  { code: 'kbank', name: '케이뱅크' },
  { code: 'shinhan', name: '신한은행' },
  { code: 'kb', name: '국민은행' },
  { code: 'woori', name: '우리은행' },
  { code: 'hana', name: '하나은행' },
  { code: 'nh', name: '농협은행' },
  { code: 'ibk', name: '기업은행' },
  { code: 'sc', name: 'SC제일은행' },
  { code: 'citi', name: '한국씨티은행' },
  { code: 'daegu', name: '대구은행' },
  { code: 'busan', name: '부산은행' },
  { code: 'gwangju', name: '광주은행' },
  { code: 'jeju', name: '제주은행' },
  { code: 'jeonbuk', name: '전북은행' },
  { code: 'kn', name: '경남은행' },
  { code: 'suhyup', name: '수협은행' },
  { code: 'shinhyup', name: '신협' },
  { code: 'post', name: '우체국' },
  { code: 'saemaeul', name: '새마을금고' },
] as const

export type BankCode = typeof KOREAN_BANKS[number]['code']

/**
 * 입금자명 생성 (MMDD_이름 형식)
 * 예: 0125_홍길동
 *
 * @param userName 사용자 이름
 * @param date 기준 날짜 (기본: 현재)
 * @returns 입금자명
 */
export function generateTransferSenderName(userName: string, date: Date = new Date()): string {
  const mmdd = format(date, 'MMdd')
  return `${mmdd}_${userName}`
}

/**
 * 입금 기한 계산
 *
 * @param hours 기한 시간 (기본: 24시간)
 * @param fromDate 시작 시간 (기본: 현재)
 * @returns 입금 기한 Date
 */
export function calculateTransferDeadline(
  hours: number = DEFAULT_TRANSFER_DEADLINE_HOURS,
  fromDate: Date = new Date()
): Date {
  return addHours(fromDate, hours)
}

/**
 * 입금 기한 텍스트 포맷
 *
 * @param deadline 기한 Date
 * @returns 포맷된 문자열 (예: "1월 25일 오후 3시까지")
 */
export function formatTransferDeadline(deadline: Date | string): string {
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const period = hours < 12 ? '오전' : '오후'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  return `${month}월 ${day}일 ${period} ${displayHours}시까지`
}

/**
 * 환불 계좌 정보 유효성 검사
 *
 * @param refundInfo 환불 계좌 정보
 * @returns 유효성 검사 결과
 */
export function validateRefundAccount(refundInfo: Partial<RefundAccountInfo>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!refundInfo.bank || refundInfo.bank.trim() === '') {
    errors.push('은행을 선택해주세요')
  }

  if (!refundInfo.account || refundInfo.account.trim() === '') {
    errors.push('계좌번호를 입력해주세요')
  } else if (!/^[\d-]+$/.test(refundInfo.account.replace(/\s/g, ''))) {
    errors.push('계좌번호는 숫자와 하이픈만 입력 가능합니다')
  }

  if (!refundInfo.holder || refundInfo.holder.trim() === '') {
    errors.push('예금주명을 입력해주세요')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 계좌번호 마스킹 (표시용)
 * 예: 110-123-456789 → 110-***-***789
 *
 * @param accountNumber 계좌번호
 * @returns 마스킹된 계좌번호
 */
export function maskAccountNumber(accountNumber: string): string {
  // 숫자만 추출
  const numbers = accountNumber.replace(/\D/g, '')

  if (numbers.length <= 4) {
    return accountNumber
  }

  // 앞 3자리와 뒤 3자리만 보이게
  const visible = 3
  const start = numbers.slice(0, visible)
  const end = numbers.slice(-visible)
  const middle = '*'.repeat(Math.max(numbers.length - visible * 2, 3))

  return `${start}-${middle}-${end}`
}

/**
 * 계좌번호 정규화 (저장용)
 * 하이픈과 공백 제거
 *
 * @param accountNumber 계좌번호
 * @returns 정규화된 계좌번호
 */
export function normalizeAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/[\s-]/g, '')
}

/**
 * 입금 기한 만료 확인
 *
 * @param deadline 입금 기한
 * @returns 만료 여부
 */
export function isTransferDeadlineExpired(deadline: Date | string): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  return new Date() > deadlineDate
}

/**
 * 남은 입금 시간 계산
 *
 * @param deadline 입금 기한
 * @returns 남은 시간 문자열 (예: "5시간 30분", "만료됨")
 */
export function getRemainingTime(deadline: Date | string | null | undefined): string {
  // null/undefined 체크
  if (!deadline) {
    return '기한 없음'
  }

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline

  // Invalid Date 체크
  if (isNaN(deadlineDate.getTime())) {
    return '기한 없음'
  }

  const now = new Date()
  const diff = deadlineDate.getTime() - now.getTime()

  if (diff <= 0) {
    return '만료됨'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  return `${minutes}분`
}

/**
 * 계좌이체 상태 메시지
 */
export const TRANSFER_MESSAGES = {
  // 사용자 안내
  PENDING_INFO: '아래 계좌로 입금해주세요',
  DEADLINE_WARNING: '기한 내 미입금 시 자동 취소됩니다',
  COPY_SUCCESS: '복사되었습니다',

  // 상태 메시지
  WAITING: '입금대기',
  CONFIRMED: '입금확인',
  CANCELLED: '취소됨',
  EXPIRED: '기한만료',

  // 운영자 메시지
  CONFIRM_SUCCESS: '입금이 확인되었습니다',
  CONFIRM_FAILED: '입금 확인에 실패했습니다',
  REFUND_COMPLETED: '환불이 완료되었습니다',
} as const

/**
 * 입금자명에서 날짜와 이름 파싱
 *
 * @param senderName 입금자명 (예: "0125_홍길동")
 * @returns 파싱 결과 또는 null
 */
export function parseTransferSenderName(senderName: string): {
  date: string
  name: string
} | null {
  const match = senderName.match(/^(\d{4})_(.+)$/)
  if (!match) {
    return null
  }
  return {
    date: match[1],
    name: match[2],
  }
}

/**
 * 계좌이체 신청 정보 인터페이스
 */
export interface TransferRequestInfo {
  meetingId: string
  userId: string
  userName: string
  amount: number
  refundAccount: RefundAccountInfo
}

/**
 * 계좌이체 신청 결과 인터페이스
 */
export interface TransferRequestResult {
  success: boolean
  registrationId?: string
  senderName?: string
  deadline?: Date
  error?: string
}
