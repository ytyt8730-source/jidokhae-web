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
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/post-meeting', request)
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
