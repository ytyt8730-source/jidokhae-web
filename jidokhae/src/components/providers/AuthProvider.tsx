'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * AuthProvider - 인증 상태 변경 감지 및 페이지 새로고침
 *
 * Supabase Auth 상태 변경(로그인/로그아웃)을 감지하여
 * 서버 컴포넌트가 새로운 사용자 정보를 가져오도록 페이지를 새로고침합니다.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      // 로그인/로그아웃 시 서버 컴포넌트 캐시 무효화
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return <>{children}</>
}
