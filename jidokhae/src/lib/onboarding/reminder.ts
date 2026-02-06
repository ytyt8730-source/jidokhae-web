/**
 * 온보딩 리마인더 시스템
 * M6-Onboarding Phase 4 & 5
 *
 * 가입 후 3/7일 리마인더, 첫 모임 후 3/7일 리마인더 처리
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { subDays, startOfDay, endOfDay } from 'date-fns'

const logger = cronLogger

// 리마인더 타입
export type ReminderType = 'day3' | 'day7'

// 리마인더 대상자 정보
export interface ReminderTarget {
  userId: string
  userName: string
  userPhone: string
  reminderType: ReminderType
  reminderCount: number
}

// 가입 리마인더 대상자 (확장)
export interface SignupReminderTarget extends ReminderTarget {
  createdAt: string
  nextMeeting?: {
    id: string
    title: string
    datetime: string
    location: string
    remainingSpots: number
  } | null
}

// 첫 모임 후 리마인더 대상자 (확장)
export interface FirstMeetingReminderTarget extends ReminderTarget {
  firstMeetingAt: string
  firstMeetingTitle: string
  nextMeeting?: {
    id: string
    title: string
    datetime: string
    currentParticipants: number
  } | null
}

/**
 * 가입 후 리마인더 대상자 조회
 *
 * 조건:
 * - is_new_member = true
 * - created_at이 정확히 3일 또는 7일 전
 * - signup_reminder_count < 2 (14일 규칙)
 * - 신청 이력 없음 (또는 모두 취소)
 * - 전화번호 있음
 */
export async function getSignupReminderTargets(): Promise<SignupReminderTarget[]> {
  const supabase = await createServiceClient()
  const targets: SignupReminderTarget[] = []

  // 3일 전과 7일 전 대상자를 한 번에 조회
  const dayRanges = [
    { days: 3, type: 'day3' as ReminderType },
    { days: 7, type: 'day7' as ReminderType },
  ]

  for (const { days, type } of dayRanges) {
    const targetDate = subDays(new Date(), days)
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // 해당 날짜에 가입한 신규 회원 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, phone, created_at, signup_reminder_count')
      .eq('is_new_member', true)
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString())
      .lt('signup_reminder_count', 2) // 14일 규칙
      .not('phone', 'is', null)

    if (error) {
      logger.error('signup_reminder_targets_error', { days, error: error.message })
      continue
    }

    for (const user of users || []) {
      if (!user.phone) continue

      // 활성 신청 이력 확인 (취소 제외)
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .limit(1)

      // 이미 신청한 회원은 제외
      if (registrations && registrations.length > 0) continue

      targets.push({
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        reminderType: type,
        reminderCount: user.signup_reminder_count || 0,
        createdAt: user.created_at,
        nextMeeting: await getMostPopularMeeting(),
      })
    }
  }

  return targets
}

/**
 * 첫 모임 후 리마인더 대상자 조회
 *
 * 조건:
 * - first_regular_meeting_at이 정확히 3일 또는 7일 전
 * - first_meeting_reminder_count < 2 (14일 규칙)
 * - 두 번째 모임 미신청
 * - 전화번호 있음
 */
export async function getFirstMeetingReminderTargets(): Promise<FirstMeetingReminderTarget[]> {
  const supabase = await createServiceClient()
  const targets: FirstMeetingReminderTarget[] = []

  const dayRanges = [
    { days: 3, type: 'day3' as ReminderType },
    { days: 7, type: 'day7' as ReminderType },
  ]

  for (const { days, type } of dayRanges) {
    const targetDate = subDays(new Date(), days)
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // 해당 날짜에 첫 모임 참여한 회원 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, phone, first_regular_meeting_at, first_meeting_reminder_count')
      .gte('first_regular_meeting_at', dayStart.toISOString())
      .lt('first_regular_meeting_at', dayEnd.toISOString())
      .lt('first_meeting_reminder_count', 2)
      .not('phone', 'is', null)

    if (error) {
      logger.error('first_meeting_reminder_targets_error', { days, error: error.message })
      continue
    }

    for (const user of users || []) {
      if (!user.phone) continue

      // 첫 모임 정보 조회
      const { data: firstReg } = await supabase
        .from('registrations')
        .select('meeting:meetings!registrations_meeting_id_fkey(id, title)')
        .eq('user_id', user.id)
        .eq('participation_status', 'completed')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const firstMeeting = firstReg?.meeting as { id: string; title: string } | null

      // 두 번째 모임 신청 여부 확인
      const { data: secondRegs } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .neq('meeting_id', firstMeeting?.id || '')
        .limit(1)

      // 이미 두 번째 신청한 회원은 제외
      if (secondRegs && secondRegs.length > 0) continue

      targets.push({
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        reminderType: type,
        reminderCount: user.first_meeting_reminder_count || 0,
        firstMeetingAt: user.first_regular_meeting_at,
        firstMeetingTitle: firstMeeting?.title || '정기모임',
        nextMeeting: await getNextAvailableMeeting(),
      })
    }
  }

  return targets
}

/**
 * 가장 인기 있는 다음 모임 조회 (가입 리마인더용, 환영 알림용)
 */
export async function getMostPopularMeeting() {
  const supabase = await createServiceClient()

  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id, title, datetime, location, max_participants,
      registrations!registrations_meeting_id_fkey(id)
    `)
    .eq('meeting_type', 'regular')
    .eq('status', 'open')
    .gt('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(5)

  if (!meetings || meetings.length === 0) return null

  // 신청 인원이 가장 많은 모임 선택
  type MeetingWithRegistrations = (typeof meetings)[number]
  const meetingsWithCount = meetings.map((m: MeetingWithRegistrations) => ({
    ...m,
    participantCount: Array.isArray(m.registrations) ? m.registrations.length : 0,
    remainingSpots: m.max_participants - (Array.isArray(m.registrations) ? m.registrations.length : 0),
  }))

  type MeetingWithCount = (typeof meetingsWithCount)[number]
  const mostPopular = meetingsWithCount.sort(
    (a: MeetingWithCount, b: MeetingWithCount) => b.participantCount - a.participantCount
  )[0]

  return {
    id: mostPopular.id,
    title: mostPopular.title,
    datetime: mostPopular.datetime,
    location: mostPopular.location,
    remainingSpots: Math.max(0, mostPopular.remainingSpots),
  }
}

/**
 * 다음 열린 모임 조회 (첫 모임 후 리마인더용)
 */
async function getNextAvailableMeeting() {
  const supabase = await createServiceClient()

  const { data: meeting } = await supabase
    .from('meetings')
    .select(`
      id, title, datetime,
      registrations!registrations_meeting_id_fkey(id)
    `)
    .eq('meeting_type', 'regular')
    .eq('status', 'open')
    .gt('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(1)
    .single()

  if (!meeting) return null

  return {
    id: meeting.id,
    title: meeting.title,
    datetime: meeting.datetime,
    currentParticipants: Array.isArray(meeting.registrations) ? meeting.registrations.length : 0,
  }
}

/**
 * 리마인더 카운터 업데이트
 */
export async function updateReminderCount(
  userId: string,
  type: 'signup' | 'first_meeting'
): Promise<void> {
  const supabase = await createServiceClient()

  const field = type === 'signup' ? 'signup_reminder_count' : 'first_meeting_reminder_count'
  const sentField = type === 'signup' ? 'signup_reminder_sent_at' : 'first_meeting_reminder_sent_at'

  // 현재 값 조회 후 증가
  const { data: user } = await supabase
    .from('users')
    .select(field)
    .eq('id', userId)
    .single()

  const currentCount = (user?.[field] as number) || 0

  const { error } = await supabase
    .from('users')
    .update({
      [field]: currentCount + 1,
      [sentField]: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    logger.error('reminder_count_update_error', { userId, type, error: error.message })
  }
}

/**
 * 알림 로그 저장
 */
export async function logReminderNotification(
  userId: string,
  templateCode: string,
  phone: string,
  status: 'sent' | 'failed',
  meetingId?: string
): Promise<void> {
  const supabase = await createServiceClient()

  await supabase.from('notification_logs').insert({
    user_id: userId,
    template_code: templateCode,
    phone_number: phone,
    status,
    meeting_id: meetingId || null,
  })
}
