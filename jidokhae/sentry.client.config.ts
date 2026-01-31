/**
 * Sentry Client-side Configuration
 * Beta 출시 조건: 에러 모니터링
 *
 * 브라우저에서 발생하는 에러를 Sentry로 전송
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 구분
  environment: process.env.NODE_ENV,

  // 샘플링 레이트 (프로덕션에서는 낮게)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 세션 리플레이 (프로덕션에서만)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',

  // 무시할 에러 패턴
  ignoreErrors: [
    // 네트워크 관련
    'Failed to fetch',
    'NetworkError',
    'Load failed',

    // 브라우저 확장 프로그램
    'chrome-extension://',
    'moz-extension://',

    // 사용자 행동 (무해한 에러)
    'ResizeObserver loop',
    'Non-Error promise rejection',
  ],

  // 민감 정보 제거
  beforeSend(event) {
    // 사용자 정보에서 민감 데이터 제거
    if (event.user) {
      delete event.user.ip_address
      delete event.user.email
    }
    return event
  },

  // 통합 설정
  integrations: [
    Sentry.replayIntegration({
      // 세션 리플레이에서 민감 정보 마스킹
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
