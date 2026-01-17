/**
 * 운영자 수동 알림 발송 API
 * M3 알림시스템 - Phase 4
 *
 * POST: 수동 알림 발송
 * GET: 발송 이력 조회
 */

import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAdmin } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import {
  sendAndLogNotification,
  NOTIFICATION_TEMPLATES,
} from '@/lib/notification'
import { notificationLogger } from '@/lib/logger'

interface SendNotificationRequest extends Record<string, unknown> {
  targetType: 'all' | 'active' | 'meeting_participants'
  meetingId?: string
  message: string
}

interface NotificationTarget {
  userId: string
  userName: string
  phone: string
}

// 데이터베이스 결과 타입
interface UserRow {
  id: string
  name: string
  phone: string | null
}

interface RegistrationWithUser {
  user_id: string
  users: UserRow | null
}

/**
 * 대상 회원 목록 조회
 */
async function getTargetUsers(
  targetType: string,
  meetingId?: string
): Promise<NotificationTarget[]> {
  const supabase = await createServiceClient()

  if (targetType === 'meeting_participants' && meetingId) {
    // 특정 모임 참가자
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        user_id,
        users (
          id,
          name,
          phone
        )
      `)
      .eq('meeting_id', meetingId)
      .eq('status', 'confirmed')

    if (error || !data) {
      return []
    }

    return (data as RegistrationWithUser[])
      .filter((reg: RegistrationWithUser) => {
        const user = reg.users
        return user && user.phone
      })
      .map((reg: RegistrationWithUser) => {
        const user = reg.users as UserRow & { phone: string }
        return {
          userId: user.id,
          userName: user.name,
          phone: user.phone,
        }
      })
  }

  if (targetType === 'active') {
    // 활성 회원 (최근 3개월 내 참여 또는 신청)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('role', 'member')
      .not('phone', 'is', null)
      .gt('last_regular_meeting_at', threeMonthsAgo.toISOString())

    if (error || !data) {
      return []
    }

    return (data as UserRow[])
      .filter((user: UserRow) => user.phone)
      .map((user: UserRow) => ({
        userId: user.id,
        userName: user.name,
        phone: user.phone!,
      }))
  }

  // 전체 회원
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('role', 'member')
    .not('phone', 'is', null)

  if (error || !data) {
    return []
  }

  return (data as UserRow[])
    .filter((user: UserRow) => user.phone)
    .map((user: UserRow) => ({
      userId: user.id,
      userName: user.name,
      phone: user.phone!,
    }))
}

/**
 * POST: 수동 알림 발송
 */
export async function POST(request: NextRequest) {
  const logger = notificationLogger
  const timer = logger.startTimer()

  try {
    const body = await request.json() as SendNotificationRequest
    validateRequired(body, ['targetType', 'message'])

    const { targetType, meetingId, message } = body

    const supabase = await createClient()

    // 인증 및 권한 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    requireAdmin(userData?.role)

    // 권한 확인 (notification_send 권한 필요)
    if (userData?.role === 'admin') {
      const { data: permission } = await supabase
        .from('admin_permissions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('permission', 'notification_send')
        .single()

      if (!permission) {
        return errorResponse(ErrorCode.AUTH_FORBIDDEN, {
          message: '알림 발송 권한이 없습니다',
        })
      }
    }

    logger.info('admin_notification_started', {
      adminId: authUser.id,
      targetType,
      meetingId,
    })

    // 대상 회원 조회
    const targets = await getTargetUsers(targetType, meetingId)

    if (targets.length === 0) {
      return successResponse({
        success: false,
        message: '발송 대상 회원이 없습니다',
        stats: { total: 0, sent: 0, failed: 0 },
      })
    }

    // 알림 발송
    const stats = { total: targets.length, sent: 0, failed: 0 }

    for (const target of targets) {
      const result = await sendAndLogNotification({
        templateCode: NOTIFICATION_TEMPLATES.ADMIN_NOTICE,
        phone: target.phone,
        variables: {
          회원명: target.userName,
          메시지: message,
        },
        userId: target.userId,
        meetingId,
      })

      if (result.success) {
        stats.sent++
      } else {
        stats.failed++
      }
    }

    timer.done('admin_notification_completed', stats)

    return successResponse({
      success: true,
      message: `${stats.sent}명에게 알림을 발송했습니다`,
      stats,
    })
  } catch (error) {
    logger.error('admin_notification_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}

/**
 * GET: 발송 이력 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    requireAdmin(userData?.role)

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 발송 이력 조회 (그룹화하여 최근 발송 건 기준)
    const serviceClient = await createServiceClient()
    const { data: logs, error, count } = await serviceClient
      .from('notification_logs')
      .select(`
        id,
        user_id,
        template_code,
        phone_number,
        status,
        message_id,
        error_message,
        meeting_id,
        created_at,
        users (
          name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      notificationLogger.error('get_notification_logs_error', { error: error.message })
      return errorResponse(ErrorCode.DATABASE_ERROR)
    }

    return successResponse({
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    notificationLogger.error('get_notification_logs_exception', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
