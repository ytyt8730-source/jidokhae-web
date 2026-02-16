import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 환경 변수가 없으면 Supabase 없이 진행
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase 환경 변수 미설정 - 인증 기능 비활성화 상태로 진행
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 라우트 처리
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isProtectedPage =
    request.nextUrl.pathname.startsWith('/mypage') ||
    isAdminPage

  // 비로그인 사용자가 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 참고: 로그인 사용자의 /auth/* 접근을 홈으로 리다이렉트하지 않음.
  // OAuth 흐름에서 불완전한 세션 쿠키가 남으면 로그인 페이지 접근이
  // 차단되어 사용자가 로그인 자체를 못하는 치명적 루프가 발생하기 때문.
  // 로그인 상태에서의 auth 페이지 리다이렉트는 각 페이지에서 클라이언트 측으로 처리.

  // 관리자 페이지 접근 권한 체크
  if (user && isAdminPage) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

