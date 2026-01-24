/**
 * API 유틸리티 테스트
 *
 * lib/api.ts의 API 응답 헬퍼들을 테스트합니다.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  validateRequired,
} from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'

describe('successResponse', () => {
  it('성공 응답을 생성한다', async () => {
    const data = { id: 1, name: 'Test' }
    const response = successResponse(data)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(data)
  })

  it('커스텀 상태 코드를 지정할 수 있다', async () => {
    const response = successResponse({ created: true }, { status: 201 })

    expect(response.status).toBe(201)
  })

  it('메타데이터에 timestamp를 포함한다', async () => {
    const response = successResponse([])
    const body = await response.json()

    expect(body.meta).toBeDefined()
    expect(body.meta.timestamp).toBeDefined()
    expect(typeof body.meta.timestamp).toBe('string')
  })

  it('pagination 메타데이터를 포함할 수 있다', async () => {
    const pagination = { page: 1, limit: 10, total: 100 }
    const response = successResponse([], { pagination })
    const body = await response.json()

    expect(body.meta.pagination).toBeDefined()
    expect(body.meta.pagination.page).toBe(1)
    expect(body.meta.pagination.limit).toBe(10)
    expect(body.meta.pagination.total).toBe(100)
    expect(body.meta.pagination.totalPages).toBe(10)
  })

  it('null 데이터를 처리한다', async () => {
    const response = successResponse(null)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data).toBeNull()
  })
})

describe('errorResponse', () => {
  it('에러 응답을 생성한다', async () => {
    const response = errorResponse(ErrorCode.NOT_FOUND)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND)
  })

  it('에러 상세 정보를 포함할 수 있다', async () => {
    const details = { field: 'email', reason: 'invalid' }
    const response = errorResponse(ErrorCode.VALIDATION_ERROR, details)
    const body = await response.json()

    expect(body.error.details).toEqual(details)
  })

  it('AppError를 받아 처리한다', async () => {
    const error = new AppError(ErrorCode.AUTH_UNAUTHORIZED, { userId: '123' })
    const response = errorResponse(error.code, error.details)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe(ErrorCode.AUTH_UNAUTHORIZED)
    expect(body.error.details).toEqual({ userId: '123' })
  })
})

describe('withErrorHandler', () => {
  it('성공하는 핸들러를 실행한다', async () => {
    const handler = vi.fn().mockResolvedValue(successResponse({ ok: true }))
    const response = await withErrorHandler(handler)
    const body = await response.json()

    expect(handler).toHaveBeenCalled()
    expect(body.success).toBe(true)
  })

  it('AppError를 캐치하여 에러 응답을 반환한다', async () => {
    const handler = vi.fn().mockRejectedValue(
      new AppError(ErrorCode.MEETING_NOT_FOUND)
    )
    const response = await withErrorHandler(handler)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe(ErrorCode.MEETING_NOT_FOUND)
  })

  it('일반 Error를 캐치하여 내부 에러로 처리한다', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Unknown error'))
    const response = await withErrorHandler(handler)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR)
  })
})

describe('validateRequired', () => {
  it('필수 필드가 있으면 통과한다', () => {
    const data: Record<string, unknown> = { name: 'Test', email: 'test@example.com' }

    expect(() => validateRequired(data, ['name', 'email'])).not.toThrow()
  })

  it('필수 필드가 없으면 에러를 던진다', () => {
    const data: Record<string, unknown> = { name: 'Test' }

    expect(() => validateRequired(data, ['name', 'email'])).toThrow(AppError)
    expect(() => validateRequired(data, ['name', 'email'])).toThrow()
  })

  it('빈 문자열을 누락으로 처리한다', () => {
    const data: Record<string, unknown> = { name: '', email: 'test@example.com' }

    expect(() => validateRequired(data, ['name', 'email'])).toThrow(AppError)
  })

  it('null을 누락으로 처리한다', () => {
    const data: Record<string, unknown> = { name: null, email: 'test@example.com' }

    expect(() => validateRequired(data, ['name', 'email'])).toThrow(AppError)
  })

  it('undefined를 누락으로 처리한다', () => {
    const data: Record<string, unknown> = { email: 'test@example.com' }

    expect(() => validateRequired(data, ['name', 'email'])).toThrow(AppError)
  })
})
