/**
 * Sentry Server-side Configuration
 * Beta 출시 조건: 에러 모니터링
 *
 * 서버 사이드에서 발생하는 에러를 Sentry로 전송
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 샘플링 레이트 (프로덕션에서는 낮게)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',

  // 무시할 에러 패턴
  ignoreErrors: [
    // Supabase 인증 관련 (정상 플로우)
    'AuthSessionMissingError',
    'User not found',

    // 네트워크 관련
    'ECONNRESET',
    'ETIMEDOUT',
  ],

  // 민감 정보 제거
  beforeSend(event) {
    // 요청 데이터에서 민감 정보 제거
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
    }

    // 사용자 정보에서 민감 데이터 제거
    if (event.user) {
      delete event.user.ip_address
      delete event.user.email
    }

    return event
  },
})
