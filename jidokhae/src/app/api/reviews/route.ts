/**
 * 후기 작성 API
 * M4 소속감 - Phase 2
 *
 * POST /api/reviews
 * - 모임 후기 저장
 * - 공개 동의 옵션
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

const logger = registrationLogger

interface ReviewRequestBody {
  meetingId: string
  content: string
  isPublic: boolean
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 요청 바디 파싱
    const body = await request.json() as ReviewRequestBody
    const { meetingId, content, isPublic } = body

    // 내용 검증
    if (!content || content.trim().length < 10) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '후기는 10자 이상 작성해주세요.',
      })
    }

    if (content.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '후기는 1000자 이하로 작성해주세요.',
      })
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
      throw new AppError(ErrorCode.REGISTRATION_NOT_FOUND)
    }

    // 2-3. [보안] Race Condition 방지: 원자적 삽입
    // 중복 체크와 삽입을 DB 레벨에서 처리 (UNIQUE 제약조건 활용)
    // reviews 테이블에 (user_id, meeting_id) UNIQUE 제약조건 필요
    const { data: insertedReview, error: insertError } = await serviceClient
      .from('reviews')
      .insert({
        user_id: authUser.id,
        meeting_id: meetingId,
        content: content.trim(),
        is_public: isPublic,
      })
      .select('id')
      .single()

    if (insertError) {
      // 유니크 제약 위반 = 이미 후기 작성함 (Race Condition 포함)
      if (insertError.code === '23505') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, {
          message: '이미 후기를 작성했습니다.',
        })
      }
      logger.error('review_insert_failed', {
        error: insertError.message,
        code: insertError.code,
        userId: authUser.id,
        meetingId,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    if (!insertedReview) {
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    // 4. 참여 완료 처리 (아직 안 된 경우)
    if (!registration.participation_status) {
      await serviceClient
        .from('registrations')
        .update({
          participation_status: 'completed',
          participation_method: 'review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id)

      // 사용자 통계 업데이트
      const { data: user } = await serviceClient
        .from('users')
        .select('total_participations')
        .eq('id', authUser.id)
        .single()

      if (user) {
        await serviceClient
          .from('users')
          .update({
            total_participations: (user.total_participations || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id)
      }
    }

    logger.info('review_created', {
      userId: authUser.id,
      meetingId,
      isPublic,
    })

    return successResponse({
      message: '후기가 등록되었습니다.',
    })
  })
}
