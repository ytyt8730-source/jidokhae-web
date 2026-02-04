/**
 * 7일 미응답 자동 완료 Cron API
 * M4 소속감 - Phase 1
 *
 * 매일 오후 12시(KST) 실행
 * - 모임 종료 후 10일 경과한 미응답 참가자 자동 완료 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { processAllAutoComplete } from '@/lib/auto-complete'
import { cronLogger } from '@/lib/logger'
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  // 인증 확인
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse('/api/cron/auto-complete', request)
  }

  logger.info('auto_complete_cron_started')

  try {
    // 자동 완료 처리
    const stats = await processAllAutoComplete()

    timer.done('auto_complete_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Auto-complete cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('auto_complete_cron_error', {
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
