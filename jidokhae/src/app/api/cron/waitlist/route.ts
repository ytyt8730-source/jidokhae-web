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

// Vercel Cron 인증
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
      path: '/api/cron/waitlist',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
