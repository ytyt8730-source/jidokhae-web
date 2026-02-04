import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingContainer from '@/components/onboarding/OnboardingContainer'

// UI 온보딩 단계 (1~3)
type UIOnboardingStep = 1 | 2 | 3

export default async function OnboardingPage() {
  const supabase = await createClient()

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/onboarding')
  }

  // 사용자 온보딩 상태 조회
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_step, onboarding_completed_at, problem_selections')
    .eq('id', user.id)
    .single()

  // 이미 온보딩 완료된 경우 홈으로
  if (userData?.onboarding_completed_at) {
    redirect('/')
  }

  // 온보딩 단계 결정 (UI는 1~3 범위)
  const rawStep = userData?.onboarding_step ?? 1
  const clampedStep = Math.min(Math.max(rawStep, 1), 3)
  const initialStep = clampedStep as UIOnboardingStep

  return (
    <OnboardingContainer
      initialStep={initialStep}
      initialSelections={userData?.problem_selections ?? []}
      userId={user.id}
    />
  )
}
