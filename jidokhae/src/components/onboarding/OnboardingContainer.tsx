'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import OnboardingProgress from './OnboardingProgress'
import ProblemRecognition from './ProblemRecognition'
import TrustBuilding from './TrustBuilding'
import ActionGuide from './ActionGuide'
import { onboardingLogger } from '@/lib/logger'

const logger = onboardingLogger

type OnboardingStep = 1 | 2 | 3

interface OnboardingContainerProps {
  initialStep?: OnboardingStep
  initialSelections?: string[]
  userId: string
}

/**
 * 온보딩 컨테이너
 * 3단계 온보딩 플로우 관리
 */
export default function OnboardingContainer({
  initialStep = 1,
  initialSelections = [],
  userId,
}: OnboardingContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep)
  const [selections, setSelections] = useState<string[]>(initialSelections)
  const [isLoading, setIsLoading] = useState(false)

  // URL 쿼리 파라미터에서 step 복원
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const step = parseInt(stepParam, 10)
      if (step >= 1 && step <= 3) {
        setCurrentStep(step as OnboardingStep)
      }
    }
  }, [searchParams])

  // step 변경 시 URL 업데이트
  const updateStep = (newStep: OnboardingStep) => {
    setCurrentStep(newStep)
    const url = new URL(window.location.href)
    url.searchParams.set('step', String(newStep))
    window.history.replaceState({}, '', url.toString())
  }

  // Step 1: 문제 선택 후 다음으로
  const handleProblemNext = async (newSelections: string[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/onboarding/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: newSelections }),
      })

      if (!response.ok) {
        throw new Error('Failed to save problem selections')
      }

      setSelections(newSelections)
      logger.withUser(userId).info('problem_selections_completed', {
        count: newSelections.length,
        selections: newSelections,
      })

      // Step 업데이트
      await updateOnboardingStep(2)
      updateStep(2)
    } catch (error) {
      logger.error('problem_selections_failed', { userId, error })
      // TODO: 토스트 에러 메시지 표시
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: 신뢰 확보 후 다음으로
  const handleTrustNext = async () => {
    setIsLoading(true)
    try {
      await updateOnboardingStep(3)
      logger.withUser(userId).info('trust_building_completed', {})
      updateStep(3)
    } catch (error) {
      logger.error('trust_building_failed', { userId, error })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: 온보딩 완료
  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 4, complete: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      logger.withUser(userId).info('onboarding_completed', {
        selections,
      })

      router.push('/')
    } catch (error) {
      logger.error('onboarding_complete_failed', { userId, error })
    } finally {
      setIsLoading(false)
    }
  }

  // 건너뛰기
  const handleSkip = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 4, complete: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to skip onboarding')
      }

      logger.withUser(userId).info('onboarding_skipped', {
        skippedAtStep: currentStep,
      })

      router.push('/')
    } catch (error) {
      logger.error('onboarding_skip_failed', { userId, error })
    } finally {
      setIsLoading(false)
    }
  }

  // 서버에 step 업데이트
  const updateOnboardingStep = async (step: number) => {
    const response = await fetch('/api/users/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })

    if (!response.ok) {
      throw new Error('Failed to update onboarding step')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* 헤더 영역 */}
      <div className="sticky top-0 z-10 bg-bg-base px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10" /> {/* 스페이서 */}
          <OnboardingProgress currentStep={currentStep} />
          <button
            onClick={handleSkip}
            className="text-text-muted hover:text-text transition-colors p-2"
            aria-label="건너뛰기"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 px-4 pb-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ProblemRecognition
                initialSelections={selections}
                onNext={handleProblemNext}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <TrustBuilding onNext={handleTrustNext} isLoading={isLoading} />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ActionGuide onComplete={handleComplete} isLoading={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
