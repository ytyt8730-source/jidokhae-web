/**
 * 문제 인식 선택 저장 API
 * M6-Onboarding Phase 1
 *
 * POST /api/users/onboarding/problems - 문제 선택 저장
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAuth } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { onboardingLogger } from '@/lib/logger'
import { isValidProblemId, VALID_PROBLEM_IDS } from '@/types/onboarding'

const logger = onboardingLogger

interface PostRequestBody {
  selections: string[]
}

/**
 * POST /api/users/onboarding/problems
 * 문제 인식 단계에서 선택한 항목 저장
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = (await request.json()) as PostRequestBody
    const { selections } = body

    // 배열 유효성 검사
    if (!Array.isArray(selections)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '선택 항목은 배열이어야 합니다.',
        field: 'selections',
      })
    }

    // 빈 배열 검사
    if (selections.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '최소 1개 이상 선택해주세요.',
        field: 'selections',
      })
    }

    // 최대 4개 검사
    if (selections.length > 4) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '최대 4개까지 선택할 수 있습니다.',
        field: 'selections',
        value: selections.length,
      })
    }

    // 각 항목 유효성 검사
    const invalidIds = selections.filter((id) => !isValidProblemId(id))
    if (invalidIds.length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '유효하지 않은 선택 항목이 포함되어 있습니다.',
        field: 'selections',
        invalidIds,
        validIds: VALID_PROBLEM_IDS,
      })
    }

    // 중복 제거
    const uniqueSelections = Array.from(new Set(selections))

    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // 문제 선택 저장
    const { error } = await supabase
      .from('users')
      .update({
        problem_selections: uniqueSelections,
      })
      .eq('id', authUser.id)

    if (error) {
      logger.error('problem_selections_save_error', {
        userId: authUser.id,
        selections: uniqueSelections,
        error: error.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.withUser(authUser.id).info('problem_selections_saved', {
      count: uniqueSelections.length,
      selections: uniqueSelections,
    })

    return successResponse({
      success: true,
      selections: uniqueSelections,
    })
  })
}
