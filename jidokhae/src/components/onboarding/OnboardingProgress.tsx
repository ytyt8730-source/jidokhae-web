'use client'

import { motion } from 'framer-motion'

interface OnboardingProgressProps {
  currentStep: 1 | 2 | 3
  totalSteps?: number
}

/**
 * 온보딩 프로그레스 바
 * 현재 단계와 진행률을 시각적으로 표시
 */
export default function OnboardingProgress({
  currentStep,
  totalSteps = 3,
}: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full">
      {/* 프로그레스 바 */}
      <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* 단계 인디케이터 */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-text-muted">
          {currentStep} / {totalSteps}
        </span>
        <span className="text-xs text-text-muted">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
