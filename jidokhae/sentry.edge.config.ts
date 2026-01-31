/**
 * Sentry Edge Configuration
 * Beta 출시 조건: 에러 모니터링
 *
 * Edge runtime에서 발생하는 에러를 Sentry로 전송
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 샘플링 레이트
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',
})
