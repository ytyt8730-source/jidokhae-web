/**
 * 회원 검색 API
 * GET - 이름 또는 이메일로 회원 검색 (super_admin 전용)
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'

export async function GET(request: NextRequest) {
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
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 검색어
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return successResponse([])
    }

    // 회원 검색 (member 역할만)
    const serviceClient = await createServiceClient()
    const { data: members, error } = await serviceClient
      .from('users')
      .select('id, name, email')
      .eq('role', 'member')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
      .limit(10)

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(members || [])
  })
}
