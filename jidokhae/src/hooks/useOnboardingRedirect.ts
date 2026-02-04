'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OnboardingStatus {
  isLoading: boolean
  needsOnboarding: boolean
  currentStep: number | null
}

// 온보딩 리다이렉트 제외 경로
const EXCLUDED_PATHS = [
  '/onboarding',
  '/auth',
  '/api',
  '/_next',
  '/favicon.ico',
]

/**
 * 신규 회원 온보딩 자동 리다이렉트 훅
 *
 * - is_new_member=true이고 onboarding_step < 4인 경우 /onboarding으로 리다이렉트
 * - 온보딩 완료된 사용자나 비로그인 사용자는 리다이렉트 없음
 */
export function useOnboardingRedirect(): OnboardingStatus {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<OnboardingStatus>({
    isLoading: true,
    needsOnboarding: false,
    currentStep: null,
  })

  useEffect(() => {
    // 제외 경로는 체크하지 않음
    if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
      setStatus({ isLoading: false, needsOnboarding: false, currentStep: null })
      return
    }

    const checkOnboardingStatus = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus({ isLoading: false, needsOnboarding: false, currentStep: null })
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('is_new_member, onboarding_step, onboarding_completed_at')
        .eq('id', user.id)
        .single()

      // 신규 회원이고 온보딩 미완료인 경우
      const needsOnboarding =
        userData?.is_new_member === true &&
        !userData?.onboarding_completed_at &&
        (userData?.onboarding_step ?? 1) < 4

      if (needsOnboarding) {
        const step = userData?.onboarding_step ?? 1
        setStatus({ isLoading: false, needsOnboarding: true, currentStep: step })
        router.push(`/onboarding?step=${step}`)
      } else {
        setStatus({
          isLoading: false,
          needsOnboarding: false,
          currentStep: userData?.onboarding_step ?? null,
        })
      }
    }

    checkOnboardingStatus()
  }, [pathname, router])

  return status
}
