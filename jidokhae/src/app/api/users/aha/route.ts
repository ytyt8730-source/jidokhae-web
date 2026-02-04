/**
 * Aha Moment 기록 API
 * M6-Onboarding Phase 1
 *
 * POST /api/users/aha - Aha Moment 기록
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAuth } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { onboardingLogger } from '@/lib/logger'
import { isValidAhaType, type AhaMomentType } from '@/types/onboarding'

const logger = onboardingLogger

interface PostRequestBody {
  type: string
}

/**
 * POST /api/users/aha
 * Aha Moment 달성 기록
 *
 * - first: 칭찬 보내기 (controllable, 1차 Aha)
 * - second: 칭찬 받기 (bonus, 2차 Aha)
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = (await request.json()) as PostRequestBody
    const { type } = body

    // 타입 유효성 검사
    if (!isValidAhaType(type)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: "유효하지 않은 Aha Moment 타입입니다. ('first' 또는 'second')",
        field: 'type',
        value: type,
      })
    }

    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 현재 Aha 상태 확인
    const { data: currentUser } = await supabase
      .from('users')
      .select('first_aha_at, second_aha_at')
      .eq('id', authUser.id)
      .single()

    const ahaType = type as AhaMomentType
    const fieldName = ahaType === 'first' ? 'first_aha_at' : 'second_aha_at'
    const currentValue =
      ahaType === 'first' ? currentUser?.first_aha_at : currentUser?.second_aha_at

    // 이미 달성된 경우
    if (currentValue) {
      logger.withUser(authUser.id).info('aha_moment_already_achieved', {
        type: ahaType,
        achievedAt: currentValue,
      })

      return successResponse({
        success: true,
        type: ahaType,
        timestamp: currentValue,
        alreadyAchieved: true,
      })
    }

    // Aha Moment 기록
    const timestamp = new Date().toISOString()
    const { error } = await supabase
      .from('users')
      .update({
        [fieldName]: timestamp,
      })
      .eq('id', authUser.id)

    if (error) {
      logger.error('aha_moment_record_error', {
        userId: authUser.id,
        type: ahaType,
        error: error.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.withUser(authUser.id).info('aha_moment_achieved', {
      type: ahaType,
      timestamp,
    })

    return successResponse({
      success: true,
      type: ahaType,
      timestamp,
      alreadyAchieved: false,
    })
  })
}
