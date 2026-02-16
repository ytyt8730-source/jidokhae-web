'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * AuthProvider - 인증 상태 변경 감지 및 페이지 새로고침
 *
 * Supabase Auth 상태 변경(로그인/로그아웃/토큰 갱신)을 감지하여
 * 서버 컴포넌트가 새로운 사용자 정보를 가져오도록 페이지를 새로고침합니다.
 *
 * OAuth 콜백 후 쿠키가 브라우저에 도착했지만 서버 렌더링이 이미 끝난 경우에도,
 * 초기 마운트 시 세션을 확인하여 서버 컴포넌트를 재렌더링합니다.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 초기 마운트: 클라이언트에 세션이 있으면 서버 컴포넌트 갱신
    // (OAuth 리다이렉트 후 서버/클라이언트 세션 불일치 대응)
    async function checkInitialSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.refresh()
    }
    checkInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return <>{children}</>
}
