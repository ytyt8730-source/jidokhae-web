/**
 * 대기자 응답 기한 체크 Cron API
 * M3 알림시스템 - Phase 3
 *
 * 매시간 실행
 * - 응답 기한 초과된 대기자 expired 처리
 * - 다음 대기자에게 알림 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { processExpiredWaitlists } from '@/lib/waitlist-notification'
import { cronLogger } from '@/lib/logger'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/waitlist', request)
  }

  logger.info('waitlist_cron_started')

  try {
    const stats = await processExpiredWaitlists()

    timer.done('waitlist_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Waitlist cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('waitlist_cron_error', {
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
