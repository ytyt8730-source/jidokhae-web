/**
 * 알림 템플릿 목록 API
 * M5 Phase 2 - 알림 템플릿 관리
 */

import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAdmin } from '@/lib/api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('templates')

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new Error('Unauthorized')
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    requireAdmin(user?.role)

    const timer = logger.startTimer()

    // 모든 템플릿 조회
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    timer.done('Templates fetched', { count: templates?.length || 0 })

    return successResponse(templates || [])
  })
}
