/**
 * 정기모임 자격 검증 모듈
 * M6 Phase 3 - 자격 체크 & 유도
 *
 * 토론모임 등 특별 모임 참가를 위해서는
 * 6개월 이내에 정기모임 참여 기록이 필요합니다.
 */

import { createClient } from '@/lib/supabase/server'
import { addMonths, differenceInDays } from 'date-fns'
import type { EligibilityCheckResult, EligibilityStatus } from '@/types/database'

// 자격 유지 기간 (개월)
const ELIGIBILITY_MONTHS = 6

// 만료 임박 경고 기준 (일)
const WARNING_DAYS = 30

/**
 * 정기모임 자격 검증
 *
 * @param userId - 사용자 ID
 * @returns 자격 검증 결과
 *
 * 자격 상태:
 * - 'new': 신규 회원 (첫 정기모임 참여 전)
 * - 'active': 자격 유효 (30일 이상 남음)
 * - 'warning': 만료 임박 (30일 이하 남음)
 * - 'expired': 자격 만료 (6개월 초과)
 */
export async function checkRegularMeetingEligibility(
  userId: string
): Promise<EligibilityCheckResult> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('is_new_member, last_regular_meeting_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return {
      isEligible: false,
      lastRegularMeetingAt: null,
      expiresAt: null,
      daysRemaining: null,
      status: 'expired',
    }
  }

  // 신규 회원 (첫 정기모임 참여 전)
  if (user.is_new_member) {
    return {
      isEligible: true,
      lastRegularMeetingAt: null,
      expiresAt: null,
      daysRemaining: null,
      status: 'new',
    }
  }

  const lastRegularMeetingAt = user.last_regular_meeting_at

  // 정기모임 참여 기록이 없는 경우 (데이터 오류)
  if (!lastRegularMeetingAt) {
    return {
      isEligible: false,
      lastRegularMeetingAt: null,
      expiresAt: null,
      daysRemaining: null,
      status: 'expired',
    }
  }

  const lastMeetingDate = new Date(lastRegularMeetingAt)
  const expiresAt = addMonths(lastMeetingDate, ELIGIBILITY_MONTHS)
  const now = new Date()
  const daysRemaining = differenceInDays(expiresAt, now)

  // 만료됨
  if (daysRemaining <= 0) {
    return {
      isEligible: false,
      lastRegularMeetingAt,
      expiresAt: expiresAt.toISOString(),
      daysRemaining: 0,
      status: 'expired',
    }
  }

  // 만료 임박 (30일 이하)
  if (daysRemaining <= WARNING_DAYS) {
    return {
      isEligible: true,
      lastRegularMeetingAt,
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
      status: 'warning',
    }
  }

  // 자격 유효
  return {
    isEligible: true,
    lastRegularMeetingAt,
    expiresAt: expiresAt.toISOString(),
    daysRemaining,
    status: 'active',
  }
}

/**
 * 모임 타입에 따른 자격 요구 여부 확인
 *
 * @param meetingType - 모임 유형 ('regular', 'discussion', 'other')
 * @returns 자격 검증 필요 여부
 */
export function requiresEligibilityCheck(meetingType: string): boolean {
  // 정기모임은 누구나 참여 가능
  // 토론모임 등 특별 모임은 자격 필요
  return meetingType !== 'regular'
}

/**
 * 사용자의 자격 상태 텍스트 반환
 */
export function getEligibilityStatusText(status: EligibilityStatus): string {
  switch (status) {
    case 'new':
      return '신규 회원'
    case 'active':
      return '자격 유효'
    case 'warning':
      return '만료 임박'
    case 'expired':
      return '자격 만료'
    default:
      return '알 수 없음'
  }
}

/**
 * 자격 만료까지 남은 기간 포맷팅
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return ''
  if (days <= 0) return '만료됨'
  if (days === 1) return '1일 남음'
  if (days < 30) return `${days}일 남음`

  const months = Math.floor(days / 30)
  const remainingDays = days % 30

  if (remainingDays === 0) {
    return `약 ${months}개월 남음`
  }
  return `약 ${months}개월 ${remainingDays}일 남음`
}

/**
 * 신규 회원 → 기존 회원 전환
 * 첫 정기모임 참여 완료 시 호출
 *
 * @param userId - 사용자 ID
 * @param meetingType - 모임 유형
 * @returns 전환 성공 여부
 */
export async function convertNewMemberToExisting(
  userId: string,
  meetingType: string
): Promise<boolean> {
  // 정기모임이 아니면 전환하지 않음
  if (meetingType !== 'regular') {
    return false
  }

  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: user } = await supabase
    .from('users')
    .select('is_new_member')
    .eq('id', userId)
    .single()

  // 이미 기존 회원이면 스킵
  if (!user?.is_new_member) {
    return false
  }

  const now = new Date().toISOString()

  // 신규 → 기존 회원 전환
  const { error } = await supabase
    .from('users')
    .update({
      is_new_member: false,
      first_regular_meeting_at: now,
      last_regular_meeting_at: now,
    })
    .eq('id', userId)

  return !error
}

/**
 * 정기모임 참여 완료 시 last_regular_meeting_at 갱신
 * 기존 회원의 자격 유지/갱신에 사용
 *
 * @param userId - 사용자 ID
 * @param meetingType - 모임 유형
 */
export async function updateLastRegularMeetingAt(
  userId: string,
  meetingType: string
): Promise<void> {
  if (meetingType !== 'regular') {
    return
  }

  const supabase = await createClient()

  await supabase
    .from('users')
    .update({
      last_regular_meeting_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

/**
 * 자격 만료 임박 회원 조회 (Cron용)
 * 5개월 경과 시점의 회원들 조회
 *
 * @returns 만료 임박 회원 목록
 */
export async function getEligibilityWarningUsers(): Promise<
  Array<{ id: string; name: string; phone: string | null; daysRemaining: number }>
> {
  const supabase = await createClient()

  // 5개월 전 시점 계산
  const now = new Date()
  const fiveMonthsAgo = addMonths(now, -5)

  // 5개월 전에 마지막 정기모임 참여한 회원 (= 1개월 후 만료)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, phone, last_regular_meeting_at')
    .eq('is_new_member', false)
    .not('last_regular_meeting_at', 'is', null)
    .lte('last_regular_meeting_at', fiveMonthsAgo.toISOString())

  if (!users) return []

  interface UserData {
    id: string
    name: string
    phone: string | null
    last_regular_meeting_at: string | null
  }

  return (users as UserData[])
    .map((user) => {
      if (!user.last_regular_meeting_at) return null

      const expiresAt = addMonths(new Date(user.last_regular_meeting_at), ELIGIBILITY_MONTHS)
      const daysRemaining = differenceInDays(expiresAt, now)

      // 아직 만료되지 않고, 30일 이내인 경우만
      if (daysRemaining > 0 && daysRemaining <= WARNING_DAYS) {
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          daysRemaining,
        }
      }
      return null
    })
    .filter((u): u is { id: string; name: string; phone: string | null; daysRemaining: number } => u !== null)
}
