/**
 * 알림 서비스 모듈
 * M3 알림시스템 - 메인 엔트리포인트
 *
 * 사용법:
 * const notificationService = getNotificationService()
 * await notificationService.sendAlimtalk({ ... })
 */

import { createServiceClient } from '@/lib/supabase/server'
import { notificationLogger } from '@/lib/logger'
import { SolapiAdapter, MockNotificationAdapter } from './solapi'
import type {
  NotificationService,
  AlimtalkParams,
  NotificationResult,
  NotificationLogParams,
  NotificationTemplate,
} from './types'

// 데이터베이스 템플릿 행 타입
interface TemplateRow {
  id: string
  code: string
  name: string
  description: string | null
  message_template: string
  variables: string[] | null
  send_timing: string | null
  send_days_before: number | null
  send_time: string | null
  kakao_template_id: string | null
  is_active: boolean
}

// 싱글톤 인스턴스
let notificationServiceInstance: NotificationService | null = null

/**
 * 알림 서비스 인스턴스 반환
 * - 개발 환경: MockNotificationAdapter (실제 발송 안 함)
 * - 프로덕션: SolapiAdapter
 *
 * 추후 NHN Cloud 등으로 교체 시 이 함수만 수정
 */
export function getNotificationService(): NotificationService {
  if (notificationServiceInstance) {
    return notificationServiceInstance
  }

  // 환경에 따라 적절한 어댑터 선택
  const useMock = process.env.NODE_ENV === 'development' && !process.env.SOLAPI_API_KEY

  if (useMock) {
    notificationLogger.info('using_mock_notification_service')
    notificationServiceInstance = new MockNotificationAdapter()
  } else {
    notificationServiceInstance = new SolapiAdapter()
  }

  return notificationServiceInstance
}

/**
 * 알림 발송 및 로그 기록
 * 발송 후 자동으로 notification_logs에 기록
 */
export async function sendAndLogNotification(
  params: AlimtalkParams
): Promise<NotificationResult> {
  const service = getNotificationService()

  // 발송
  const result = await service.sendAlimtalk(params)

  // 로그 기록
  await logNotification({
    userId: params.userId,
    templateCode: params.templateCode,
    phoneNumber: params.phone,
    status: result.success ? 'sent' : 'failed',
    messageId: result.messageId,
    errorMessage: result.error,
    meetingId: params.meetingId,
  })

  return result
}

/**
 * 알림 발송 기록 저장
 */
export async function logNotification(params: NotificationLogParams): Promise<void> {
  try {
    const supabase = await createServiceClient()

    await supabase.from('notification_logs').insert({
      user_id: params.userId,
      template_code: params.templateCode,
      phone_number: params.phoneNumber,
      status: params.status,
      message_id: params.messageId,
      error_message: params.errorMessage,
      meeting_id: params.meetingId,
    })
  } catch (error) {
    notificationLogger.error('log_notification_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      params,
    })
  }
}

/**
 * 중복 발송 여부 확인
 * 같은 user_id + meeting_id + template_code + 날짜에 발송된 기록이 있으면 true
 */
export async function isAlreadySent(
  userId: string,
  meetingId: string,
  templateCode: string
): Promise<boolean> {
  try {
    const supabase = await createServiceClient()

    // 오늘 날짜 기준
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('meeting_id', meetingId)
      .eq('template_code', templateCode)
      .eq('status', 'sent')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .limit(1)

    if (error) {
      notificationLogger.error('check_already_sent_error', { error: error.message })
      return false
    }

    return (data?.length ?? 0) > 0
  } catch (error) {
    notificationLogger.error('check_already_sent_exception', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

/**
 * 사용자별 중복 발송 여부 확인 (모임 무관, 세그먼트 알림용)
 */
export async function isUserAlreadyNotifiedToday(
  userId: string,
  templateCode: string
): Promise<boolean> {
  try {
    const supabase = await createServiceClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('template_code', templateCode)
      .eq('status', 'sent')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .limit(1)

    if (error) {
      return false
    }

    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * 알림 템플릿 조회
 */
export async function getNotificationTemplate(
  code: string
): Promise<NotificationTemplate | null> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description ?? undefined,
      messageTemplate: data.message_template,
      variables: data.variables ?? undefined,
      sendTiming: data.send_timing ?? undefined,
      sendDaysBefore: data.send_days_before,
      sendTime: data.send_time,
      kakaoTemplateId: data.kakao_template_id,
      isActive: data.is_active,
    }
  } catch {
    return null
  }
}

/**
 * 모든 활성 템플릿 조회
 */
export async function getAllActiveTemplates(): Promise<NotificationTemplate[]> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('code')

    if (error || !data) {
      return []
    }

    return (data as TemplateRow[]).map((item: TemplateRow) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? undefined,
      messageTemplate: item.message_template,
      variables: item.variables ?? undefined,
      sendTiming: item.send_timing ?? undefined,
      sendDaysBefore: item.send_days_before,
      sendTime: item.send_time,
      kakaoTemplateId: item.kakao_template_id,
      isActive: item.is_active,
    }))
  } catch {
    return []
  }
}

// 타입 및 상수 re-export
export * from './types'
