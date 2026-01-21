/**
 * 요청함(건의함) 목록 API
 * GET - 요청함 목록 조회 (request_respond 권한 필요)
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 권한 확인 (request_respond)
    const hasAccess = await hasPermission(authUser.id, 'request_respond')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 요청함 목록 조회
    const serviceClient = await createServiceClient()
    const { data: requests, error } = await serviceClient
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
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 미답변 건수 계산
    const pendingCount = requests?.filter((r: { status: string }) => r.status === 'pending').length || 0

    return successResponse({
      requests: requests || [],
      pendingCount,
    })
  })
}
