/**
 * 에러 시스템 테스트
 *
 * lib/errors.ts의 에러 처리 시스템을 테스트합니다.
 */
import { describe, it, expect } from 'vitest'
import {
  ErrorCode,
  ERROR_MESSAGES,
  ERROR_HTTP_STATUS,
  AppError,
  createError,
  toAppError,
} from '@/lib/errors'

describe('ErrorCode', () => {
  it('인증 에러는 1xxx 범위', () => {
    expect(ErrorCode.AUTH_INVALID_TOKEN).toBeGreaterThanOrEqual(1000)
    expect(ErrorCode.AUTH_INVALID_TOKEN).toBeLessThan(2000)
  })

  it('결제 에러는 2xxx 범위', () => {
    expect(ErrorCode.PAYMENT_FAILED).toBeGreaterThanOrEqual(2000)
    expect(ErrorCode.PAYMENT_FAILED).toBeLessThan(3000)
  })

  it('외부 서비스 에러는 3xxx 범위', () => {
    expect(ErrorCode.EXTERNAL_API_ERROR).toBeGreaterThanOrEqual(3000)
    expect(ErrorCode.EXTERNAL_API_ERROR).toBeLessThan(4000)
  })

  it('비즈니스 로직 에러는 4xxx 범위', () => {
    expect(ErrorCode.MEETING_NOT_FOUND).toBeGreaterThanOrEqual(4000)
    expect(ErrorCode.MEETING_NOT_FOUND).toBeLessThan(5000)
  })

  it('시스템 에러는 5xxx 범위', () => {
    expect(ErrorCode.INTERNAL_ERROR).toBeGreaterThanOrEqual(5000)
    expect(ErrorCode.INTERNAL_ERROR).toBeLessThan(6000)
  })
})

describe('ERROR_MESSAGES', () => {
  it('모든 에러 코드에 대한 메시지가 정의되어 있다', () => {
    const errorCodes = Object.values(ErrorCode).filter(
      (v) => typeof v === 'number'
    ) as ErrorCode[]

    errorCodes.forEach((code) => {
      expect(ERROR_MESSAGES[code]).toBeDefined()
      expect(typeof ERROR_MESSAGES[code]).toBe('string')
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0)
    })
  })

  it('메시지가 한국어로 작성되어 있다', () => {
    // 한글이 포함되어 있는지 확인
    const hasKorean = (str: string) => /[가-힣]/.test(str)

    expect(hasKorean(ERROR_MESSAGES[ErrorCode.AUTH_UNAUTHORIZED])).toBe(true)
    expect(hasKorean(ERROR_MESSAGES[ErrorCode.PAYMENT_FAILED])).toBe(true)
  })
})

describe('ERROR_HTTP_STATUS', () => {
  it('모든 에러 코드에 대한 HTTP 상태가 정의되어 있다', () => {
    const errorCodes = Object.values(ErrorCode).filter(
      (v) => typeof v === 'number'
    ) as ErrorCode[]

    errorCodes.forEach((code) => {
      expect(ERROR_HTTP_STATUS[code]).toBeDefined()
      expect(typeof ERROR_HTTP_STATUS[code]).toBe('number')
      expect(ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400)
      expect(ERROR_HTTP_STATUS[code]).toBeLessThan(600)
    })
  })

  it('인증 에러는 401 또는 403을 반환한다', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.AUTH_INVALID_TOKEN]).toBe(401)
    expect(ERROR_HTTP_STATUS[ErrorCode.AUTH_UNAUTHORIZED]).toBe(403)
  })

  it('서버 에러는 5xx를 반환한다', () => {
    expect(ERROR_HTTP_STATUS[ErrorCode.INTERNAL_ERROR]).toBe(500)
    expect(ERROR_HTTP_STATUS[ErrorCode.DATABASE_ERROR]).toBe(500)
  })
})

describe('AppError', () => {
  it('에러 코드로 생성할 수 있다', () => {
    const error = new AppError(ErrorCode.AUTH_UNAUTHORIZED)

    expect(error.code).toBe(ErrorCode.AUTH_UNAUTHORIZED)
    expect(error.message).toBe(ERROR_MESSAGES[ErrorCode.AUTH_UNAUTHORIZED])
    expect(error.httpStatus).toBe(403)
  })

  it('상세 정보를 포함할 수 있다', () => {
    const details = { userId: 'test-user', action: 'delete' }
    const error = new AppError(ErrorCode.AUTH_FORBIDDEN, details)

    expect(error.details).toEqual(details)
  })

  it('Error를 상속한다', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AppError')
  })

  it('JSON으로 직렬화할 수 있다', () => {
    const error = new AppError(ErrorCode.PAYMENT_FAILED, { amount: 10000 })
    const json = error.toJSON()

    expect(json.code).toBe(ErrorCode.PAYMENT_FAILED)
    expect(json.message).toBe(ERROR_MESSAGES[ErrorCode.PAYMENT_FAILED])
    expect(json.details).toEqual({ amount: 10000 })
  })
})

describe('createError', () => {
  it('AppError를 생성한다', () => {
    const error = createError(ErrorCode.NOT_FOUND)

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe(ErrorCode.NOT_FOUND)
  })

  it('상세 정보를 전달할 수 있다', () => {
    const error = createError(ErrorCode.MEETING_NOT_FOUND, { meetingId: '123' })

    expect(error.details).toEqual({ meetingId: '123' })
  })
})

describe('toAppError', () => {
  it('AppError는 그대로 반환한다', () => {
    const original = new AppError(ErrorCode.VALIDATION_ERROR)
    const result = toAppError(original)

    expect(result).toBe(original)
  })

  it('일반 Error를 AppError로 변환한다', () => {
    const original = new Error('Something went wrong')
    const result = toAppError(original)

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ErrorCode.INTERNAL_ERROR)
    expect(result.details).toHaveProperty('originalMessage', 'Something went wrong')
  })

  it('문자열을 AppError로 변환한다', () => {
    const result = toAppError('string error')

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ErrorCode.INTERNAL_ERROR)
  })

  it('객체를 AppError로 변환한다', () => {
    const result = toAppError({ custom: 'error' })

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ErrorCode.INTERNAL_ERROR)
  })
})
