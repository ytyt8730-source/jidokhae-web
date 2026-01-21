/**
 * 신규 회원 환영 알림 Cron API
 * M6 신규회원 플로우 - Phase 2
 *
 * 매일 오전 10시(KST) 실행
 * - 신규 회원(is_new_member=true)이 정기모임 신청 시
 * - 모임 D-1(내일)인 경우 환영 알림 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { addDays, startOfDay, endOfDay } from 'date-fns'

// Vercel Cron 인증 헤더
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Cron 요청 인증 확인
 */
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

interface WelcomeTarget {
  userId: string
  userName: string
  userPhone: string
  meetingId: string
  meetingTitle: string
  meetingDatetime: string
  meetingLocation: string
  meetingFee: number
}

/**
 * 환영 알림 대상자 조회
 * - 신규 회원 (is_new_member = true)
 * - 정기모임 확정 상태 (status = confirmed)
 * - 모임이 내일인 경우
 */
async function getWelcomeTargets(): Promise<WelcomeTarget[]> {
  const supabase = await createServiceClient()
  const tomorrow = addDays(new Date(), 1)
  const tomorrowStart = startOfDay(tomorrow)
  const tomorrowEnd = endOfDay(tomorrow)

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      user:users!registrations_user_id_fkey (
        id,
        name,
        phone,
        is_new_member
      ),
      meeting:meetings!registrations_meeting_id_fkey (
        id,
        title,
        datetime,
        location,
        fee,
        meeting_type
      )
    `)
    .eq('status', 'confirmed')
    .gte('meeting.datetime', tomorrowStart.toISOString())
    .lte('meeting.datetime', tomorrowEnd.toISOString())

  if (error) {
    cronLogger.error('welcome_targets_query_error', { error: error.message })
    return []
  }

  // 신규 회원 + 정기모임만 필터링
  const targets: WelcomeTarget[] = []

  for (const reg of registrations || []) {
    const user = reg.user as { id: string; name: string; phone: string | null; is_new_member: boolean } | null
    const meeting = reg.meeting as { id: string; title: string; datetime: string; location: string; fee: number; meeting_type: string } | null

    if (!user || !meeting) continue
    if (!user.is_new_member) continue
    if (meeting.meeting_type !== 'regular') continue
    if (!user.phone) continue

    targets.push({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDatetime: meeting.datetime,
      meetingLocation: meeting.location,
      meetingFee: meeting.fee,
    })
  }

  return targets
}

/**
 * 환영 알림 발송 (알림톡)
 */
async function sendWelcomeNotification(target: WelcomeTarget): Promise<boolean> {
  const supabase = await createServiceClient()

  // 템플릿 조회
  const { data: template } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('code', 'NEW_MEMBER_WELCOME')
    .eq('is_active', true)
    .single()

  if (!template) {
    cronLogger.warn('welcome_template_not_found')
    return false
  }

  // 메시지 생성
  const meetingTime = new Date(target.meetingDatetime).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const message = template.message_template
    .replace(/#{회원명}/g, target.userName)
    .replace(/#{시간}/g, meetingTime)
    .replace(/#{장소}/g, target.meetingLocation)
    .replace(/#{참가비}/g, String(target.meetingFee))
    .replace(/#{모임명}/g, target.meetingTitle)

  // TODO: 실제 알림톡 발송 (Solapi)
  // 현재는 로그로 대체
  cronLogger.info('welcome_notification_sent', {
    userId: target.userId,
    phone: target.userPhone.slice(0, -4) + '****',
    meetingId: target.meetingId,
    message: message.slice(0, 50) + '...',
  })

  // 알림 로그 저장
  await supabase.from('notification_logs').insert({
    user_id: target.userId,
    template_code: 'NEW_MEMBER_WELCOME',
    phone_number: target.userPhone,
    status: 'sent', // TODO: 실제 발송 결과로 변경
    meeting_id: target.meetingId,
  })

  return true
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', { path: '/api/cron/welcome' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('welcome_cron_started')

  try {
    const targets = await getWelcomeTargets()
    let sent = 0

    for (const target of targets) {
      const success = await sendWelcomeNotification(target)
      if (success) sent++
    }

    const stats = { total: targets.length, sent }
    timer.done('welcome_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Welcome cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('welcome_cron_error', {
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
