'use client'

import { Zap, Coffee } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'

interface ThemeToggleProps {
  className?: string
  variant?: 'default' | 'compact'
}

/**
 * 테마 토글 버튼
 * Electric (기본) / Warm 테마 전환
 */
export function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-[var(--bg-base)] ${className}`}
        aria-label={theme === 'electric' ? 'Warm 모드로 전환' : 'Electric 모드로 전환'}
      >
        {theme === 'electric' ? (
          <Coffee size={18} strokeWidth={1.5} className="text-[var(--text-muted)]" />
        ) : (
          <Zap size={18} strokeWidth={1.5} className="text-[var(--text-muted)]" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={`w-full flex items-center justify-center gap-2 p-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-sm font-semibold transition-all hover:shadow-sm ${className}`}
      aria-label={theme === 'electric' ? 'Warm 모드로 전환' : 'Electric 모드로 전환'}
    >
      {theme === 'electric' ? (
        <>
          <Coffee size={16} strokeWidth={1.5} />
          <span>Warm Mode</span>
        </>
      ) : (
        <>
          <Zap size={16} strokeWidth={1.5} />
          <span>Electric Mode</span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle
