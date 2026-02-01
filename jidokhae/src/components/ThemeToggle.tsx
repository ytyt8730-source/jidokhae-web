'use client'

import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

/**
 * ThemeToggle - Design System v3.3
 * Electric Mode (낮) / Warm Mode (밤) 토글 스위치
 * 마이페이지에서만 사용
 */
export default function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const isWarm = theme === 'warm'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-body-sm">
          {isWarm ? '밤의 서재' : '낮의 서재'}
        </span>
      )}

      <button
        onClick={toggleTheme}
        className="relative w-16 h-8 rounded-full p-1 transition-colors duration-300 bg-primary"
        aria-label={`${isWarm ? '낮' : '밤'} 모드로 전환`}
        role="switch"
        aria-checked={isWarm}
      >
        {/* Track Background */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: isWarm
              ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
              : 'linear-gradient(135deg, #0047FF 0%, #3B82F6 100%)',
          }}
        />

        {/* Icons in track */}
        <div className="absolute inset-1 flex items-center justify-between px-1.5">
          <Sun
            size={14}
            className={`transition-opacity duration-200 text-white ${isWarm ? 'opacity-30' : 'opacity-70'}`}
          />
          <Moon
            size={14}
            className={`transition-opacity duration-200 text-white ${isWarm ? 'opacity-70' : 'opacity-30'}`}
          />
        </div>

        {/* Toggle Knob */}
        <motion.div
          className="relative w-6 h-6 rounded-full shadow-md flex items-center justify-center"
          style={{
            backgroundColor: isWarm ? '#F5F5F0' : '#FFFFFF',
          }}
          animate={{
            x: isWarm ? 32 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {isWarm ? (
            <Moon size={14} className="text-[#0F172A]" />
          ) : (
            <Sun size={14} className="text-[#0047FF]" />
          )}
        </motion.div>
      </button>
    </div>
  )
}
