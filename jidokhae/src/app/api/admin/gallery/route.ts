/**
 * 갤러리 이미지 관리 API
 * GET - 갤러리 목록 조회
 * POST - 갤러리 이미지 생성
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

    // 권한 확인 (banner_manage 재사용)
    const hasAccess = await hasPermission(authUser.id, 'banner_manage')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    // 갤러리 목록 조회
    const serviceClient = await createServiceClient()
    const { data: images, error } = await serviceClient
      .from('gallery_images')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(images || [])
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
    const { image_url, alt_text } = body

    if (!image_url || !alt_text) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, '이미지 URL과 설명은 필수입니다')
    }

    // 현재 최대 display_order 조회
    const serviceClient = await createServiceClient()
    const { data: maxOrder } = await serviceClient
      .from('gallery_images')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order || 0) + 1

    // 갤러리 이미지 생성
    const { data: image, error } = await serviceClient
      .from('gallery_images')
      .insert({
        image_url,
        alt_text,
        display_order: nextOrder,
        created_by: authUser.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create gallery image', { error })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Gallery image created', { imageId: image.id, createdBy: authUser.id })

    return successResponse(image)
  })
}
