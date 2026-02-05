/**
 * Rate Limiting 유틸리티
 *
 * [보안] API 요청 빈도 제한으로 브루트포스, DoS, 스팸 방지
 *
 * 사용법:
 * const limiter = createRateLimiter({ interval: 60000, limit: 10 }) // 1분에 10회
 * const { success, remaining } = await limiter.check(identifier)
 */

import { NextResponse } from 'next/server'
import { cronLogger } from '@/lib/logger'

const logger = cronLogger

interface RateLimitConfig {
  /** 시간 윈도우 (밀리초) */
  interval: number
  /** 윈도우 내 최대 요청 수 */
  limit: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 권장)
const store = new Map<string, RateLimitEntry>()

// 정기적으로 만료된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => store.delete(key))
}, 60000) // 1분마다 정리

/**
 * Rate Limiter 생성
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { interval, limit } = config

  return {
    /**
     * 요청 허용 여부 확인
     * @param identifier - 식별자 (IP, userId 등)
     */
    check(identifier: string): RateLimitResult {
      const now = Date.now()
      const key = identifier

      let entry = store.get(key)

      // 새 윈도우 시작
      if (!entry || entry.resetAt < now) {
        entry = {
          count: 1,
          resetAt: now + interval,
        }
        store.set(key, entry)
        return {
          success: true,
          remaining: limit - 1,
          resetAt: entry.resetAt,
        }
      }

      // 기존 윈도우 내 요청
      entry.count++
      store.set(key, entry)

      if (entry.count > limit) {
        logger.warn('rate_limit_exceeded', {
          identifier: identifier.slice(0, 20), // 로그에 전체 IP 노출 방지
          count: entry.count,
          limit,
        })
        return {
          success: false,
          remaining: 0,
          resetAt: entry.resetAt,
        }
      }

      return {
        success: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      }
    },

    /**
     * 특정 식별자 제한 해제
     */
    reset(identifier: string): void {
      store.delete(identifier)
    },
  }
}

// 기본 Rate Limiter 프리셋
export const rateLimiters = {
  /** 일반 API: 1분에 60회 */
  standard: createRateLimiter({ interval: 60000, limit: 60 }),
  /** 인증 API: 1분에 10회 */
  auth: createRateLimiter({ interval: 60000, limit: 10 }),
  /** 결제 API: 1분에 5회 */
  payment: createRateLimiter({ interval: 60000, limit: 5 }),
  /** 검색/조회 API: 1분에 120회 */
  search: createRateLimiter({ interval: 60000, limit: 120 }),
}

/**
 * Rate Limit 응답 헤더 설정
 */
export function setRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  limit: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(result.resetAt))
  return response
}

/**
 * Rate Limit 초과 응답
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  )
}

/**
 * 클라이언트 IP 추출
 */
export function getClientIp(request: Request): string {
  // Vercel/Cloudflare 프록시 헤더 우선
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Rate Limit 미들웨어 헬퍼
 *
 * 사용법:
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = checkRateLimit(request, rateLimiters.payment)
 *   if (!rateLimitResult.success) {
 *     return rateLimitExceededResponse(rateLimitResult)
 *   }
 *   // ... 로직
 * }
 */
export function checkRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>
): RateLimitResult {
  const ip = getClientIp(request)
  return limiter.check(ip)
}
