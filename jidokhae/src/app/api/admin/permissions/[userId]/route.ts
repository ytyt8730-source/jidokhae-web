/**
 * 개별 운영자 권한 관리 API
 * GET - 특정 운영자 권한 조회
 * PUT - 권한 수정 (체크박스로 선택적 부여)
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { ALL_PERMISSIONS, Permission } from '@/lib/permissions'

const logger = createLogger('admin')

interface RouteContext {
  params: Promise<{ userId: string }>
}

// GET - 특정 운영자 권한 조회
export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const { userId } = await context.params
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
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 대상 사용자 조회
    const serviceClient = await createServiceClient()
    const { data: targetUser, error: userError } = await serviceClient
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      throw new AppError(ErrorCode.AUTH_USER_NOT_FOUND)
    }

    // super_admin은 모든 권한 보유
    if (targetUser.role === 'super_admin') {
      return successResponse({
        user: targetUser,
        permissions: ALL_PERMISSIONS,
      })
    }

    // admin의 권한 조회
    const { data: permissions } = await serviceClient
      .from('admin_permissions')
      .select('permission')
      .eq('user_id', userId)

    return successResponse({
      user: targetUser,
      permissions:
        permissions?.map((p: { permission: string }) => p.permission as Permission) ||
        [],
    })
  })
}

// PUT - 권한 수정
export async function PUT(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const { userId } = await context.params
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
      logger.warn('permission_update_denied', { userId: authUser.id })
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 대상 사용자 확인
    const serviceClient = await createServiceClient()
    const { data: targetUser, error: userError } = await serviceClient
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      throw new AppError(ErrorCode.AUTH_USER_NOT_FOUND)
    }

    // super_admin의 권한은 수정 불가
    if (targetUser.role === 'super_admin') {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN, {
        message: 'super_admin의 권한은 수정할 수 없습니다.',
      })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const newPermissions: Permission[] = body.permissions || []

    // 유효한 권한인지 검증
    const validPermissions = newPermissions.filter((p: Permission) =>
      ALL_PERMISSIONS.includes(p)
    )

    // 기존 권한 삭제 후 새 권한 추가
    const { error: deleteError } = await serviceClient
      .from('admin_permissions')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      logger.error('permission_delete_error', { error: deleteError.message })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 새 권한 추가
    if (validPermissions.length > 0) {
      const permissionRows = validPermissions.map((p: Permission) => ({
        user_id: userId,
        permission: p,
        granted_by: authUser.id,
      }))

      const { error: insertError } = await serviceClient
        .from('admin_permissions')
        .insert(permissionRows)

      if (insertError) {
        logger.error('permission_insert_error', { error: insertError.message })
        throw new AppError(ErrorCode.DATABASE_ERROR)
      }
    }

    logger.info('permission_updated', {
      targetUserId: userId,
      updatedBy: authUser.id,
      permissions: validPermissions,
    })

    return successResponse({
      userId,
      permissions: validPermissions,
    })
  })
}
