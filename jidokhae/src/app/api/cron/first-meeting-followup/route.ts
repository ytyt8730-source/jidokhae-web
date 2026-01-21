/**
 * 첫 모임 후 후기 요청 알림 Cron API
 * M6 신규회원 플로우 - Phase 2
 *
 * 매일 오전 10시(KST) 실행
 * - 첫 정기모임 참여 완료 후 3일째인 회원 대상
 * - 후기 요청 + 다음 정기모임 안내 알림 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { subDays, startOfDay, endOfDay, addWeeks } from 'date-fns'

const CRON_SECRET = process.env.CRON_SECRET

function verifyCronRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) {
    return true
  }

  return false
}

interface FollowupTarget {
  userId: string
  userName: string
  userPhone: string
  firstMeetingId: string
  firstMeetingTitle: string
  nextMeeting: {
    id: string
    title: string
    datetime: string
  } | null
}

/**
 * 첫 모임 후 알림 대상자 조회
 * - 첫 정기모임 참여 완료 후 정확히 3일째인 회원
 * - is_new_member = false (이미 전환됨)
 * - first_regular_meeting_at이 3일 전인 경우
 */
async function getFollowupTargets(): Promise<FollowupTarget[]> {
  const supabase = await createServiceClient()
  const threeDaysAgo = subDays(new Date(), 3)
  const dayStart = startOfDay(threeDaysAgo)
  const dayEnd = endOfDay(threeDaysAgo)

  // 3일 전에 첫 정기모임을 완료한 회원 조회
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, first_regular_meeting_at')
    .eq('is_new_member', false)
    .gte('first_regular_meeting_at', dayStart.toISOString())
    .lt('first_regular_meeting_at', dayEnd.toISOString())
    .not('phone', 'is', null)

  if (error) {
    cronLogger.error('followup_targets_query_error', { error: error.message })
    return []
  }

  const targets: FollowupTarget[] = []

  for (const user of users || []) {
    if (!user.phone) continue

    // 첫 정기모임 정보 조회
    const { data: firstRegistration } = await supabase
      .from('registrations')
      .select(`
        meeting:meetings!registrations_meeting_id_fkey (
          id,
          title,
          meeting_type
        )
      `)
      .eq('user_id', user.id)
      .eq('participation_status', 'completed')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    const firstMeeting = firstRegistration?.meeting as { id: string; title: string; meeting_type: string } | null

    // 다음 정기모임 조회 (2주 이내)
    const twoWeeksLater = addWeeks(new Date(), 2)
    const { data: nextMeetings } = await supabase
      .from('meetings')
      .select('id, title, datetime')
      .eq('meeting_type', 'regular')
      .eq('status', 'open')
      .gt('datetime', new Date().toISOString())
      .lte('datetime', twoWeeksLater.toISOString())
      .order('datetime', { ascending: true })
      .limit(1)

    const nextMeeting = nextMeetings?.[0] || null

    targets.push({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      firstMeetingId: firstMeeting?.id || '',
      firstMeetingTitle: firstMeeting?.title || '정기모임',
      nextMeeting: nextMeeting
        ? {
            id: nextMeeting.id,
            title: nextMeeting.title,
            datetime: nextMeeting.datetime,
          }
        : null,
    })
  }

  return targets
}

/**
 * 첫 모임 후 알림 발송
 */
async function sendFollowupNotification(target: FollowupTarget): Promise<boolean> {
  const supabase = await createServiceClient()

  const { data: template } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('code', 'FIRST_MEETING_FOLLOWUP')
    .eq('is_active', true)
    .single()

  if (!template) {
    cronLogger.warn('followup_template_not_found')
    return false
  }

  let message = template.message_template
    .replace(/#{회원명}/g, target.userName)
    .replace(/#{모임명}/g, target.firstMeetingTitle)

  // 다음 모임 정보 추가
  if (target.nextMeeting) {
    const nextDate = new Date(target.nextMeeting.datetime).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
    message = message
      .replace(/#{다음모임명}/g, target.nextMeeting.title)
      .replace(/#{다음모임일시}/g, nextDate)
  } else {
    // 다음 모임이 없으면 관련 문구 제거
    message = message
      .replace(/---\n다음 정기모임도 함께해요![\s\S]*/, '')
      .trim()
  }

  // TODO: 실제 알림톡 발송 (Solapi)
  cronLogger.info('followup_notification_sent', {
    userId: target.userId,
    phone: target.userPhone.slice(0, -4) + '****',
    hasNextMeeting: !!target.nextMeeting,
    message: message.slice(0, 50) + '...',
  })

  await supabase.from('notification_logs').insert({
    user_id: target.userId,
    template_code: 'FIRST_MEETING_FOLLOWUP',
    phone_number: target.userPhone,
    status: 'sent',
    meeting_id: target.firstMeetingId || null,
  })

  return true
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', { path: '/api/cron/first-meeting-followup' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('followup_cron_started')

  try {
    const targets = await getFollowupTargets()
    let sent = 0

    for (const target of targets) {
      const success = await sendFollowupNotification(target)
      if (success) sent++
    }

    const stats = { total: targets.length, sent }
    timer.done('followup_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'First meeting followup cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('followup_cron_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
