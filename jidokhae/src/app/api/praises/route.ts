/**
 * 칭찬하기 API
 * M4 소속감 - Phase 2
 *
 * POST /api/praises
 * - 익명 칭찬 저장
 * - 수신자 칭찬 수 증가
 * - 참여 완료 처리
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  successResponse,
  withErrorHandler,
  requireAuth,
} from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { registrationLogger } from '@/lib/logger'
import { isValidPhraseId } from '@/lib/praise'
import { checkAndAwardBadges } from '@/lib/badges'

const logger = registrationLogger

interface PraiseRequestBody {
  meetingId: string
  receiverId: string
  phraseId: string
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 요청 바디 파싱
    const body = await request.json() as PraiseRequestBody
    const { meetingId, receiverId, phraseId } = body

    // 유효한 칭찬 문구인지 확인
    if (!isValidPhraseId(phraseId)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '유효하지 않은 칭찬 문구입니다.',
      })
    }

    // 자기 자신 칭찬 불가
    if (authUser.id === receiverId) {
      throw new AppError(ErrorCode.PRAISE_SELF_NOT_ALLOWED)
    }

    // 서비스 클라이언트로 전환
    const serviceClient = await createServiceClient()

    // 1. 모임에 참가했는지 확인
    const { data: registration, error: regError } = await serviceClient
      .from('registrations')
      .select('id, participation_status')
      .eq('user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .eq('status', 'confirmed')
      .single()

    if (regError || !registration) {
      logger.warn('praise_no_registration', {
        userId: authUser.id,
        meetingId,
      })
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 2. 수신자도 같은 모임에 참가했는지 확인
    const { data: receiverReg, error: receiverError } = await serviceClient
      .from('registrations')
      .select('id')
      .eq('user_id', receiverId)
      .eq('meeting_id', meetingId)
      .eq('status', 'confirmed')
      .single()

    if (receiverError || !receiverReg) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '해당 참가자를 찾을 수 없습니다.',
      })
    }

    // 3. 이 모임에서 이미 칭찬했는지 확인
    const { data: existingPraise } = await serviceClient
      .from('praises')
      .select('id')
      .eq('from_user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .single()

    if (existingPraise) {
      throw new AppError(ErrorCode.PRAISE_DUPLICATE_MEETING)
    }

    // 4. 3개월 내 같은 사람에게 칭찬했는지 확인
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: recentPraise } = await serviceClient
      .from('praises')
      .select('id')
      .eq('from_user_id', authUser.id)
      .eq('to_user_id', receiverId)
      .gte('created_at', threeMonthsAgo.toISOString())
      .limit(1)

    if (recentPraise && recentPraise.length > 0) {
      throw new AppError(ErrorCode.PRAISE_DUPLICATE_PERSON)
    }

    // 5. 칭찬 저장
    const { error: insertError } = await serviceClient
      .from('praises')
      .insert({
        from_user_id: authUser.id,
        to_user_id: receiverId,
        meeting_id: meetingId,
        message_type: phraseId,
      })

    if (insertError) {
      logger.error('praise_insert_failed', {
        error: insertError.message,
        senderId: authUser.id,
        receiverId,
        meetingId,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 6. 수신자 칭찬 수 증가
    await serviceClient
      .from('users')
      .update({
        total_praises_received: serviceClient.rpc('increment_praise_count', {
          user_id: receiverId,
        }),
      })
      .eq('id', receiverId)

    // 직접 증가 처리 (RPC가 없는 경우 대비)
    const { data: receiver } = await serviceClient
      .from('users')
      .select('total_praises_received')
      .eq('id', receiverId)
      .single()

    if (receiver) {
      await serviceClient
        .from('users')
        .update({
          total_praises_received: (receiver.total_praises_received || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receiverId)
    }

    // 7. 수신자 배지 체크
    const receiverBadges = await checkAndAwardBadges(receiverId)

    // 8. 참여 완료 처리 (아직 안 된 경우)
    let senderBadges: string[] = []
    if (!registration.participation_status) {
      await serviceClient
        .from('registrations')
        .update({
          participation_status: 'completed',
          participation_method: 'praise',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id)

      // 발신자 통계 업데이트
      const { data: sender } = await serviceClient
        .from('users')
        .select('total_participations')
        .eq('id', authUser.id)
        .single()

      if (sender) {
        await serviceClient
          .from('users')
          .update({
            total_participations: (sender.total_participations || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id)
      }

      // 발신자 배지 체크
      senderBadges = await checkAndAwardBadges(authUser.id)
    }

    logger.info('praise_sent', {
      senderId: authUser.id,
      receiverId,
      meetingId,
      phraseId,
      receiverBadges,
      senderBadges,
    })

    return successResponse({
      message: '따뜻한 마음이 전해졌어요!',
      phraseId,
      awardedBadges: senderBadges,
    })
  })
}
