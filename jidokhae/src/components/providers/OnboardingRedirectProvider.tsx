'use client'

import { useOnboardingRedirect } from '@/hooks/useOnboardingRedirect'

interface OnboardingRedirectProviderProps {
  children: React.ReactNode
}

/**
 * 온보딩 리다이렉트 Provider
 * 신규 회원이 온보딩을 완료하지 않은 경우 자동으로 /onboarding으로 리다이렉트
 */
export default function OnboardingRedirectProvider({ children }: OnboardingRedirectProviderProps) {
  // 훅 호출 - 조건에 맞으면 자동으로 리다이렉트됨
  useOnboardingRedirect()

  return <>{children}</>
}
