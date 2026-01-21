/**
 * 알림 템플릿 상세/수정 API
 * M5 Phase 2 - 알림 템플릿 관리
 */

import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAdmin, validateRequired } from '@/lib/api'
import { createLogger } from '@/lib/logger'
import { NotificationTemplateUpdate } from '@/types/database'
import { NextRequest } from 'next/server'

const logger = createLogger('templates')

interface RouteContext {
  params: Promise<{ id: string }>
}

// 템플릿 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const { id } = await context.params

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

    // 템플릿 조회
    const { data: template, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !template) {
      throw new Error('Template not found')
    }

    return successResponse(template)
  })
}

// 템플릿 수정
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const { id } = await context.params

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

    const body = await request.json() as NotificationTemplateUpdate
    const timer = logger.startTimer()

    // 업데이트 가능한 필드만 추출
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.message_template !== undefined) updateData.message_template = body.message_template
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.send_timing !== undefined) updateData.send_timing = body.send_timing
    if (body.send_days_before !== undefined) updateData.send_days_before = body.send_days_before
    if (body.send_time !== undefined) updateData.send_time = body.send_time
    if (body.kakao_template_id !== undefined) updateData.kakao_template_id = body.kakao_template_id
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // 업데이트 실행
    const { data: template, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info('Template updated', { templateId: id, updatedFields: Object.keys(updateData) })
    timer.done('Template updated')

    return successResponse(template)
  })
}

// 활성/비활성 토글 (PATCH)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const { id } = await context.params

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

    const body = await request.json() as { is_active: boolean }
    validateRequired(body, ['is_active'])

    // 토글 실행
    const { data: template, error } = await supabase
      .from('notification_templates')
      .update({ is_active: body.is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info('Template toggled', { templateId: id, isActive: body.is_active })

    return successResponse(template)
  })
}
