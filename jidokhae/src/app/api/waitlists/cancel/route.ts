/**
 * 대기 취소 API
 * POST /api/waitlists/cancel
 *
 * M2-036: 대기 취소 성공
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'

interface CancelWaitlistRequest extends Record<string, unknown> {
  waitlistId: string
}

interface CancelWaitlistResponse {
  success: boolean
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CancelWaitlistRequest
    validateRequired(body, ['waitlistId'])

    const { waitlistId } = body

    const supabase = await createClient()

    // 인증 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 대기 정보 조회 및 소유권 확인
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlists')
      .select('id, user_id, meeting_id, position, status')
      .eq('id', waitlistId)
      .single()

    if (waitlistError || !waitlist) {
      return errorResponse(ErrorCode.WAITLIST_NOT_FOUND)
    }

    if (waitlist.user_id !== authUser.id) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    if (waitlist.status !== 'waiting') {
      return successResponse<CancelWaitlistResponse>({
        success: false,
        message: '취소할 수 없는 대기 상태입니다.',
      })
    }

    // 대기 삭제
    const { error: deleteError } = await supabase
      .from('waitlists')
      .delete()
      .eq('id', waitlistId)

    if (deleteError) {
      console.error('Waitlist delete error:', deleteError)
      return errorResponse(ErrorCode.INTERNAL_ERROR)
    }

    // 이후 대기자들의 순번 조정
    // 취소된 대기자보다 뒤에 있는 대기자들 조회
    const { data: laterWaitlists } = await supabase
      .from('waitlists')
      .select('id, position')
      .eq('meeting_id', waitlist.meeting_id)
      .eq('status', 'waiting')
      .gt('position', waitlist.position)
      .order('position', { ascending: true })

    if (laterWaitlists && laterWaitlists.length > 0) {
      // 각 대기자의 순번을 1씩 감소
      for (const w of laterWaitlists) {
        await supabase
          .from('waitlists')
          .update({ position: w.position - 1 })
          .eq('id', w.id)
      }
    }

    return successResponse<CancelWaitlistResponse>({
      success: true,
      message: '대기가 취소되었습니다.',
    })
  } catch (error) {
    console.error('Cancel waitlist error:', error)
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
