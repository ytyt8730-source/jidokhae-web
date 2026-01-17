/**
 * 세그먼트별 리마인드 Cron API
 * M3 알림시스템 - Phase 4
 *
 * 매일 오전 11시(KST) 실행
 * - 온보딩 이탈 위험 (첫 참여 후 45일)
 * - 휴면 위험 (마지막 참여 후 3개월)
 * - 자격 만료 임박 (마지막 정기모임 5개월)
 *
 * 우선순위: 자격만료 > 휴면 > 온보딩
 */

import { NextRequest, NextResponse } from 'next/server'
import { processSegmentReminders } from '@/lib/segment-notification'
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
      path: '/api/cron/segment-reminder',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('segment_reminder_cron_started')

  try {
    const stats = await processSegmentReminders()

    timer.done('segment_reminder_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Segment reminder cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('segment_reminder_cron_error', {
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
