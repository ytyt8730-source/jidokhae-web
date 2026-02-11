/**
 * 세그먼트별 알림 로직
 * M3 알림시스템 - Phase 4
 *
 * 세그먼트 우선순위:
 * 자격 만료 임박 > 휴면 위험 > 온보딩 이탈 위험 > 월말 독려
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import {
  sendAndLogNotification,
  isUserAlreadyNotifiedToday,
  NOTIFICATION_TEMPLATES,
  type SegmentTarget,
  type MonthlyTarget,
} from '@/lib/notification'
import { subMonths, subDays, startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 데이터베이스 결과 타입
interface UserRow {
  id: string
  name: string
  phone: string | null
  last_regular_meeting_at?: string | null
  first_regular_meeting_at?: string | null
  total_participations?: number | null
}

interface RegistrationRow {
  user_id: string
}

/**
 * 자격 만료 임박 회원 조회 (마지막 정기모임 5개월 경과)
 */
export async function getEligibilityWarningTargets(): Promise<SegmentTarget[]> {
  const supabase = await createServiceClient()
  const today = new Date()

  // 5~6개월 전 사이의 마지막 정기모임 참여자
  const fiveMonthsAgo = subMonths(today, 5)
  const sixMonthsAgo = subMonths(today, 6)

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, last_regular_meeting_at')
    .eq('is_new_member', false)
    .not('phone', 'is', null)
    .lte('last_regular_meeting_at', fiveMonthsAgo.toISOString())
    .gt('last_regular_meeting_at', sixMonthsAgo.toISOString())

  if (error || !data) {
    cronLogger.error('get_eligibility_warning_error', { error: error?.message })
    return []
  }

  return (data as UserRow[])
    .filter((user: UserRow) => user.phone)
    .map((user: UserRow) => ({
      userId: user.id,
      userName: user.name,
      phone: user.phone!,
      segmentType: 'eligibility_warning' as const,
      lastParticipationAt: user.last_regular_meeting_at
        ? new Date(user.last_regular_meeting_at)
        : undefined,
    }))
}

/**
 * 휴면 위험 회원 조회 (마지막 참여 3개월 경과)
 */
export async function getDormantRiskTargets(): Promise<SegmentTarget[]> {
  const supabase = await createServiceClient()
  const today = new Date()

  // 3~5개월 전 사이의 마지막 참여자
  const threeMonthsAgo = subMonths(today, 3)
  const fiveMonthsAgo = subMonths(today, 5)

  // 마지막 참여 완료 기준 조회 (registrations 테이블 활용)
  const { data, error } = await supabase.rpc('get_dormant_risk_users', {
    three_months_ago: threeMonthsAgo.toISOString(),
    five_months_ago: fiveMonthsAgo.toISOString(),
  })

  if (error) {
    // RPC 함수가 없으면 기본 쿼리로 폴백
    cronLogger.warn('get_dormant_risk_rpc_not_found', { error: error.message })

    // last_regular_meeting_at을 기준으로 폴백
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('users')
      .select('id, name, phone, last_regular_meeting_at')
      .eq('is_new_member', false)
      .not('phone', 'is', null)
      .lte('last_regular_meeting_at', threeMonthsAgo.toISOString())
      .gt('last_regular_meeting_at', fiveMonthsAgo.toISOString())

    if (fallbackError || !fallbackData) {
      return []
    }

    return (fallbackData as UserRow[])
      .filter((user: UserRow) => user.phone)
      .map((user: UserRow) => ({
        userId: user.id,
        userName: user.name,
        phone: user.phone!,
        segmentType: 'dormant_risk' as const,
        lastParticipationAt: user.last_regular_meeting_at
          ? new Date(user.last_regular_meeting_at)
          : undefined,
      }))
  }

  if (!data) return []

  return data
    .filter((user: { phone: string | null }) => user.phone)
    .map((user: { id: string; name: string; phone: string; last_participation_at?: string }) => ({
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      segmentType: 'dormant_risk' as const,
      lastParticipationAt: user.last_participation_at
        ? new Date(user.last_participation_at)
        : undefined,
    }))
}

/**
 * 온보딩 이탈 위험 회원 조회 (첫 참여 후 45일 경과, 두 번째 참여 없음)
 */
export async function getOnboardingRiskTargets(): Promise<SegmentTarget[]> {
  const supabase = await createServiceClient()
  const today = new Date()

  // 45~60일 전 사이의 첫 정기모임 참여자 (두 번째 참여 없음)
  const fortyFiveDaysAgo = subDays(today, 45)
  const sixtyDaysAgo = subDays(today, 60)

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, first_regular_meeting_at, total_participations')
    .eq('is_new_member', false)
    .eq('total_participations', 1) // 첫 참여만 있음
    .not('phone', 'is', null)
    .lte('first_regular_meeting_at', fortyFiveDaysAgo.toISOString())
    .gt('first_regular_meeting_at', sixtyDaysAgo.toISOString())

  if (error || !data) {
    cronLogger.error('get_onboarding_risk_error', { error: error?.message })
    return []
  }

  return (data as UserRow[])
    .filter((user: UserRow) => user.phone)
    .map((user: UserRow) => ({
      userId: user.id,
      userName: user.name,
      phone: user.phone!,
      segmentType: 'onboarding_risk' as const,
      firstParticipationAt: user.first_regular_meeting_at
        ? new Date(user.first_regular_meeting_at)
        : undefined,
    }))
}

/**
 * 월말 독려 대상 조회 (이번 달 신청 없는 회원)
 */
export async function getMonthlyEncourageTargets(): Promise<MonthlyTarget[]> {
  const supabase = await createServiceClient()
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // 이번 달 신청한 회원 ID 조회
  const { data: registeredUsers, error: regError } = await supabase
    .from('registrations')
    .select('user_id')
    .in('status', ['confirmed', 'pending'])
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (regError) {
    cronLogger.error('get_monthly_registered_error', { error: regError.message })
    return []
  }

  const registeredUserIds = new Set(
    (registeredUsers as RegistrationRow[] | null)?.map((r: RegistrationRow) => r.user_id) || []
  )

  // 전체 활성 회원 조회
  const { data: allMembers, error: memberError } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('role', 'member')
    .not('phone', 'is', null)

  if (memberError || !allMembers) {
    cronLogger.error('get_monthly_members_error', { error: memberError?.message })
    return []
  }

  // 이번 달 신청하지 않은 회원만 필터링
  return (allMembers as UserRow[])
    .filter((member: UserRow) => !registeredUserIds.has(member.id) && member.phone)
    .map((member: UserRow) => ({
      userId: member.id,
      userName: member.name,
      phone: member.phone!,
    }))
}

/**
 * 세그먼트별 알림 발송 (우선순위 적용)
 */
export async function processSegmentReminders(): Promise<{
  eligibilityWarning: { total: number; sent: number }
  dormantRisk: { total: number; sent: number }
  onboardingRisk: { total: number; sent: number }
}> {
  const logger = cronLogger
  const timer = logger.startTimer()

  const stats = {
    eligibilityWarning: { total: 0, sent: 0 },
    dormantRisk: { total: 0, sent: 0 },
    onboardingRisk: { total: 0, sent: 0 },
  }

  // 이미 오늘 알림 받은 사용자 추적
  const notifiedUserIds = new Set<string>()

  // 1. 자격 만료 임박 (최우선)
  const eligibilityTargets = await getEligibilityWarningTargets()
  stats.eligibilityWarning.total = eligibilityTargets.length

  for (const target of eligibilityTargets) {
    const alreadyNotified = await isUserAlreadyNotifiedToday(
      target.userId,
      NOTIFICATION_TEMPLATES.ELIGIBILITY_WARNING
    )
    if (alreadyNotified) continue

    const lastDate = target.lastParticipationAt
      ? format(target.lastParticipationAt, 'M월 d일', { locale: ko })
      : ''
    const expiryDate = target.lastParticipationAt
      ? format(addMonths(target.lastParticipationAt, 6), 'M월 d일', { locale: ko })
      : ''

    const result = await sendAndLogNotification({
      templateCode: NOTIFICATION_TEMPLATES.ELIGIBILITY_WARNING,
      phone: target.phone,
      variables: {
        이름: target.userName,
        마지막참여일: lastDate,
        만료예정일: expiryDate,
      },
      userId: target.userId,
    })

    if (result.success) {
      stats.eligibilityWarning.sent++
      notifiedUserIds.add(target.userId)
    }
  }

  // 2. 휴면 위험 (자격 만료 알림 받은 사용자 제외)
  const dormantTargets = await getDormantRiskTargets()
  stats.dormantRisk.total = dormantTargets.filter(
    t => !notifiedUserIds.has(t.userId)
  ).length

  for (const target of dormantTargets) {
    if (notifiedUserIds.has(target.userId)) continue

    const alreadyNotified = await isUserAlreadyNotifiedToday(
      target.userId,
      NOTIFICATION_TEMPLATES.DORMANT_RISK
    )
    if (alreadyNotified) continue

    const daysElapsed = target.lastParticipationAt
      ? differenceInDays(new Date(), target.lastParticipationAt)
      : 0

    const result = await sendAndLogNotification({
      templateCode: NOTIFICATION_TEMPLATES.DORMANT_RISK,
      phone: target.phone,
      variables: {
        이름: target.userName,
        경과일: String(daysElapsed),
      },
      userId: target.userId,
    })

    if (result.success) {
      stats.dormantRisk.sent++
      notifiedUserIds.add(target.userId)
    }
  }

  // 3. 온보딩 이탈 위험 (위의 알림 받은 사용자 제외)
  const onboardingTargets = await getOnboardingRiskTargets()
  stats.onboardingRisk.total = onboardingTargets.filter(
    t => !notifiedUserIds.has(t.userId)
  ).length

  for (const target of onboardingTargets) {
    if (notifiedUserIds.has(target.userId)) continue

    const alreadyNotified = await isUserAlreadyNotifiedToday(
      target.userId,
      NOTIFICATION_TEMPLATES.ONBOARDING_RISK
    )
    if (alreadyNotified) continue

    const onboardingDaysElapsed = target.firstParticipationAt
      ? differenceInDays(new Date(), target.firstParticipationAt)
      : 0

    const result = await sendAndLogNotification({
      templateCode: NOTIFICATION_TEMPLATES.ONBOARDING_RISK,
      phone: target.phone,
      variables: {
        이름: target.userName,
        경과일: String(onboardingDaysElapsed),
      },
      userId: target.userId,
    })

    if (result.success) {
      stats.onboardingRisk.sent++
    }
  }

  timer.done('segment_reminders_completed', stats)

  return stats
}

/**
 * 월말 독려 알림 발송
 */
export async function processMonthlyEncourage(): Promise<{
  total: number
  sent: number
}> {
  const logger = cronLogger
  const timer = logger.startTimer()

  const stats = { total: 0, sent: 0 }

  const targets = await getMonthlyEncourageTargets()
  stats.total = targets.length

  logger.info('monthly_encourage_targets', { count: targets.length })

  for (const target of targets) {
    const alreadyNotified = await isUserAlreadyNotifiedToday(
      target.userId,
      NOTIFICATION_TEMPLATES.MONTHLY_ENCOURAGE
    )
    if (alreadyNotified) continue

    const result = await sendAndLogNotification({
      templateCode: NOTIFICATION_TEMPLATES.MONTHLY_ENCOURAGE,
      phone: target.phone,
      variables: {
        이름: target.userName,
      },
      userId: target.userId,
    })

    if (result.success) {
      stats.sent++
    }
  }

  timer.done('monthly_encourage_completed', stats)

  return stats
}
