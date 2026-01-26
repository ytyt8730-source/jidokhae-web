'use client'

/**
 * Confetti 효과 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * 확정 시 화면 상단에서 떨어지는 축하 효과
 */

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useFeedback } from '@/hooks/useFeedback'

interface ConfettiProps {
  /** 발사 트리거 */
  trigger: boolean
  /** 완료 콜백 */
  onComplete?: () => void
}

// 지독해 브랜드 색상
const BRAND_COLORS = [
  '#355E3B', // forest green
  '#D4A574', // light gold
  '#8B6914', // gold
  '#c77654', // brand terracotta
  '#5C4033', // brown
]

/**
 * Confetti 발사 함수 (컴포넌트 외부에서도 사용 가능)
 */
export function triggerConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

/**
 * 사이드에서 발사하는 Confetti
 */
export function triggerSideConfetti() {
  const end = Date.now() + 500

  const colors = BRAND_COLORS

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Confetti 컴포넌트 (트리거 기반)
 */
export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const { feedback } = useFeedback()

  const fireConfetti = useCallback(() => {
    triggerConfetti()
    feedback('success')

    // 애니메이션 시간 후 완료 콜백
    setTimeout(() => {
      onComplete?.()
    }, 1500)
  }, [feedback, onComplete])

  useEffect(() => {
    if (trigger) {
      fireConfetti()
    }
  }, [trigger, fireConfetti])

  // 렌더링할 DOM 요소 없음 (canvas-confetti가 자체 캔버스 사용)
  return null
}

export default Confetti
