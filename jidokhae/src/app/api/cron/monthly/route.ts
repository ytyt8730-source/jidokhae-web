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

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', {
      path: '/api/cron/monthly',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
