'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Flame } from 'lucide-react'
import { staggerItem } from '@/lib/animations'

interface GrowthCardProps {
  totalParticipations: number
  className?: string
}

/**
 * GrowthCard - Design System v3.3 (목업 반영)
 * MY GROWTH 카드 - 다크 그라데이션 + 트로피 + 배지 진행
 */
export default function GrowthCard({
  totalParticipations,
  className = '',
}: GrowthCardProps) {
  // 열정 배지까지 남은 횟수 계산 (5회 참여 시 획득)
  const badgeTarget = 5
  const remaining = Math.max(0, badgeTarget - (totalParticipations % badgeTarget))
  const progress = ((badgeTarget - remaining) / badgeTarget) * 100

  return (
    <motion.div
      className={`
        col-span-1
        bg-gradient-to-br from-slate-800 to-slate-900
        rounded-2xl p-5
        shadow-card
        hover:shadow-card-hover
        transition-all duration-300
        text-white
        relative
        overflow-hidden
        ${className}
      `}
      variants={staggerItem}
      whileHover={{ y: -2 }}
    >
      {/* Trophy Icon with Glow */}
      <Trophy
        size={32}
        className="absolute top-5 right-5 text-[var(--accent)]"
        style={{ filter: 'drop-shadow(0 0 12px var(--accent))' }}
        strokeWidth={1.5}
      />

      <Link href="/mypage" className="block h-full">
        {/* Section Label */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
          MY GROWTH
        </span>

        {/* Main Text */}
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <span className="text-slate-400">열정 배지</span>까지
          <br />
          {remaining}번 남았어요!
          <Flame
            size={16}
            className="inline ml-1 text-orange-500"
            fill="currentColor"
            strokeWidth={2}
          />
        </h3>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Progress</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Hint */}
        <p className="mt-3 text-[11px] text-slate-500">
          다음 달성 시: 멤버십 포인트 +500
        </p>
      </Link>
    </motion.div>
  )
}
