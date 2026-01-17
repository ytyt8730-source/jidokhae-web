import { NextResponse } from 'next/server'
import { AppError, ErrorCode, ERROR_HTTP_STATUS, ERROR_MESSAGES, toAppError } from './errors'

// =============================================
// API 응답 타입 정의
// =============================================

/**
 * 성공 응답 타입
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
  }
}

/**
 * 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================
// 응답 생성 헬퍼 함수
// =============================================

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number
    pagination?: {
      page: number
      limit: number
      total: number
    }
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options?.pagination && {
        pagination: {
          ...options.pagination,
          totalPages: Math.ceil(options.pagination.total / options.pagination.limit),
        },
      }),
    },
  }

  return NextResponse.json(response, { status: options?.status ?? 200 })
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: ErrorCode,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorResponse['error'] = {
    code,
    message: ERROR_MESSAGES[code],
  }

  if (details !== undefined) {
    error.details = details
  }

  const response: ApiErrorResponse = {
    success: false,
    error,
  }

  return NextResponse.json(response, { status: ERROR_HTTP_STATUS[code] })
}

/**
 * AppError에서 응답 생성
 */
export function appErrorResponse(error: AppError): NextResponse<ApiErrorResponse> {
  return errorResponse(error.code, error.details)
}

/**
 * 알 수 없는 에러에서 응답 생성
 */
export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  const appError = toAppError(error)
  return appErrorResponse(appError)
}

// =============================================
// API 라우트 핸들러 래퍼
// =============================================

type ApiHandler<T> = () => Promise<NextResponse<ApiSuccessResponse<T>>>

/**
 * API 핸들러 래퍼 (에러 자동 처리)
 * 
 * @example
 * export async function GET() {
 *   return withErrorHandler(async () => {
 *     const data = await fetchData()
 *     return successResponse(data)
 *   })
 * }
 */
export async function withErrorHandler<T>(
  handler: ApiHandler<T>
): Promise<NextResponse<ApiSuccessResponse<T> | ApiErrorResponse>> {
  try {
    return await handler()
  } catch (error) {
    return handleError(error)
  }
}

// =============================================
// 요청 검증 헬퍼
// =============================================

/**
 * 필수 필드 검증
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  )

  if (missingFields.length > 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, {
      missingFields,
      message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
    })
  }
}

/**
 * 인증 검증
 */
export function requireAuth(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
  }
}

/**
 * 관리자 권한 검증
 */
export function requireAdmin(role: string | null | undefined): void {
  if (role !== 'admin' && role !== 'super_admin') {
    throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
  }
}

