export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 환불 규칙 타입
export interface RefundRule {
  days_before: number
  refund_percent: number
}

// 유저 역할
export type UserRole = 'member' | 'admin' | 'super_admin'

// 모임 유형
export type MeetingType = 'regular' | 'discussion' | 'other'

// 모임 상태
export type MeetingStatus = 'open' | 'closed' | 'cancelled'

// 신청 상태
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled'

// 결제 상태
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial_refunded'

// 참여 상태
export type ParticipationStatus = 'completed' | 'no_show' | null

// 참여 완료 방법
export type ParticipationMethod = 'praise' | 'review' | 'confirm' | 'auto' | 'admin' | null

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          role: UserRole
          auth_provider: string
          profile_image_url: string | null
          is_new_member: boolean
          first_regular_meeting_at: string | null
          last_regular_meeting_at: string | null
          total_participations: number
          consecutive_weeks: number
          total_praises_received: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          role?: UserRole
          auth_provider?: string
          profile_image_url?: string | null
          is_new_member?: boolean
          first_regular_meeting_at?: string | null
          last_regular_meeting_at?: string | null
          total_participations?: number
          consecutive_weeks?: number
          total_praises_received?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: UserRole
          auth_provider?: string
          profile_image_url?: string | null
          is_new_member?: boolean
          first_regular_meeting_at?: string | null
          last_regular_meeting_at?: string | null
          total_participations?: number
          consecutive_weeks?: number
          total_praises_received?: number
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          meeting_type: MeetingType
          datetime: string
          location: string
          capacity: number
          fee: number
          description: string | null
          refund_policy_id: string | null
          status: MeetingStatus
          current_participants: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          meeting_type: MeetingType
          datetime: string
          location: string
          capacity?: number
          fee: number
          description?: string | null
          refund_policy_id?: string | null
          status?: MeetingStatus
          current_participants?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          meeting_type?: MeetingType
          datetime?: string
          location?: string
          capacity?: number
          fee?: number
          description?: string | null
          refund_policy_id?: string | null
          status?: MeetingStatus
          current_participants?: number
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          meeting_id: string
          status: RegistrationStatus
          payment_status: PaymentStatus | null
          payment_amount: number | null
          refund_amount: number
          cancel_reason: string | null
          cancelled_at: string | null
          participation_status: ParticipationStatus
          participation_method: ParticipationMethod
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id: string
          status?: RegistrationStatus
          payment_status?: PaymentStatus | null
          payment_amount?: number | null
          refund_amount?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          participation_status?: ParticipationStatus
          participation_method?: ParticipationMethod
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string
          status?: RegistrationStatus
          payment_status?: PaymentStatus | null
          payment_amount?: number | null
          refund_amount?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          participation_status?: ParticipationStatus
          participation_method?: ParticipationMethod
          created_at?: string
          updated_at?: string
        }
      }
      refund_policies: {
        Row: {
          id: string
          name: string
          meeting_type: MeetingType
          rules: RefundRule[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          meeting_type: MeetingType
          rules: RefundRule[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          meeting_type?: MeetingType
          rules?: RefundRule[]
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 편의 타입
export type User = Database['public']['Tables']['users']['Row']
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type Registration = Database['public']['Tables']['registrations']['Row']
export type RefundPolicy = Database['public']['Tables']['refund_policies']['Row']

// 모임 상태 계산용 타입
export interface MeetingWithStatus extends Meeting {
  remainingSpots: number
  displayStatus: 'open' | 'closing_soon' | 'closed' | 'waitlist_available'
  isThisWeek: boolean
}

// 결제 관련 타입
export interface PaymentLog {
  id: string
  registration_id: string | null
  payment_id: string
  payment_method: string | null
  amount: number
  status: 'paid' | 'cancelled' | 'failed'
  raw_data: Record<string, unknown> | null
  idempotency_key: string | null
  created_at: string
}

// 대기 목록 타입
export interface Waitlist {
  id: string
  user_id: string
  meeting_id: string
  position: number
  status: 'waiting' | 'notified' | 'expired' | 'converted'
  notified_at: string | null
  expires_at: string | null
  created_at: string
}

// 결제 준비 응답 타입
export interface PreparePaymentResponse {
  success: boolean
  message: string
  registrationId?: string
  amount?: number
  meetingTitle?: string
}

// 자격 검증 결과 타입
export interface QualificationResult {
  eligible: boolean
  reason?: string
  redirectTo?: string
}

