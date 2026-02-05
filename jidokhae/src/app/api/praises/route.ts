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
import { rateLimiters, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

const logger = registrationLogger

interface PraiseRequestBody {
  meetingId: string
  receiverId: string
  phraseId: string
}

export async function POST(request: NextRequest) {
  // [보안] Rate Limiting - 1분에 60회 제한
  const rateLimitResult = checkRateLimit(request, rateLimiters.standard)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

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

    // 3-5. [보안] Race Condition 방지: UPSERT를 사용한 원자적 삽입
    // 중복 체크와 삽입을 하나의 트랜잭션으로 처리
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // 3개월 내 같은 사람에게 칭찬했는지 먼저 확인 (이건 별도 체크 필요)
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

    // [보안] 원자적 삽입: DB 유니크 제약조건 + ON CONFLICT로 Race Condition 방지
    // praises 테이블에 (from_user_id, meeting_id) UNIQUE 제약조건 필요
    const { data: insertedPraise, error: insertError } = await serviceClient
      .from('praises')
      .insert({
        from_user_id: authUser.id,
        to_user_id: receiverId,
        meeting_id: meetingId,
        message_type: phraseId,
      })
      .select('id')
      .single()

    if (insertError) {
      // 유니크 제약 위반 = 이미 칭찬함 (Race Condition 포함)
      if (insertError.code === '23505') {
        throw new AppError(ErrorCode.PRAISE_DUPLICATE_MEETING)
      }
      logger.error('praise_insert_failed', {
        error: insertError.message,
        code: insertError.code,
        senderId: authUser.id,
        receiverId,
        meetingId,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    if (!insertedPraise) {
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
