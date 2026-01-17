/**
 * 모임 종료 후 "어떠셨어요?" 알림 Cron API
 * M4 소속감 - Phase 1
 *
 * 매일 오전 10시(KST) 실행
 * - 모임 종료 3일 후 참가자에게 알림 발송
 * - 칭찬하기 / 참여했어요 / 후기 남기기 선택 유도
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPostMeetingNotifications } from '@/lib/post-meeting'
import { cronLogger } from '@/lib/logger'

// Vercel Cron 인증 헤더
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Cron 요청 인증 확인
 */
function verifyCronRequest(request: NextRequest): boolean {
  // 개발 환경에서는 인증 스킵
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Vercel Cron은 Authorization 헤더로 검증
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  // 또는 X-Vercel-Cron 헤더 체크
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', {
      path: '/api/cron/post-meeting',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  logger.info('post_meeting_cron_started')

  try {
    // 모임 종료 후 알림 처리
    const stats = await processPostMeetingNotifications()

    timer.done('post_meeting_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Post-meeting notification cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('post_meeting_cron_error', {
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
