/**
 * 티켓 시스템 타입 정의
 * M9 Phase 9.1: Commitment Ritual
 */

/**
 * 티켓 상태
 */
export type TicketStatus =
  | 'pending_payment'    // 결제 대기 중
  | 'pending_transfer'   // 입금 확인 대기 중
  | 'confirmed'          // 확정됨
  | 'used'               // 사용됨 (모임 완료)
  | 'cancelled'          // 취소됨

/**
 * 티켓 변형 (UI 표시용)
 */
export type TicketVariant =
  | 'full'    // 전체 티켓 (발권 시)
  | 'stub'    // 스텁 (보관함용)
  | 'mini'    // 미니 (목록용)

/**
 * 티켓 데이터
 */
export interface TicketData {
  /** 등록 ID (registration id) */
  id: string

  /** 모임 정보 */
  meetingId: string
  meetingTitle: string
  meetingDate: Date
  meetingLocation: string

  /** 좌석/참여 정보 */
  seatNumber: number
  participationCount: number

  /** 회원 정보 */
  userId: string
  userName: string

  /** 티켓 상태 */
  status: TicketStatus

  /** 발급 시간 */
  issuedAt: Date

  /** 결제 금액 (콩) */
  amount: number
}

/**
 * 티켓 컴포넌트 Props
 */
export interface TicketProps {
  data: TicketData
  variant?: TicketVariant
  showPerforation?: boolean
  animated?: boolean
  onTear?: () => void
  onSave?: () => void
  className?: string
}

/**
 * 티켓 스텁 Props
 */
export interface TicketStubProps {
  data: TicketData
  onClick?: () => void
  className?: string
}

/**
 * 티켓 발권 애니메이션 상태
 */
export type TicketAnimationPhase =
  | 'idle'       // 대기
  | 'slit'       // 슬릿 등장
  | 'printing'   // 인쇄 중
  | 'typing'     // 텍스트 타자
  | 'stamp'      // 도장 찍기
  | 'complete'   // 완료

/**
 * DB에서 가져온 Registration을 TicketData로 변환하기 위한 raw 타입
 */
export interface RegistrationWithTicket {
  id: string
  meeting_id: string
  user_id: string
  status: string
  payment_amount: number | null
  seat_number: number | null
  participation_count: number | null
  created_at: string
  meetings: {
    id: string
    title: string
    datetime: string
    location: string
  }
  users: {
    id: string
    name: string
  }
}

/**
 * Registration raw 데이터를 TicketData로 변환
 */
export function toTicketData(raw: RegistrationWithTicket): TicketData {
  return {
    id: raw.id,
    meetingId: raw.meeting_id,
    meetingTitle: raw.meetings.title,
    meetingDate: new Date(raw.meetings.datetime),
    meetingLocation: raw.meetings.location,
    seatNumber: raw.seat_number ?? 1,
    participationCount: raw.participation_count ?? 1,
    userId: raw.user_id,
    userName: raw.users.name,
    status: raw.status as TicketStatus,
    issuedAt: new Date(raw.created_at),
    amount: raw.payment_amount ?? 0,
  }
}
