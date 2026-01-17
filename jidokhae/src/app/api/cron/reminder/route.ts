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
      path: '/api/cron/reminder',
      ip: request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
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
