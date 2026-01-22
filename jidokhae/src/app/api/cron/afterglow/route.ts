/**
 * 여운 메시지 Cron API
 * M7-011: 모임 종료 30분 후 여운 메시지 발송
 *
 * 매 30분 실행 (0,30 * * * *)
 * 30분 전에 종료된 모임의 참가자에게 여운 메시지 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { sendAndLogNotification, isAlreadySent } from '@/lib/notification'

// Vercel Cron 인증 헤더
const CRON_SECRET = process.env.CRON_SECRET

// 템플릿 코드
const AFTERGLOW_TEMPLATE = 'AFTERGLOW'

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

/**
 * 모임 종료 시간 계산 (duration 기반)
 * 기본 모임 시간: 2시간
 */
function getMeetingEndTime(datetime: Date, durationMinutes: number = 120): Date {
  return new Date(datetime.getTime() + durationMinutes * 60 * 1000)
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', {
      path: '/api/cron/afterglow',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('afterglow_cron_started')

  const stats = {
    meetingsProcessed: 0,
    totalParticipants: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    const supabase = await createServiceClient()
    const now = new Date()
    
    // 30분 전 ~ 1시간 전에 종료된 모임 조회
    // 모임 시간 + 2시간(기본 duration) = 종료 시간
    // 종료 시간이 30분~1시간 전인 모임 = 시작 시간이 2시간30분~3시간 전인 모임
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // 2시간 기본 duration을 감안한 시작 시간 범위
    const meetingStartMin = new Date(oneHourAgo.getTime() - 120 * 60 * 1000) // 3시간 전
    const meetingStartMax = new Date(thirtyMinAgo.getTime() - 120 * 60 * 1000) // 2시간 30분 전

    logger.info('afterglow_time_range', {
      meetingStartMin: meetingStartMin.toISOString(),
      meetingStartMax: meetingStartMax.toISOString(),
    })

    // 해당 시간대에 시작한 모임 조회
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, title, datetime, duration_minutes')
      .gte('datetime', meetingStartMin.toISOString())
      .lte('datetime', meetingStartMax.toISOString())

    if (meetingsError) {
      logger.error('afterglow_meetings_query_error', { error: meetingsError.message })
      throw meetingsError
    }

    if (!meetings || meetings.length === 0) {
      logger.info('afterglow_no_meetings')
      return NextResponse.json({
        success: true,
        message: 'No meetings to process',
        stats,
        timestamp: now.toISOString(),
      })
    }

    stats.meetingsProcessed = meetings.length

    // 각 모임의 참가자에게 여운 메시지 발송
    for (const meeting of meetings) {
      const duration = meeting.duration_minutes || 120
      const endTime = getMeetingEndTime(new Date(meeting.datetime), duration)
      
      // 종료 시간이 30분~1시간 전 범위인지 다시 확인
      const timeSinceEnd = now.getTime() - endTime.getTime()
      if (timeSinceEnd < 25 * 60 * 1000 || timeSinceEnd > 65 * 60 * 1000) {
        // 범위 밖이면 스킵
        continue
      }

      // 해당 모임의 확정 참가자 조회
      const { data: participants, error: participantsError } = await supabase
        .from('registrations')
        .select(`
          user_id,
          users (
            id,
            name,
            phone
          )
        `)
        .eq('meeting_id', meeting.id)
        .eq('status', 'confirmed')

      if (participantsError || !participants) {
        logger.error('afterglow_participants_query_error', {
          meetingId: meeting.id,
          error: participantsError?.message,
        })
        continue
      }

      stats.totalParticipants += participants.length

      // 각 참가자에게 여운 메시지 발송
      for (const p of participants) {
        const user = p.users as { id: string; name: string; phone: string | null } | null

        if (!user || !user.phone) {
          stats.failed++
          continue
        }

        // 중복 발송 체크
        const alreadySent = await isAlreadySent(user.id, meeting.id, AFTERGLOW_TEMPLATE)
        if (alreadySent) {
          stats.skipped++
          continue
        }

        // 여운 메시지 발송
        const result = await sendAndLogNotification({
          templateCode: AFTERGLOW_TEMPLATE,
          phone: user.phone,
          variables: {
            이름: user.name,
          },
          userId: user.id,
          meetingId: meeting.id,
        })

        if (result.success) {
          stats.sent++
        } else {
          stats.failed++
          logger.warn('afterglow_send_failed', {
            userId: user.id,
            meetingId: meeting.id,
            error: result.error,
          })
        }
      }
    }

    timer.done('afterglow_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Afterglow cron completed',
      stats,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    logger.error('afterglow_cron_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request)
}
