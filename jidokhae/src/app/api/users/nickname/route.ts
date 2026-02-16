/**
 * Nickname update API
 * PATCH: Update the authenticated user's nickname
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler, requireAuth } from '@/lib/api'
import { AppError, ErrorCode } from '@/lib/errors'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]+$/

export async function PATCH(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, rateLimiters.standard)
  if (!rateLimitResult.success) return rateLimitExceededResponse(rateLimitResult)

  return withErrorHandler(async () => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    requireAuth(user?.id)
    const userId = user!.id

    const body = await request.json()
    const { nickname } = body

    if (!nickname || typeof nickname !== 'string') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '닉네임을 입력해주세요.',
      })
    }

    const trimmed = nickname.trim()
    if (trimmed.length < 2 || trimmed.length > 6) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '닉네임은 2~6자 사이로 입력해주세요.',
      })
    }

    if (!NICKNAME_REGEX.test(trimmed)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      })
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', trimmed)
      .neq('id', userId)
      .maybeSingle()

    if (existing) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '이미 사용 중인 닉네임입니다.',
      })
    }

    // Update nickname
    const { error: updateError } = await supabase
      .from('users')
      .update({
        nickname: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      // UNIQUE constraint violation (race condition between check and save)
      if (updateError.code === '23505') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, {
          message: '이미 사용 중인 닉네임입니다.',
        })
      }
      authLogger.error('nickname_update_failed', {
        userId,
        error: updateError.message,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    authLogger.info('nickname_updated', { userId, nickname: trimmed })

    return successResponse({ success: true })
  })
}
