/**
 * 내 책장 API
 * M4 소속감 - Phase 5
 *
 * GET /api/bookshelf - 내 책장 목록 조회
 * POST /api/bookshelf - 책 등록
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

// GET: 내 책장 목록 조회
export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    const { data: books, error } = await supabase
      .from('bookshelf')
      .select('id, title, author, one_line_note, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('bookshelf_fetch_error', { error: error.message })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse({
      books: books || [],
      count: books?.length || 0,
    })
  })
}

interface BookRequestBody {
  title: string
  author?: string
  oneLine?: string
}

// POST: 책 등록
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    const body = await request.json() as BookRequestBody
    const { title, author, oneLine } = body

    // 제목 검증
    if (!title || title.trim().length < 1) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '책 제목을 입력해주세요.',
      })
    }

    if (title.length > 200) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '책 제목은 200자 이하로 입력해주세요.',
      })
    }

    const serviceClient = await createServiceClient()

    // 중복 체크
    const { data: existing } = await serviceClient
      .from('bookshelf')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('title', title.trim())
      .eq('author', author?.trim() || '')
      .single()

    if (existing) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, {
        message: '이미 등록된 책입니다.',
      })
    }

    // 책 등록
    const { data: book, error: insertError } = await serviceClient
      .from('bookshelf')
      .insert({
        user_id: authUser.id,
        title: title.trim(),
        author: author?.trim() || null,
        one_line_note: oneLine?.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('bookshelf_insert_error', {
        error: insertError.message,
        userId: authUser.id,
      })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('book_registered', {
      userId: authUser.id,
      title,
    })

    return successResponse({
      message: '책이 등록되었습니다.',
      book,
    })
  })
}
