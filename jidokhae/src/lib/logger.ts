/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'debug',   // 개발 환경에서만
  INFO = 'info',     // 정상 동작 기록
  WARN = 'warn',     // 비정상이지만 복구 가능
  ERROR = 'error',   // 사용자 영향 있는 에러
}

/**
 * 서비스 구분
 */
export type LogService =
  | 'auth'
  | 'payment'
  | 'notification'
  | 'meeting'
  | 'registration'
  | 'waitlist'
  | 'cron'
  | 'system'
  | 'templates'
  | 'admin'
  | 'reviews'
  | 'eligibility'

/**
 * 구조화된 로그 엔트리
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  service: LogService
  action: string
  userId?: string
  metadata?: Record<string, unknown>
  error?: {
    code?: number | string
    message: string
    stack?: string
  }
  duration?: number
}

/**
 * 환경에 따른 로그 레벨 결정
 */
function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined
  if (envLevel && Object.values(LogLevel).includes(envLevel)) {
    return envLevel
  }
  return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel()
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
}

/**
 * 로그 출력 포맷
 */
function formatLog(entry: LogEntry): string {
  const { timestamp, level, service, action, userId, metadata, error, duration } = entry
  
  const parts = [
    `[${timestamp}]`,
    `[${level.toUpperCase()}]`,
    `[${service}]`,
    action,
  ]

  if (userId) {
    parts.push(`user:${userId}`)
  }

  if (duration !== undefined) {
    parts.push(`(${duration}ms)`)
  }

  let output = parts.join(' ')

  if (metadata && Object.keys(metadata).length > 0) {
    output += `\n  metadata: ${JSON.stringify(metadata)}`
  }

  if (error) {
    output += `\n  error: ${error.message}`
    if (error.code) {
      output += ` (code: ${error.code})`
    }
    if (error.stack && process.env.NODE_ENV === 'development') {
      output += `\n  stack: ${error.stack}`
    }
  }

  return output
}

/**
 * 로그 출력
 */
function log(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return

  const formatted = formatLog(entry)

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(formatted)
      break
    case LogLevel.INFO:
      console.info(formatted)
      break
    case LogLevel.WARN:
      console.warn(formatted)
      break
    case LogLevel.ERROR:
      console.error(formatted)
      break
  }

  // TODO: 프로덕션에서는 Sentry, DataDog 등으로 전송
  // if (process.env.NODE_ENV === 'production' && entry.level === LogLevel.ERROR) {
  //   Sentry.captureException(entry.error)
  // }
}

// =============================================
// 로거 인스턴스 생성
// =============================================

export interface TimerResult {
  elapsed(): number
  done(action: string, metadata?: Record<string, unknown>): void
}

export interface Logger {
  debug(action: string, metadata?: Record<string, unknown>): void
  info(action: string, metadata?: Record<string, unknown>): void
  warn(action: string, metadata?: Record<string, unknown>): void
  error(action: string, metadata?: Record<string, unknown>): void
  withUser(userId: string): Logger
  startTimer(): TimerResult
}

/**
 * 서비스별 로거 생성
 */
export function createLogger(service: LogService): Logger {
  let currentUserId: string | undefined

  const baseEntry = (level: LogLevel, action: string, metadata?: Record<string, unknown>) => ({
    timestamp: new Date().toISOString(),
    level,
    service,
    action,
    userId: currentUserId,
    metadata,
  })

  return {
    debug(action: string, metadata?: Record<string, unknown>) {
      log(baseEntry(LogLevel.DEBUG, action, metadata))
    },

    info(action: string, metadata?: Record<string, unknown>) {
      log(baseEntry(LogLevel.INFO, action, metadata))
    },

    warn(action: string, metadata?: Record<string, unknown>) {
      log(baseEntry(LogLevel.WARN, action, metadata))
    },

    error(action: string, metadata?: Record<string, unknown>) {
      log(baseEntry(LogLevel.ERROR, action, metadata))
    },

    withUser(userId: string): Logger {
      const childLogger = createLogger(service)
      currentUserId = userId
      return childLogger
    },

    startTimer(): TimerResult {
      const start = Date.now()
      return {
        elapsed(): number {
          return Date.now() - start
        },
        done(action: string, metadata?: Record<string, unknown>): void {
          const duration = Date.now() - start
          log({
            ...baseEntry(LogLevel.INFO, action, metadata),
            duration,
          })
        },
      }
    },
  }
}

// =============================================
// 미리 정의된 로거 인스턴스
// =============================================

export const authLogger = createLogger('auth')
export const paymentLogger = createLogger('payment')
export const notificationLogger = createLogger('notification')
export const meetingLogger = createLogger('meeting')
export const registrationLogger = createLogger('registration')
export const waitlistLogger = createLogger('waitlist')
export const cronLogger = createLogger('cron')
export const systemLogger = createLogger('system')

