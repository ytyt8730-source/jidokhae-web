/**
 * 환경 변수 검증 및 타입 안전성
 *
 * 런타임에 환경 변수의 존재와 형식을 검증하여
 * 타입 안전한 접근을 보장합니다.
 */

// 필수 환경 변수 정의
const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

const serverOnlyEnvVars = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PORTONE_API_KEY: process.env.PORTONE_API_KEY,
  PORTONE_API_SECRET: process.env.PORTONE_API_SECRET,
  PORTONE_WEBHOOK_SECRET: process.env.PORTONE_WEBHOOK_SECRET,
  SOLAPI_API_KEY: process.env.SOLAPI_API_KEY,
  SOLAPI_API_SECRET: process.env.SOLAPI_API_SECRET,
  SOLAPI_SENDER: process.env.SOLAPI_SENDER,
  SOLAPI_KAKAO_PFID: process.env.SOLAPI_KAKAO_PFID,
} as const

const optionalEnvVars = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Sentry 설정 (Beta 출시 조건)
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
} as const

// 타입 정의
type RequiredEnvVars = typeof requiredEnvVars
type ServerOnlyEnvVars = typeof serverOnlyEnvVars
type OptionalEnvVars = typeof optionalEnvVars

// 환경 변수 검증 함수
function validateEnvVars(): void {
  const missingVars: string[] = []

  // 필수 변수 검증
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`
    )
  }
}

// 서버 환경 변수 검증 (서버 사이드에서만)
function validateServerEnvVars(): void {
  if (typeof window !== 'undefined') return

  const missingVars: string[] = []

  Object.entries(serverOnlyEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing server environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`
    )
  }
}

// 초기화 시 검증 실행
if (process.env.NODE_ENV !== 'test') {
  validateEnvVars()
  validateServerEnvVars()
}

// 타입 안전한 환경 변수 접근
export const env = {
  // 클라이언트 안전 변수
  supabase: {
    url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  app: {
    url: optionalEnvVars.NEXT_PUBLIC_APP_URL,
  },
  // 서버 전용 변수 (getter로 접근 제한)
  get server() {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client')
    }
    return {
      supabaseServiceKey: serverOnlyEnvVars.SUPABASE_SERVICE_ROLE_KEY ?? '',
      portone: {
        apiKey: serverOnlyEnvVars.PORTONE_API_KEY ?? '',
        apiSecret: serverOnlyEnvVars.PORTONE_API_SECRET ?? '',
        webhookSecret: serverOnlyEnvVars.PORTONE_WEBHOOK_SECRET ?? '',
      },
      solapi: {
        apiKey: serverOnlyEnvVars.SOLAPI_API_KEY ?? '',
        apiSecret: serverOnlyEnvVars.SOLAPI_API_SECRET ?? '',
        sender: serverOnlyEnvVars.SOLAPI_SENDER ?? '',
        kakaoPfid: serverOnlyEnvVars.SOLAPI_KAKAO_PFID ?? '',
      },
      sentry: {
        dsn: optionalEnvVars.SENTRY_DSN ?? optionalEnvVars.NEXT_PUBLIC_SENTRY_DSN ?? '',
        authToken: optionalEnvVars.SENTRY_AUTH_TOKEN ?? '',
        org: optionalEnvVars.SENTRY_ORG ?? '',
        project: optionalEnvVars.SENTRY_PROJECT ?? '',
      },
    }
  },
} as const

// 환경 확인 헬퍼
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'

// 환경 변수 설정 여부 확인
export function isConfigured(service: 'supabase' | 'portone' | 'solapi' | 'sentry'): boolean {
  switch (service) {
    case 'supabase':
      return !!(env.supabase.url && env.supabase.anonKey)
    case 'portone':
      return typeof window === 'undefined' && !!(env.server.portone.apiKey && env.server.portone.apiSecret)
    case 'solapi':
      return typeof window === 'undefined' && !!(env.server.solapi.apiKey && env.server.solapi.apiSecret)
    case 'sentry':
      return !!(optionalEnvVars.SENTRY_DSN || optionalEnvVars.NEXT_PUBLIC_SENTRY_DSN)
    default:
      return false
  }
}

export type { RequiredEnvVars, ServerOnlyEnvVars, OptionalEnvVars }
