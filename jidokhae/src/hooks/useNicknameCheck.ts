'use client'

/**
 * useNicknameCheck 훅
 * 닉네임 중복 체크 로직을 공통화 (debounce 500ms)
 *
 * 사용처: signup, complete-profile, NicknameEditor
 */

import { useState, useRef, useCallback } from 'react'

export type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken'

interface UseNicknameCheckOptions {
  /** 현재 닉네임 (자기 자신 제외용, 편집 모드에서 사용) */
  currentNickname?: string
  /** debounce 시간 (ms), 기본 500 */
  debounceMs?: number
}

interface UseNicknameCheckReturn {
  status: NicknameStatus
  setStatus: (status: NicknameStatus) => void
  /** 즉시 중복 체크 실행 */
  check: (value: string) => Promise<void>
  /** debounce 적용하여 중복 체크 예약 */
  scheduleCheck: (value: string) => void
  /** 타이머 정리 */
  cancelCheck: () => void
}

export function useNicknameCheck(options: UseNicknameCheckOptions = {}): UseNicknameCheckReturn {
  const { currentNickname, debounceMs = 500 } = options
  const [status, setStatus] = useState<NicknameStatus>('idle')
  const checkTimer = useRef<NodeJS.Timeout | null>(null)

  const cancelCheck = useCallback(() => {
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
  }, [])

  const check = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length < 2 || trimmed.length > 6) {
      setStatus('idle')
      return
    }
    if (currentNickname && trimmed === currentNickname) {
      setStatus('idle')
      return
    }

    setStatus('checking')
    try {
      const res = await fetch('/api/users/check-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      })
      const data = await res.json()
      setStatus(data.data?.available ? 'available' : 'taken')
    } catch {
      setStatus('idle')
    }
  }, [currentNickname])

  const scheduleCheck = useCallback((value: string) => {
    cancelCheck()
    setStatus('idle')
    const trimmed = value.trim()
    if (trimmed.length >= 2 && trimmed !== currentNickname) {
      checkTimer.current = setTimeout(() => check(value), debounceMs)
    }
  }, [check, cancelCheck, currentNickname, debounceMs])

  return { status, setStatus, check, scheduleCheck, cancelCheck }
}
