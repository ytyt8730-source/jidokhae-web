'use client'

/**
 * 절취선 드래그 제스처 훅
 * M9 Phase 9.3: Commitment Ritual
 *
 * 드래그하여 티켓을 찢는 인터랙션
 */

import { useState, useCallback, useRef } from 'react'
import { useFeedback } from '@/hooks/useFeedback'

interface UseTearGestureOptions {
  /** 찢기 완료에 필요한 드래그 거리 (px) */
  threshold?: number
  /** 찢기 완료 콜백 */
  onTear?: () => void
  /** 드래그 중 콜백 */
  onDragProgress?: (progress: number) => void
}

interface UseTearGestureReturn {
  /** 드래그 진행률 (0~1) */
  dragProgress: number
  /** 찢어졌는지 여부 */
  isTorn: boolean
  /** 드래그 중인지 여부 */
  isDragging: boolean
  /** 드래그 시작 핸들러 */
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  /** 드래그 중 핸들러 */
  handleDrag: (e: MouseEvent | TouchEvent) => void
  /** 드래그 종료 핸들러 */
  handleDragEnd: () => void
  /** 리셋 함수 */
  reset: () => void
  /** ref로 사용할 때 */
  containerRef: React.RefObject<HTMLDivElement>
}

export function useTearGesture(
  options: UseTearGestureOptions = {}
): UseTearGestureReturn {
  const { threshold = 150, onTear, onDragProgress } = options

  const [dragProgress, setDragProgress] = useState(0)
  const [isTorn, setIsTorn] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const startXRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { feedback } = useFeedback()

  const getClientX = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number => {
    if ('touches' in e) {
      return e.touches[0]?.clientX ?? 0
    }
    return (e as MouseEvent | React.MouseEvent).clientX
  }

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isTorn) return
      e.preventDefault()
      setIsDragging(true)
      startXRef.current = getClientX(e)
    },
    [isTorn]
  )

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || isTorn) return

      const currentX = getClientX(e)
      const deltaX = currentX - startXRef.current
      const progress = Math.min(Math.max(Math.abs(deltaX) / threshold, 0), 1)

      setDragProgress(progress)
      onDragProgress?.(progress)

      // 진행률에 따라 햅틱 피드백
      if (progress > 0.5 && progress < 0.6) {
        feedback('tick')
      }
    },
    [isDragging, isTorn, threshold, onDragProgress, feedback]
  )

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)

    if (dragProgress >= 1 && !isTorn) {
      // 찢기 완료
      setIsTorn(true)
      feedback('tear')
      onTear?.()
    } else {
      // 원위치로 복귀
      setDragProgress(0)
    }
  }, [isDragging, dragProgress, isTorn, feedback, onTear])

  const reset = useCallback(() => {
    setDragProgress(0)
    setIsTorn(false)
    setIsDragging(false)
  }, [])

  return {
    dragProgress,
    isTorn,
    isDragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    reset,
    containerRef,
  }
}

export default useTearGesture
