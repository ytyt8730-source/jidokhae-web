/**
 * 알림 서비스 타입 정의
 * M3 알림시스템 - 추상화 레이어
 */

// 알림톡 발송 파라미터
export interface AlimtalkParams {
  templateCode: string
  phone: string
  variables: Record<string, string>
  userId?: string
  meetingId?: string
}

// 알림 발송 결과
export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  errorCode?: string
}

// 알림 서비스 인터페이스 (추상화)
export interface NotificationService {
  sendAlimtalk(params: AlimtalkParams): Promise<NotificationResult>
  sendBulkAlimtalk(paramsList: AlimtalkParams[]): Promise<NotificationResult[]>
}

// 알림 템플릿
export interface NotificationTemplate {
  id: string
  code: string
  name: string
  messageTemplate: string
  sendTiming?: string
  isActive: boolean
}

// 알림 로그 생성 파라미터
export interface NotificationLogParams {
  userId?: string
  templateCode: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'pending'
  messageId?: string
  errorMessage?: string
  meetingId?: string
}

// 알림 템플릿 코드 상수
export const NOTIFICATION_TEMPLATES = {
  // 모임 리마인드
  REMINDER_3D: 'reminder_3d',           // 3일 전
  REMINDER_1D: 'reminder_1d',           // 1일 전
  REMINDER_TODAY: 'reminder_today',     // 당일

  // 대기자 알림
  WAITLIST_SPOT: 'waitlist_spot',       // 자리 발생
  WAITLIST_EXPIRED: 'waitlist_expired', // 응답 기한 만료

  // 월말/세그먼트 알림
  MONTHLY_ENCOURAGE: 'monthly_encourage',           // 월말 참여 독려
  ONBOARDING_RISK: 'onboarding_risk',               // 온보딩 이탈 위험
  DORMANT_RISK: 'dormant_risk',                     // 휴면 위험
  ELIGIBILITY_WARNING: 'eligibility_warning',       // 자격 만료 임박

  // 결제/신청 관련
  REGISTRATION_CONFIRMED: 'registration_confirmed', // 신청 확정
  CANCELLATION_COMPLETE: 'cancellation_complete',   // 취소 완료

  // 운영자 수동 발송
  ADMIN_NOTICE: 'admin_notice',         // 공지사항

  // M4 소속감 - 참여 완료
  POST_MEETING: 'post_meeting',         // 모임 종료 후 "어떠셨어요?" 알림
} as const

export type TemplateCode = typeof NOTIFICATION_TEMPLATES[keyof typeof NOTIFICATION_TEMPLATES]

// 리마인드 타입
export type ReminderType = 'reminder_3d' | 'reminder_1d' | 'reminder_today'

// 리마인드 대상 정보
export interface ReminderTarget {
  userId: string
  userName: string
  phone: string
  meetingId: string
  meetingTitle: string
  meetingDatetime: Date
  meetingLocation: string
  meetingFee: number
}

// 대기자 알림 대상 정보
export interface WaitlistTarget {
  waitlistId: string
  userId: string
  userName: string
  phone: string
  meetingId: string
  meetingTitle: string
  meetingDatetime: Date
  position: number
  responseDeadline: Date
}

// 세그먼트 알림 대상 정보
export interface SegmentTarget {
  userId: string
  userName: string
  phone: string
  segmentType: 'onboarding_risk' | 'dormant_risk' | 'eligibility_warning'
  lastParticipationAt?: Date
  firstParticipationAt?: Date
}

// 월말 독려 대상 정보
export interface MonthlyTarget {
  userId: string
  userName: string
  phone: string
}

// 운영자 수동 발송 요청
export interface AdminNotificationRequest {
  targetType: 'all' | 'active' | 'meeting_participants'
  meetingId?: string
  message: string
  templateCode?: string
}

// M4 참여 완료 알림 대상 정보
export interface PostMeetingTarget {
  registrationId: string
  userId: string
  userName: string
  phone: string
  meetingId: string
  meetingTitle: string
  meetingDatetime: Date
}

// 참여 완료 방법
export type ParticipationMethod = 'praise' | 'review' | 'confirm' | 'auto' | 'admin'

// 참여 상태
export type ParticipationStatus = 'completed' | 'no_show'
