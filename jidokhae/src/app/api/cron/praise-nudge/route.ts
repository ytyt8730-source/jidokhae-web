/**
 * 칭찬 유도 알림 Cron API
 * M6-Onboarding: 첫 모임 완료 후 +1일 칭찬 유도
 *
 * 매일 오전 10시(KST) 실행
 * - 어제 첫 정기모임 참여 완료한 회원 대상
 * - 아직 칭찬을 보내지 않은 사람 (first_aha_at is null)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { sendAndLogNotification, isUserAlreadyNotifiedToday } from '@/lib/notification'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'
import { subDays, startOfDay, endOfDay } from 'date-fns'

// 템플릿 코드
const PRAISE_NUDGE_TEMPLATE = 'PRAISE_NUDGE'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/praise-nudge', request)
  }

  logger.info('praise_nudge_cron_started')

  const stats = {
    total: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    const supabase = await createServiceClient()

    // 어제 날짜 범위 (첫 모임 참여 완료일이 어제인 사람)
    const yesterday = subDays(new Date(), 1)
    const dayStart = startOfDay(yesterday)
    const dayEnd = endOfDay(yesterday)

    // 어제 첫 정기모임에 참여 완료한 회원 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, phone, first_regular_meeting_at, first_aha_at')
      .gte('first_regular_meeting_at', dayStart.toISOString())
      .lt('first_regular_meeting_at', dayEnd.toISOString())
      .is('first_aha_at', null) // 아직 칭찬 안 보낸 사람
      .not('phone', 'is', null)

    if (error) {
      logger.error('praise_nudge_query_error', { error: error.message })
      throw error
    }

    if (!users || users.length === 0) {
      logger.info('praise_nudge_no_targets')
      return NextResponse.json({
        success: true,
        message: 'No targets for praise nudge',
        stats,
        timestamp: new Date().toISOString(),
      })
    }

    stats.total = users.length

    // 각 대상에게 칭찬 유도 알림 발송
    for (const user of users) {
      if (!user.phone) {
        stats.failed++
        continue
      }

      try {
        // 중복 발송 체크 (user_id + template_code로 체크)
        const alreadySent = await isUserAlreadyNotifiedToday(user.id, PRAISE_NUDGE_TEMPLATE)
        if (alreadySent) {
          stats.skipped++
          continue
        }

        // 첫 완료 모임 제목 조회
        const { data: firstReg } = await supabase
          .from('registrations')
          .select('meetings (title)')
          .eq('user_id', user.id)
          .eq('participation_status', 'completed')
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        const meetingTitle = (firstReg?.meetings as { title: string } | null)?.title ?? '정기모임'

        // 알림 발송
        const result = await sendAndLogNotification({
          templateCode: PRAISE_NUDGE_TEMPLATE,
          phone: user.phone,
          variables: {
            이름: user.name,
            모임명: meetingTitle,
          },
          userId: user.id,
        })

        if (result.success) {
          stats.sent++
          logger.info('praise_nudge_sent', {
            userId: user.id,
            phone: user.phone.slice(0, -4) + '****',
          })
        } else {
          stats.failed++
          logger.warn('praise_nudge_send_failed', {
            userId: user.id,
            error: result.error,
          })
        }
      } catch (sendError) {
        stats.failed++
        logger.error('praise_nudge_send_error', {
          userId: user.id,
          error: sendError instanceof Error ? sendError.message : 'Unknown',
        })
      }
    }

    timer.done('praise_nudge_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Praise nudge cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('praise_nudge_cron_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
  return GET(request)
}
