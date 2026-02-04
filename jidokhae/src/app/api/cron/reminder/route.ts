/**
 * 모임 리마인드 Cron API
 * M3 알림시스템 - Phase 2
 *
 * 매일 오전 7시(KST) 실행
 * - 3일 전 리마인드
 * - 1일 전 리마인드
 * - 당일 리마인드
 */

import { NextRequest, NextResponse } from 'next/server'
import { processAllReminders } from '@/lib/reminder'
import { cronLogger } from '@/lib/logger'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/reminder', request)
  }

  logger.info('reminder_cron_started')

  try {
    // 리마인드 처리
    const stats = await processAllReminders()

    timer.done('reminder_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Reminder cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('reminder_cron_error', {
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
