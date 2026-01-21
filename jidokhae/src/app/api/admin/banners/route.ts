/**
 * 배너 관리 API
 * GET - 배너 목록 조회
 * POST - 배너 생성
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin')

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 권한 확인 (banner_manage)
    const hasAccess = await hasPermission(authUser.id, 'banner_manage')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 배너 목록 조회
    const serviceClient = await createServiceClient()
    const { data: banners, error } = await serviceClient
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(banners || [])
  })
}

export async function POST(request: NextRequest) {
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
    const { title, image_url, link_url, start_date, end_date } = body

    if (!title || !image_url) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, '제목과 이미지 URL은 필수입니다')
    }

    // 현재 최대 display_order 조회
    const serviceClient = await createServiceClient()
    const { data: maxOrder } = await serviceClient
      .from('banners')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order || 0) + 1

    // 배너 생성
    const { data: banner, error } = await serviceClient
      .from('banners')
      .insert({
        title,
        image_url,
        link_url: link_url || null,
        display_order: nextOrder,
        start_date: start_date || null,
        end_date: end_date || null,
        created_by: authUser.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create banner', { error })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Banner created', { bannerId: banner.id, createdBy: authUser.id })

    return successResponse(banner)
  })
}
