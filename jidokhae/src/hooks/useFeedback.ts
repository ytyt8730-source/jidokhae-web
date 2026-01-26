'use client'

/**
 * useFeedback 훅
 * M8 Phase 8.3-8.4: Sound + Haptic 시스템
 *
 * 사운드와 햅틱 피드백을 통합 관리하는 훅
 */

import { useEffect, useCallback } from 'react'
import { soundManager, type SoundId } from '@/lib/sound'

// 햅틱 패턴 타입
export type HapticPattern = 'light' | 'heavy' | 'success' | 'tick' | 'error'

// 햅틱 패턴 정의
export const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],           // 일반 버튼 탭
  heavy: [50],           // 결제/발권
  success: [30, 50, 100], // 확정 도장
  tick: [5],             // 타자 효과 (반복)
  error: [100, 50, 100], // 에러
}

// 피드백 타입 (Sound + Haptic 조합)
export type FeedbackType = 'payment' | 'ticket' | 'confirm' | 'send' | 'tear' | 'type' | 'error'

// 피드백 타입별 Sound/Haptic 매핑
const FEEDBACK_MAPPING: Record<FeedbackType, { sound: SoundId; haptic: HapticPattern }> = {
  payment: { sound: 'beans', haptic: 'heavy' },
  ticket: { sound: 'printer', haptic: 'tick' },
  confirm: { sound: 'stamp', haptic: 'success' },
  send: { sound: 'whoosh', haptic: 'light' },
  tear: { sound: 'tear', haptic: 'light' },
  type: { sound: 'typewriter', haptic: 'tick' },
  error: { sound: 'stamp', haptic: 'error' }, // 에러는 stamp 소리 사용 (별도 에러음 없음)
}

/**
 * 사운드 + 햅틱 피드백 훅
 */
export function useFeedback() {
  // 컴포넌트 마운트 시 사운드 매니저 초기화
  useEffect(() => {
    soundManager.initialize()
  }, [])

  /**
   * 사운드 재생
   */
  const playSound = useCallback((soundId: SoundId): void => {
    soundManager.play(soundId)
  }, [])

  /**
   * 햅틱 진동 트리거
   */
  const triggerHaptic = useCallback((pattern: HapticPattern): void => {
    if (typeof navigator === 'undefined') return
    if (!('vibrate' in navigator)) return

    const vibrationPattern = HAPTIC_PATTERNS[pattern]
    try {
      navigator.vibrate(vibrationPattern)
    } catch {
      // 햅틱 지원하지 않는 환경에서는 무시
    }
  }, [])

  /**
   * 통합 피드백 (Sound + Haptic)
   */
  const feedback = useCallback((type: FeedbackType): void => {
    const mapping = FEEDBACK_MAPPING[type]
    if (!mapping) return

    playSound(mapping.sound)
    triggerHaptic(mapping.haptic)
  }, [playSound, triggerHaptic])

  /**
   * 사운드 on/off 설정
   */
  const setSoundEnabled = useCallback((enabled: boolean): void => {
    soundManager.setEnabled(enabled)
  }, [])

  /**
   * 사운드 설정 상태 조회
   */
  const isSoundEnabled = useCallback((): boolean => {
    return soundManager.isEnabled()
  }, [])

  return {
    playSound,
    triggerHaptic,
    feedback,
    setSoundEnabled,
    isSoundEnabled,
    // 패턴 상수 내보내기
    HAPTIC_PATTERNS,
  }
}

export default useFeedback
