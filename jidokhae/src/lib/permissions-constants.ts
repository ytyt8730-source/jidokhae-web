/**
 * 권한 상수 정의
 * M5 Phase 3 - 클라이언트/서버 공용
 */

// 권한 종류 (admin_permissions 테이블의 permission 컬럼과 일치)
export const PERMISSIONS = {
  MEETING_MANAGE: 'meeting_manage',       // 모임 생성/수정/삭제
  PAYMENT_MANAGE: 'payment_manage',       // 입금확인/환불처리
  NOTIFICATION_SEND: 'notification_send', // 알림톡 수동 발송
  BANNER_MANAGE: 'banner_manage',         // 배너 관리
  REQUEST_RESPOND: 'request_respond',     // 요청함 답변
  DASHBOARD_VIEW: 'dashboard_view',       // 대시보드 열람
  TEMPLATE_MANAGE: 'template_manage',     // 알림 템플릿 관리
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// 권한 한글명 매핑
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.MEETING_MANAGE]: '모임 관리',
  [PERMISSIONS.PAYMENT_MANAGE]: '결제 관리',
  [PERMISSIONS.NOTIFICATION_SEND]: '알림 발송',
  [PERMISSIONS.BANNER_MANAGE]: '배너 관리',
  [PERMISSIONS.REQUEST_RESPOND]: '요청함 답변',
  [PERMISSIONS.DASHBOARD_VIEW]: '대시보드 열람',
  [PERMISSIONS.TEMPLATE_MANAGE]: '템플릿 관리',
}

// 권한 배열 (체크박스 렌더링용)
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

// 사용자 역할
export type UserRole = 'member' | 'admin' | 'super_admin'
