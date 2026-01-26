'use client'

/**
 * 사운드 설정 토글 컴포넌트
 * M8 Phase 8.3: Sound System
 *
 * 헤더 또는 설정 페이지에서 사용
 */

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { soundManager } from '@/lib/sound'

interface SoundToggleProps {
  className?: string
  showLabel?: boolean
}

export default function SoundToggle({ className = '', showLabel = false }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 클라이언트 사이드에서만 상태 로드
  useEffect(() => {
    setEnabled(soundManager.isEnabled())
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newValue = !enabled
    setEnabled(newValue)
    soundManager.setEnabled(newValue)
  }

  // 서버 사이드 렌더링 시 기본 상태 표시
  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg text-gray-400 ${className}`}
        aria-label="사운드 설정"
        disabled
      >
        <Volume2 size={20} strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        enabled
          ? 'text-brand-600 hover:bg-brand-50'
          : 'text-gray-400 hover:bg-gray-100'
      } ${className}`}
      aria-label={enabled ? '사운드 끄기' : '사운드 켜기'}
      title={enabled ? '사운드 끄기' : '사운드 켜기'}
    >
      {enabled ? (
        <Volume2 size={20} strokeWidth={1.5} />
      ) : (
        <VolumeX size={20} strokeWidth={1.5} />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {enabled ? '사운드 켜짐' : '사운드 꺼짐'}
        </span>
      )}
    </button>
  )
}
