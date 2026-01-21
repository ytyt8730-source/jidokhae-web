/**
 * 배너 상세 API
 * GET - 배너 상세 조회
 * PUT - 배너 수정
 * DELETE - 배너 삭제
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

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 배너 조회
    const serviceClient = await createServiceClient()
    const { data: banner, error } = await serviceClient
      .from('banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !banner) {
      throw new AppError(ErrorCode.NOT_FOUND, '배너를 찾을 수 없습니다')
    }

    return successResponse(banner)
  })
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
    const { title, image_url, link_url, is_active, display_order, start_date, end_date } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (image_url !== undefined) updateData.image_url = image_url
    if (link_url !== undefined) updateData.link_url = link_url
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date

    // 배너 수정
    const serviceClient = await createServiceClient()
    const { data: banner, error } = await serviceClient
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update banner', { error, bannerId: id })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Banner updated', { bannerId: id, updatedBy: authUser.id })

    return successResponse(banner)
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

    // 배너 삭제
    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete banner', { error, bannerId: id })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('Banner deleted', { bannerId: id, deletedBy: authUser.id })

    return successResponse({ deleted: true })
  })
}
