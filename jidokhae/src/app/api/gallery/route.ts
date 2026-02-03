/**
 * 공개 갤러리 API (인증 불필요)
 * GET - 활성 갤러리 이미지 목록 조회
 */

import { createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'

export async function GET() {
  return withErrorHandler(async () => {
    const serviceClient = await createServiceClient()

    // 활성 이미지만 조회
    const { data: images, error } = await serviceClient
      .from('gallery_images')
      .select('id, image_url, alt_text')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(images || [])
  })
}
