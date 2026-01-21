/**
 * 권한 관리 모듈
 * M5 Phase 3 - 운영자 권한 관리 (서버 전용 함수)
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'

// 상수는 별도 파일에서 re-export
export {
  PERMISSIONS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  type Permission,
  type UserRole,
} from './permissions-constants'

import { ALL_PERMISSIONS, Permission, UserRole } from './permissions-constants'

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 * - super_admin: 모든 권한 자동 보유
 * - admin: admin_permissions 테이블에서 확인
 * - member: 권한 없음
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const supabase = await createServiceClient()

  // 사용자 role 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return false
  }

  // super_admin은 모든 권한 보유
  if (user.role === 'super_admin') {
    return true
  }

  // member는 권한 없음
  if (user.role === 'member') {
    return false
  }

  // admin은 부여된 권한만 확인
  const { data: permissionData, error: permError } = await supabase
    .from('admin_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('permission', permission)
    .single()

  if (permError || !permissionData) {
    return false
  }

  return true
}

/**
 * 사용자의 모든 권한 조회
 * - super_admin: 모든 권한 반환
 * - admin: 부여된 권한만 반환
 * - member: 빈 배열
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const supabase = await createServiceClient()

  // 사용자 role 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return []
  }

  // super_admin은 모든 권한 보유
  if (user.role === 'super_admin') {
    return ALL_PERMISSIONS
  }

  // member는 권한 없음
  if (user.role === 'member') {
    return []
  }

  // admin은 부여된 권한만
  const { data: permissions, error: permError } = await supabase
    .from('admin_permissions')
    .select('permission')
    .eq('user_id', userId)

  if (permError || !permissions) {
    return []
  }

  return permissions.map((p: { permission: string }) => p.permission as Permission)
}

/**
 * 현재 로그인 사용자의 역할 및 권한 확인
 */
export async function getCurrentUserAuth(): Promise<{
  isLoggedIn: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  userId: string | null
  role: UserRole | null
}> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      isLoggedIn: false,
      isAdmin: false,
      isSuperAdmin: false,
      userId: null,
      role: null,
    }
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  const role = (user?.role as UserRole) || 'member'

  return {
    isLoggedIn: true,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    userId: authUser.id,
    role,
  }
}

/**
 * 권한 체크 후 접근 거부 시 사용할 에러
 */
export class PermissionDeniedError extends Error {
  constructor(permission: Permission) {
    super(`Permission denied: ${permission}`)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * 권한 체크 유틸리티 (API Route에서 사용)
 * 권한이 없으면 PermissionDeniedError throw
 */
export async function requirePermission(
  userId: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasPermission(userId, permission)
  if (!hasAccess) {
    throw new PermissionDeniedError(permission)
  }
}
