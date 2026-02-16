/**
 * Nickname availability check API
 * POST: Check if a nickname is available (not taken by another user)
 * Works both authenticated (mypage/complete-profile) and unauthenticated (signup)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]+$/

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, rateLimiters.search)
  if (!rateLimitResult.success) return rateLimitExceededResponse(rateLimitResult)

  return withErrorHandler(async () => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { nickname } = body

    if (!nickname || typeof nickname !== 'string') {
      return successResponse({ available: false, reason: 'invalid' })
    }

    const trimmed = nickname.trim()
    if (trimmed.length < 2 || trimmed.length > 6) {
      return successResponse({ available: false, reason: 'length' })
    }

    if (!NICKNAME_REGEX.test(trimmed)) {
      return successResponse({ available: false, reason: 'invalid_chars' })
    }

    // Authenticated: exclude current user (for editing own nickname)
    // Unauthenticated: check all users (for signup)
    let query = supabase
      .from('users')
      .select('id')
      .eq('nickname', trimmed)

    if (user?.id) {
      query = query.neq('id', user.id)
    }

    const { data: existing } = await query.maybeSingle()
    const available = !existing

    if (!available) {
      authLogger.info('nickname_check_taken', { nickname: trimmed })
    }

    return successResponse({ available })
  })
}
