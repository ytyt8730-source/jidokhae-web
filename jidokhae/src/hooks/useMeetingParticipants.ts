'use client'

/**
 * 모임 참가 인원 실시간 감시 훅
 * Beta 출시 조건: Realtime 참가 인원 표시
 *
 * Supabase Realtime으로 모임 참가 인원 변화 감지
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface MeetingRow {
  id: string
  current_participants: number
  [key: string]: unknown
}

interface UseMeetingParticipantsOptions {
  /** 모임 ID */
  meetingId: string
  /** 초기 참가자 수 (SSR에서 전달) */
  initialCount?: number
  /** 변경 콜백 */
  onChange?: (newCount: number, oldCount: number) => void
}

interface UseMeetingParticipantsReturn {
  /** 현재 참가자 수 */
  participantCount: number
  /** 로딩 중 여부 */
  isLoading: boolean
  /** 에러 */
  error: Error | null
  /** 수동 새로고침 */
  refresh: () => Promise<void>
}

export function useMeetingParticipants({
  meetingId,
  initialCount = 0,
  onChange,
}: UseMeetingParticipantsOptions): UseMeetingParticipantsReturn {
  const [participantCount, setParticipantCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(!initialCount)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // 참가자 수 조회
  const fetchCount = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select('current_participants')
        .eq('id', meetingId)
        .single()

      if (fetchError) throw fetchError

      setParticipantCount(data?.current_participants ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch participant count'))
    } finally {
      setIsLoading(false)
    }
  }, [meetingId, supabase])

  // 초기 로드 (initialCount가 없을 때만)
  useEffect(() => {
    if (!initialCount) {
      fetchCount()
    }
  }, [fetchCount, initialCount])

  // useRef로 최신 값 참조 (의존성 배열에서 제외하여 메모리 누수 방지)
  const countRef = useRef(participantCount)
  const onChangeRef = useRef(onChange)

  // 최신 값 동기화
  useEffect(() => {
    countRef.current = participantCount
  }, [participantCount])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Realtime 구독 - meetingId만 의존성으로 설정하여 채널 재생성 방지
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupSubscription = () => {
      channel = supabase
        .channel(`meeting-participants-${meetingId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'meetings',
            filter: `id=eq.${meetingId}`,
          },
          (payload: RealtimePostgresChangesPayload<MeetingRow>) => {
            const newCount = (payload.new as MeetingRow).current_participants
            const oldCount = countRef.current

            if (oldCount !== newCount) {
              setParticipantCount(newCount)
              onChangeRef.current?.(newCount, oldCount)
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
  }, [meetingId, supabase])

  const refresh = useCallback(async () => {
    await fetchCount()
  }, [fetchCount])

  return {
    participantCount,
    isLoading,
    error,
    refresh,
  }
}

export default useMeetingParticipants
