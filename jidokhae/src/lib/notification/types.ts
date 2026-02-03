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
  description?: string
  messageTemplate: string
  variables?: string[]
  sendTiming?: string
  sendDaysBefore?: number | null
  sendTime?: string | null
  kakaoTemplateId?: string | null
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

// 알림 템플릿 코드 상수 (솔라피 템플릿 ID)
export const NOTIFICATION_TEMPLATES = {
  // 모임 리마인드
  REMINDER_3D: 'reminder_3d',                               // 3일 전 (TODO: 솔라피 등록 필요)
  REMINDER_1D: 'KA01TP26013110144750559PJ8DRKmUe',          // 내일 #{모임명}
  REMINDER_TODAY: 'KA01TP260131101632094bQBmdj7DTgk',       // 오늘, 드디어 만나는 날!

  // 대기자 알림
  WAITLIST_SPOT: 'KA01TP260131101846595Ia3f022Toxv',        // 빈자리가 났습니다!
  WAITLIST_EXPIRED: 'waitlist_expired',                     // 응답 기한 만료 (TODO: 솔라피 등록 필요)

  // 월말/세그먼트 알림 (TODO: 솔라피 등록 필요)
  MONTHLY_ENCOURAGE: 'monthly_encourage',                   // 월말 참여 독려
  ONBOARDING_RISK: 'onboarding_risk',                       // 온보딩 이탈 위험
  DORMANT_RISK: 'dormant_risk',                             // 휴면 위험
  ELIGIBILITY_WARNING: 'eligibility_warning',               // 자격 만료 임박

  // 결제/신청 관련
  REGISTRATION_CONFIRMED: 'KA01TP260131104954973tJPe3gXEmE6', // 신청 접수 완료
  CANCELLATION_COMPLETE: 'KA01TP260131102910054EeKya0x7uJT',  // 취소/환불 접수

  // 계좌이체 관련
  TRANSFER_CONFIRMED: 'KA01TP260131102614264JqtfvpsSALc',   // 입금 확인 완료!
  TRANSFER_EXPIRED: 'KA01TP2601311027124798sVSTMzzQab',     // 신청 취소 알림 (입금 기한 만료)
  TRANSFER_DEADLINE_WARNING: 'transfer_deadline_warning',   // 입금 기한 임박 (TODO: 솔라피 등록 필요)

  // 신규 회원 환영
  NEW_MEMBER_WELCOME: 'KA01TP260131102303488fxzX3GpPBFN',   // #{이름}님, 환영합니다!

  // 운영자 수동 발송
  ADMIN_NOTICE: 'admin_notice',                             // 공지사항 (TODO: 솔라피 등록 필요)

  // M4 소속감 - 참여 완료
  POST_MEETING: 'KA01PF260120113206182sLWZ2NcEsUJ',         // 오늘 모임, 어떠셨나요?
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
