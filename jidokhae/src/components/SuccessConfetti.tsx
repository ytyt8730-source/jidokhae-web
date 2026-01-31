'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

interface SuccessConfettiProps {
  duration?: number
  particleCount?: number
}

/**
 * SuccessConfetti - 결제/신청 완료 시 축하 Confetti 효과
 *
 * Design Decision (Marcus Wei):
 * - 브랜드 컬러(#c77654) 포함으로 브랜드 일관성 유지
 * - 양쪽에서 터지는 효과로 화면 전체를 채움
 * - 2초 지속으로 과하지 않으면서 충분한 축하 효과
 *
 * UX Note (Sarah Chen):
 * - 결제 완료 순간의 성취감을 시각적으로 강화
 * - 사용자의 긍정적 감정 피크에서 브랜드 각인
 */
export default function SuccessConfetti({
  duration = 2500,
  particleCount = 4
}: SuccessConfettiProps) {
  const fireConfetti = useCallback(() => {
    const end = Date.now() + duration

    // 브랜드 컬러 + 축하 컬러 조합
    const colors = [
      '#c77654', // brand-500 (terracotta)
      '#b55f3e', // brand-600
      '#F59E0B', // amber (축하)
      '#10B981', // emerald (성공)
      '#FBBF24', // yellow (축하)
    ]

    const frame = () => {
      // 왼쪽에서 발사
      confetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        ticks: 200,
        gravity: 0.8,
        scalar: 1.2,
        drift: 0.5,
      })

      // 오른쪽에서 발사
      confetti({
        particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        ticks: 200,
        gravity: 0.8,
        scalar: 1.2,
        drift: -0.5,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [duration, particleCount])

  useEffect(() => {
    // 페이지 로드 후 약간의 딜레이 후 실행 (콘텐츠 렌더링 대기)
    const timer = setTimeout(fireConfetti, 300)
    return () => clearTimeout(timer)
  }, [fireConfetti])

  return null
}
