/**
 * 운영자 권한 관리 API
 * GET - 운영자 목록 및 권한 조회 (super_admin 전용)
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { ALL_PERMISSIONS, Permission } from '@/lib/permissions'

const logger = createLogger('admin')

interface AdminWithPermissions {
  id: string
  name: string
  email: string
  role: string
  permissions: Permission[]
}

export async function GET() {
  return withErrorHandler(async () => {
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
      logger.warn('permission_access_denied', { userId: authUser.id })
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 서비스 클라이언트로 운영자 목록 조회
    const serviceClient = await createServiceClient()
    const { data: admins, error: adminsError } = await serviceClient
      .from('users')
      .select('id, name, email, role')
      .in('role', ['admin', 'super_admin'])
      .order('role', { ascending: false }) // super_admin 먼저
      .order('name')

    if (adminsError) {
      logger.error('admin_list_fetch_error', { error: adminsError.message })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 각 운영자의 권한 조회
    const adminIds = admins?.map((a: { id: string }) => a.id) || []
    const { data: permissions } = await serviceClient
      .from('admin_permissions')
      .select('user_id, permission')
      .in('user_id', adminIds)

    // 권한을 사용자별로 그룹화
    const permissionsByUser: Record<string, Permission[]> = {}
    permissions?.forEach((p: { user_id: string; permission: string }) => {
      if (!permissionsByUser[p.user_id]) {
        permissionsByUser[p.user_id] = []
      }
      permissionsByUser[p.user_id].push(p.permission as Permission)
    })

    // 결과 조합
    const result: AdminWithPermissions[] = (admins || []).map(
      (admin: { id: string; name: string; email: string; role: string }) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions:
          admin.role === 'super_admin'
            ? ALL_PERMISSIONS
            : permissionsByUser[admin.id] || [],
      })
    )

    logger.info('admin_list_fetched', { count: result.length })
    return successResponse(result)
  })
}
