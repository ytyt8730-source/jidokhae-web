/**
 * 배너 순서 변경 API
 * PUT - 배너 순서 일괄 업데이트
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin')

export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 권한 확인
    const hasAccess = await hasPermission(authUser.id, 'banner_manage')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    const body = await request.json()
    const { bannerIds } = body

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, '배너 ID 배열이 필요합니다')
    }

    // 순서 일괄 업데이트
    const serviceClient = await createServiceClient()

    for (let i = 0; i < bannerIds.length; i++) {
      const { error } = await serviceClient
        .from('banners')
        .update({ display_order: i + 1, updated_at: new Date().toISOString() })
        .eq('id', bannerIds[i])

      if (error) {
        logger.error('Failed to update banner order', { error, bannerId: bannerIds[i] })
        throw new AppError(ErrorCode.DATABASE_ERROR)
      }
    }

    logger.info('Banner order updated', { count: bannerIds.length, updatedBy: authUser.id })

    return successResponse({ success: true })
  })
}
