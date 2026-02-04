/**
 * 온보딩 상태 API
 * M6-Onboarding Phase 1
 *
 * GET /api/users/onboarding - 온보딩 상태 조회
 * PATCH /api/users/onboarding - 온보딩 단계 업데이트
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAuth } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { onboardingLogger } from '@/lib/logger'
import {
  toOnboardingState,
  isValidOnboardingStep,
  type OnboardingState,
  type OnboardingStep,
} from '@/types/onboarding'

const logger = onboardingLogger

/**
 * GET /api/users/onboarding
 * 현재 사용자의 온보딩 상태 조회
 */
export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    const { data: user, error } = await supabase
      .from('users')
      .select(
        'onboarding_step, onboarding_completed_at, problem_selections, first_aha_at, second_aha_at'
      )
      .eq('id', authUser.id)
      .single()

    if (error) {
      logger.error('onboarding_state_fetch_error', {
        userId: authUser.id,
        error: error.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    const state = toOnboardingState(user)

    logger.withUser(authUser.id).info('onboarding_state_retrieved', {
      step: state.step,
      completed: !!state.completedAt,
    })

    return successResponse<OnboardingState>(state)
  })
}

interface PatchRequestBody {
  step: number
  complete?: boolean
}

/**
 * PATCH /api/users/onboarding
 * 온보딩 단계 업데이트
 *
 * - step: 온보딩 단계 (1~5)
 * - complete: true면 온보딩 완료 처리 (onboarding_completed_at 설정)
 */
export async function PATCH(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = (await request.json()) as PatchRequestBody
    const { step, complete = false } = body

    // 단계 유효성 검사
    if (!isValidOnboardingStep(step)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '유효하지 않은 온보딩 단계입니다. (1~5)',
        field: 'step',
        value: step,
      })
    }

    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 현재 상태 확인
    const { data: currentUser } = await supabase
      .from('users')
      .select('onboarding_step, onboarding_completed_at')
      .eq('id', authUser.id)
      .single()

    // 이미 완료된 경우 경고 (하지만 업데이트는 허용)
    if (currentUser?.onboarding_completed_at) {
      logger.withUser(authUser.id).warn('onboarding_already_completed', {
        currentStep: currentUser.onboarding_step,
        requestedStep: step,
      })
    }

    // 업데이트 데이터 준비
    const updateData: Record<string, unknown> = {
      onboarding_step: step,
    }

    // complete 플래그 또는 Step 5이면 완료 처리
    const shouldComplete = complete || step === 5
    if (shouldComplete) {
      updateData.onboarding_completed_at = new Date().toISOString()
      updateData.is_new_member = false // 신규 회원 플래그 해제
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)

    if (error) {
      logger.error('onboarding_step_update_error', {
        userId: authUser.id,
        step,
        error: error.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.withUser(authUser.id).info('onboarding_step_updated', {
      from: currentUser?.onboarding_step ?? 1,
      to: step,
      completed: shouldComplete,
    })

    return successResponse({
      success: true,
      step: step as OnboardingStep,
      completed: shouldComplete,
    })
  })
}
