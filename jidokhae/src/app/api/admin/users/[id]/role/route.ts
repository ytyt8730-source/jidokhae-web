/**
 * 사용자 역할 변경 API
 * PUT - member ↔ admin 역할 변경 (super_admin 전용)
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin')

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const { id: targetUserId } = await context.params
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // super_admin 권한 확인
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!currentUser || currentUser.role !== 'super_admin') {
      logger.warn('role_change_denied', { userId: authUser.id })
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 본인의 역할은 변경 불가
    if (targetUserId === authUser.id) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN, {
        message: '본인의 역할은 변경할 수 없습니다.',
      })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const newRole: string = body.role

    // 유효한 역할인지 검증 (super_admin으로의 변경은 불가)
    if (!['member', 'admin'].includes(newRole)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '유효하지 않은 역할입니다. (member 또는 admin만 가능)',
      })
    }

    // 대상 사용자 확인
    const serviceClient = await createServiceClient()
    const { data: targetUser, error: userError } = await serviceClient
      .from('users')
      .select('id, name, role')
      .eq('id', targetUserId)
      .single()

    if (userError || !targetUser) {
      throw new AppError(ErrorCode.AUTH_USER_NOT_FOUND)
    }

    // super_admin의 역할은 변경 불가
    if (targetUser.role === 'super_admin') {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN, {
        message: 'super_admin의 역할은 변경할 수 없습니다.',
      })
    }

    // 역할 변경
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateError) {
      logger.error('role_update_error', { error: updateError.message })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // admin → member 변경 시 권한 삭제
    if (newRole === 'member') {
      const { error: deleteError } = await serviceClient
        .from('admin_permissions')
        .delete()
        .eq('user_id', targetUserId)

      if (deleteError) {
        logger.warn('permission_cleanup_error', { error: deleteError.message })
        // 권한 삭제 실패해도 역할 변경은 성공으로 처리
      }
    }

    logger.info('role_changed', {
      targetUserId,
      targetUserName: targetUser.name,
      oldRole: targetUser.role,
      newRole,
      changedBy: authUser.id,
    })

    return successResponse({
      userId: targetUserId,
      role: newRole,
    })
  })
}
