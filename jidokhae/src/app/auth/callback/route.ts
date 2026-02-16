import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('auth-callback')

/**
 * 세션 쿠키를 리다이렉트 응답에 명시적으로 전달하는 Supabase 클라이언트 생성
 * 기본 createClient()는 cookies().set()을 사용하지만,
 * NextResponse.redirect()에서 쿠키가 누락될 수 있어 직접 추적
 */
async function createCallbackClient() {
  const cookieStore = await cookies()
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { supabase: null, pendingCookies }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options as Record<string, unknown> })
          })
        },
      },
    }
  )

  return { supabase, pendingCookies }
}

/** 쿠키를 리다이렉트 응답에 전달 */
function redirectWithCookies(url: string, pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
  const response = NextResponse.redirect(url)
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러 처리 (M2-004: 카카오 로그인 취소 포함)
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
      logger.error('Code exchange error', { error: exchangeError.message })
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // 리다이렉트 URL 결정
    let redirectUrl = `${origin}${next}`

    // 이메일 확인 성공 시 확인 페이지로 이동
    const type = searchParams.get('type')
    if (type === 'signup' || type === 'email') {
      return redirectWithCookies(`${origin}/auth/confirmed`, pendingCookies)
    }

    // OAuth 로그인 (카카오 등) 시 users 테이블에 프로필 저장/업데이트
    if (sessionData?.user) {
      const user = sessionData.user
      const provider = user.app_metadata?.provider

      if (provider === 'kakao') {
        const userMetadata = user.user_metadata || {}

        // 카카오에서 받아온 전화번호 (phone_number scope 필요)
        let kakaoPhone: string | null = null
        if (userMetadata.phone_number) {
          kakaoPhone = userMetadata.phone_number
            .replace(/^\+82\s*/, '0')
            .replace(/[^0-9]/g, '')
        }

        // 임시 닉네임 생성 (이름 앞 2글자, 중복 시 숫자 접미사)
        const userName = userMetadata.name || userMetadata.full_name || userMetadata.preferred_username || '사용자'
        const baseName = userName.length >= 2 ? userName.substring(0, 2) : userName + '0'
        const { data: similarNicknames } = await supabase
          .from('users')
          .select('nickname')
          .like('nickname', `${baseName}%`)
        const usedSet = new Set(similarNicknames?.map((n: { nickname: string }) => n.nickname) || [])
        let tempNickname = baseName
        if (usedSet.has(tempNickname)) {
          for (let i = 1; i <= 999; i++) {
            const candidate = baseName + String(i)
            if (candidate.length > 6) break
            if (!usedSet.has(candidate)) {
              tempNickname = candidate
              break
            }
          }
        }

        const profileData = {
          id: user.id,
          email: user.email || userMetadata.email,
          name: userName,
          nickname: tempNickname,
          phone: kakaoPhone,
          phone_verified: kakaoPhone ? true : false,
          profile_image_url: userMetadata.avatar_url || userMetadata.picture,
          auth_provider: 'kakao',
          is_new_member: true,
        }

        // 기존 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, phone, nickname, is_new_member')
          .eq('id', user.id)
          .maybeSingle()

        if (existingUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: Record<string, any> = {
            name: profileData.name,
            profile_image_url: profileData.profile_image_url,
            updated_at: new Date().toISOString(),
          }

          if (!existingUser.phone && kakaoPhone) {
            updateData.phone = kakaoPhone
            updateData.phone_verified = true
          }

          await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id)

          const needsPhone = !existingUser.phone && !kakaoPhone
          const needsNickname = !existingUser.nickname
          if (needsPhone || needsNickname) {
            redirectUrl = `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
          }
        } else {
          const { error: insertError } = await supabase
            .from('users')
            .insert(profileData)

          if (insertError) {
            logger.error('User insert error', { error: insertError.message })
          }

          redirectUrl = `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
        }
      }
    }

    // 세션 쿠키를 리다이렉트 응답에 명시적으로 전달
    return redirectWithCookies(redirectUrl, pendingCookies)
  }

  // code가 없는 경우 로그인 페이지로
  return NextResponse.redirect(`${origin}/auth/login`)
}
