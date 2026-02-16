import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('auth-callback')

type PendingCookie = { name: string; value: string; options: Record<string, unknown> }

/** Vercel 프록시 환경에서 올바른 origin 결정 */
function getOrigin(request: Request): string {
  const { origin } = new URL(request.url)
  if (process.env.NODE_ENV === 'development') return origin

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    return `${proto}://${forwardedHost}`
  }
  return origin
}

/**
 * 세션 쿠키를 추적하는 Supabase 클라이언트 생성.
 * 기본 createClient()는 cookies().set()을 사용하지만,
 * NextResponse.redirect()에는 해당 쿠키가 포함되지 않음.
 * pendingCookies 배열에 쿠키를 수집하여 redirect 응답에 명시적으로 전달.
 */
async function createCallbackClient() {
  const cookieStore = await cookies()
  const pendingCookies: PendingCookie[] = []

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { supabase: null, pendingCookies }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options: options as Record<string, unknown> })
        })
      },
    },
  })
  return { supabase, pendingCookies }
}

/** 세션 쿠키를 포함한 리다이렉트 응답 생성 */
function redirectWithCookies(url: string, pendingCookies: PendingCookie[]) {
  const response = NextResponse.redirect(url)
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}

/** 임시 닉네임 생성 (이름 앞 2글자, 중복 시 숫자 접미사) */
async function generateTempNickname(
  supabase: ReturnType<typeof createServerClient>,
  userName: string,
): Promise<string> {
  const base = userName.length >= 2 ? userName.substring(0, 2) : userName + '0'
  try {
    const { data: similar } = await supabase
      .from('users')
      .select('nickname')
      .like('nickname', `${base}%`)
    const used = new Set(similar?.map((n: { nickname: string }) => n.nickname) || [])
    if (!used.has(base)) return base
    for (let i = 1; i <= 999; i++) {
      const candidate = base + String(i)
      if (candidate.length > 6) break
      if (!used.has(candidate)) return candidate
    }
  } catch (e) {
    logger.warn('Nickname generation query failed', {
      error: e instanceof Error ? e.message : 'Unknown',
    })
  }
  return base
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getOrigin(request)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러 처리 (카카오 로그인 취소 등 - 세션 없으므로 쿠키 전달 불필요)
  if (error) {
    logger.error('Auth callback error', { error, errorDescription })
    if (error === 'access_denied') {
      return NextResponse.redirect(`${origin}/auth/login`)
    }
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const { supabase, pendingCookies } = await createCallbackClient()
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/login?error=server_configuration`)
    }

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      logger.error('Code exchange error', { error: exchangeError.message, code: exchangeError.status })
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // 이후 모든 redirect는 반드시 redirectWithCookies() 사용
    const type = searchParams.get('type')
    if (type === 'signup' || type === 'email') {
      return redirectWithCookies(`${origin}/auth/confirmed`, pendingCookies)
    }

    if (sessionData?.user?.app_metadata?.provider === 'kakao') {
      try {
        const redirectUrl = await handleKakaoUser(supabase, sessionData.user, origin, next)
        return redirectWithCookies(redirectUrl, pendingCookies)
      } catch (e) {
        logger.error('Kakao user processing error', {
          error: e instanceof Error ? e.message : 'Unknown',
          userId: sessionData.user.id,
        })
      }
    }

    return redirectWithCookies(`${origin}${next}`, pendingCookies)
  }

  logger.warn('Auth callback without code or error')
  return NextResponse.redirect(`${origin}/auth/login`)
}

/** 카카오 로그인 후 사용자 프로필 처리, 리다이렉트 URL 반환 */
async function handleKakaoUser(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; email?: string; user_metadata?: Record<string, string>; app_metadata?: Record<string, string> },
  origin: string,
  next: string,
): Promise<string> {
  const meta = user.user_metadata || {}

  let kakaoPhone: string | null = null
  if (meta.phone_number) {
    kakaoPhone = meta.phone_number.replace(/^\+82\s*/, '0').replace(/[^0-9]/g, '')
  }

  const userName = meta.name || meta.full_name || meta.preferred_username || '사용자'
  const tempNickname = await generateTempNickname(supabase, userName)

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, phone, nickname, is_new_member')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUser) {
    const updateData: Record<string, unknown> = {
      name: userName,
      profile_image_url: meta.avatar_url || meta.picture,
      updated_at: new Date().toISOString(),
    }
    if (!existingUser.phone && kakaoPhone) {
      updateData.phone = kakaoPhone
      updateData.phone_verified = true
    }
    await supabase.from('users').update(updateData).eq('id', user.id)

    const needsPhone = !existingUser.phone && !kakaoPhone
    const needsNickname = !existingUser.nickname
    if (needsPhone || needsNickname) {
      return `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
    }
    return `${origin}${next}`
  }

  // 신규 사용자
  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    email: user.email || meta.email,
    name: userName,
    nickname: tempNickname,
    phone: kakaoPhone,
    phone_verified: !!kakaoPhone,
    profile_image_url: meta.avatar_url || meta.picture,
    auth_provider: 'kakao',
    is_new_member: true,
  })
  if (insertError) {
    logger.error('User insert error', { error: insertError.message })
  }
  return `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
}
