/**
 * 월말 참여 독려 Cron API
 * M3 알림시스템 - Phase 4
 *
 * 매월 25일 오전 10시(KST) 실행
 * - 이번 달 미신청 회원에게 참여 독려 알림
 */

import { NextRequest, NextResponse } from 'next/server'
import { processMonthlyEncourage } from '@/lib/segment-notification'
import { cronLogger } from '@/lib/logger'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/monthly', request)
  }

  logger.info('monthly_cron_started')

  try {
    const stats = await processMonthlyEncourage()

    timer.done('monthly_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Monthly encourage cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('monthly_cron_error', {
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
