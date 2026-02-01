'use client'

/**
 * useTickets 훅
 * M9 Phase 9.4: 티켓 보관함
 *
 * 사용자의 티켓 목록을 조회하고 관리
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/logger'
import type { TicketData, RegistrationWithTicket } from '@/types/ticket'
import { toTicketData } from '@/types/ticket'

const logger = createLogger('useTickets')

interface UseTicketsResult {
  upcoming: TicketData[]
  past: TicketData[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 사용자의 티켓 목록 조회
 */
export function useTickets(userId: string): UseTicketsResult {
  const [upcoming, setUpcoming] = useState<TicketData[]>([])
  const [past, setPast] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const now = new Date().toISOString()

      // 등록 정보 조회 (모임, 사용자 정보 포함)
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select(`
          id,
          meeting_id,
          user_id,
          status,
          payment_amount,
          seat_number,
          participation_count,
          created_at,
          meetings (
            id,
            title,
            datetime,
            location
          ),
          users (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      if (!data) {
        setUpcoming([])
        setPast([])
        return
      }

      // RegistrationWithTicket으로 타입 캐스팅 후 TicketData로 변환
      const tickets = (data as unknown as RegistrationWithTicket[])
        .filter(reg => reg.meetings && reg.users) // meetings/users 데이터 있는 것만
        .map(toTicketData)

      // 예정/지난 모임으로 분리
      const upcomingTickets = tickets.filter(
        ticket => ticket.meetingDate >= new Date(now)
      )
      const pastTickets = tickets.filter(
        ticket => ticket.meetingDate < new Date(now)
      )

      setUpcoming(upcomingTickets)
      setPast(pastTickets)

      logger.info('Tickets fetched', {
        userId,
        upcomingCount: upcomingTickets.length,
        pastCount: pastTickets.length,
      })
    } catch (err) {
      logger.error('Failed to fetch tickets', { error: err, userId })
      setError('티켓을 불러오는 중 문제가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return {
    upcoming,
    past,
    loading,
    error,
    refetch: fetchTickets,
  }
}

export default useTickets
