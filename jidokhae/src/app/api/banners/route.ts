/**
 * 공개 배너 API (인증 불필요)
 * GET - 활성 배너 목록 조회
 */

import { createServiceClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'

export async function GET() {
  return withErrorHandler(async () => {
    const serviceClient = await createServiceClient()

    // 현재 날짜
    const today = new Date().toISOString().split('T')[0]

    // 활성 배너만 조회 (날짜 조건 포함)
    const { data: banners, error } = await serviceClient
      .from('banners')
      .select('id, title, image_url, link_url')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('display_order', { ascending: true })

    if (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(banners || [])
  })
}
