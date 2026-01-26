'use client'

/**
 * 타자 효과 훅
 * M9 Phase 9.2: Commitment Ritual
 *
 * 글자가 한 글자씩 나타나는 타자기 효과
 */

import { useState, useEffect, useCallback } from 'react'

interface UseTypewriterOptions {
  /** 글자당 타이핑 속도 (ms) */
  speed?: number
  /** 시작 지연 시간 (ms) */
  delay?: number
  /** 글자 출력 시 콜백 */
  onType?: (char: string, index: number) => void
  /** 완료 시 콜백 */
  onComplete?: () => void
}

interface UseTypewriterReturn {
  /** 현재까지 표시된 텍스트 */
  displayText: string
  /** 타이핑 완료 여부 */
  isComplete: boolean
  /** 현재 커서 위치 (인덱스) */
  cursor: number
  /** 타이핑 일시정지 */
  pause: () => void
  /** 타이핑 재개 */
  resume: () => void
  /** 처음부터 다시 시작 */
  restart: () => void
  /** 즉시 완료 */
  skip: () => void
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 50, delay = 0, onType, onComplete } = options

  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // 시작 지연 처리
  useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        setHasStarted(true)
      }, delay)
      return () => clearTimeout(delayTimer)
    } else {
      setHasStarted(true)
    }
  }, [delay])

  // 타이핑 효과
  useEffect(() => {
    if (!hasStarted || isPaused || isComplete) return
    if (cursor >= text.length) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    const timer = setInterval(() => {
      if (cursor < text.length) {
        const nextChar = text[cursor]
        setDisplayText((prev) => prev + nextChar)
        setCursor((prev) => prev + 1)
        onType?.(nextChar, cursor)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, cursor, isPaused, isComplete, hasStarted, onType, onComplete])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const restart = useCallback(() => {
    setDisplayText('')
    setCursor(0)
    setIsComplete(false)
    setIsPaused(false)
    setHasStarted(false)
    // delay 후 다시 시작
    if (delay > 0) {
      setTimeout(() => setHasStarted(true), delay)
    } else {
      setHasStarted(true)
    }
  }, [delay])

  const skip = useCallback(() => {
    setDisplayText(text)
    setCursor(text.length)
    setIsComplete(true)
    onComplete?.()
  }, [text, onComplete])

  return {
    displayText,
    isComplete,
    cursor,
    pause,
    resume,
    restart,
    skip,
  }
}

export default useTypewriter
