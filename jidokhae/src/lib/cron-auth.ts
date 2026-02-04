/**
 * Cron API 인증 유틸리티
 *
 * [보안] NODE_ENV 기반 우회 제거
 * - 프로덕션: Vercel Cron 헤더 또는 CRON_SECRET 필요
 * - 개발: localhost + CRON_SECRET 필요
 */

import { NextRequest, NextResponse } from 'next/server'
import { cronLogger } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Cron 요청 인증 확인
 * @returns true if authorized, false otherwise
 */
export function verifyCronRequest(request: NextRequest): boolean {
  // Vercel Cron Authorization 헤더 검증
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  // Vercel 인프라에서 설정하는 X-Vercel-Cron 헤더 체크
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) {
    return true
  }

  // 로컬 개발: localhost에서만 + CRON_SECRET 필요
  const host = request.headers.get('host') || ''
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  if (isLocalhost && CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  return false
}

/**
 * Cron 인증 실패 응답 반환
 */
export function cronUnauthorizedResponse(path: string, request: NextRequest): NextResponse {
  cronLogger.warn('cron_unauthorized', {
    path,
    ip: request.headers.get('x-forwarded-for'),
    host: request.headers.get('host'),
  })
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

/**
 * Cron 핸들러 래퍼
 * 인증을 자동으로 처리하고 에러 로깅을 통합
 */
export function withCronAuth(
  path: string,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!verifyCronRequest(request)) {
      return cronUnauthorizedResponse(path, request)
    }
    return handler(request)
  }
}
