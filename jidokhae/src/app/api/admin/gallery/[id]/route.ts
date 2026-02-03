/**
 * 갤러리 이미지 상세 API
 * PUT - 갤러리 이미지 수정
 * DELETE - 갤러리 이미지 삭제
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
    const hasAccess = await hasPermission(authUser.id, 'banner_manage')
    if (!hasAccess) {
      throw new AppError(ErrorCode.AUTH_FORBIDDEN)
    }

    const body = await request.json()
    const { image_url, alt_text, is_active, display_order } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (image_url !== undefined) updateData.image_url = image_url
    if (alt_text !== undefined) updateData.alt_text = alt_text
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    // 갤러리 이미지 수정
    const serviceClient = await createServiceClient()
    const { data: image, error } = await serviceClient
      .from('gallery_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update gallery image', { error, imageId: id })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Gallery image updated', { imageId: id, updatedBy: authUser.id })

    return successResponse(image)
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { id } = await params
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

    // 갤러리 이미지 삭제
    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from('gallery_images')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete gallery image', { error, imageId: id })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Gallery image deleted', { imageId: id, deletedBy: authUser.id })

    return successResponse({ deleted: true })
  })
}
