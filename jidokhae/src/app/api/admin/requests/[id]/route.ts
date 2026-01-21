/**
 * 요청함 상세/답변 API
 * GET - 요청 상세 조회
 * PUT - 답변 작성
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin')

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { id } = await params
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 권한 확인
    const hasAccess = await hasPermission(authUser.id, 'request_respond')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 요청 상세 조회
    const serviceClient = await createServiceClient()
    const { data: request_, error } = await serviceClient
      .from('suggestions')
      .select(`
        id,
        content,
        status,
        answer,
        answered_at,
        created_at,
        user:users!suggestions_user_id_fkey (
          id,
          name,
          email
        ),
        meeting:meetings!suggestions_meeting_id_fkey (
          id,
          title
        ),
        answerer:users!suggestions_answered_by_fkey (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error || !request_) {
      throw new AppError(ErrorCode.NOT_FOUND, '요청을 찾을 수 없습니다')
    }

    return successResponse(request_)
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { id } = await params
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 권한 확인
    const hasAccess = await hasPermission(authUser.id, 'request_respond')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    const body = await request.json()
    const { answer, status } = body

    if (!answer || answer.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, '답변 내용을 입력해주세요')
    }

    // 답변 저장
    const serviceClient = await createServiceClient()
    const { data: updated, error } = await serviceClient
      .from('suggestions')
      .update({
        answer: answer.trim(),
        answered_by: authUser.id,
        answered_at: new Date().toISOString(),
        status: status || 'answered',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to save answer', { error, requestId: id })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Request answered', { requestId: id, answeredBy: authUser.id })

    return successResponse(updated)
  })
}
