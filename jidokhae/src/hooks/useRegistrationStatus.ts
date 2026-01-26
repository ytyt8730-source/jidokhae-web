'use client'

/**
 * 등록 상태 실시간 감시 훅
 * M9 Phase 9.3: Commitment Ritual
 *
 * Supabase Realtime으로 등록 상태 변화 감지
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TicketStatus } from '@/types/ticket'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Registration 테이블 타입
interface RegistrationRow {
  id: string
  status: string
  [key: string]: unknown
}

interface UseRegistrationStatusOptions {
  /** 등록 ID */
  registrationId: string
  /** 상태 변경 콜백 */
  onStatusChange?: (newStatus: TicketStatus, oldStatus: TicketStatus) => void
  /** 확정 시 콜백 */
  onConfirmed?: () => void
}

interface UseRegistrationStatusReturn {
  /** 현재 상태 */
  status: TicketStatus | null
  /** 로딩 중 여부 */
  isLoading: boolean
  /** 에러 */
  error: Error | null
  /** 수동 새로고침 */
  refresh: () => Promise<void>
}

export function useRegistrationStatus({
  registrationId,
  onStatusChange,
  onConfirmed,
}: UseRegistrationStatusOptions): UseRegistrationStatusReturn {
  const [status, setStatus] = useState<TicketStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // 초기 상태 조회
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select('status')
        .eq('id', registrationId)
        .single()

      if (fetchError) throw fetchError

      setStatus(data?.status as TicketStatus)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch status'))
    } finally {
      setIsLoading(false)
    }
  }, [registrationId, supabase])

  // 초기 로드
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Realtime 구독
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      channel = supabase
        .channel(`registration-${registrationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'registrations',
            filter: `id=eq.${registrationId}`,
          },
          (payload: RealtimePostgresChangesPayload<RegistrationRow>) => {
            const newStatus = (payload.new as RegistrationRow).status as TicketStatus
            const oldStatus = status

            if (oldStatus !== newStatus) {
              setStatus(newStatus)
              onStatusChange?.(newStatus, oldStatus as TicketStatus)

              // pending에서 confirmed로 변경 시
              if (
                (oldStatus === 'pending_payment' || oldStatus === 'pending_transfer') &&
                newStatus === 'confirmed'
              ) {
                onConfirmed?.()
              }
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [registrationId, status, supabase, onStatusChange, onConfirmed])

  const refresh = useCallback(async () => {
    await fetchStatus()
  }, [fetchStatus])

  return {
    status,
    isLoading,
    error,
    refresh,
  }
}

export default useRegistrationStatus
