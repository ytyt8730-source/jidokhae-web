'use client'

import { motion } from 'framer-motion'

export type FilterType = 'all' | 'regular' | 'discussion' | 'other'

interface MeetingFilterProps {
  active: FilterType
  onFilterChange: (filter: FilterType) => void
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'regular', label: '정기모임' },
  { key: 'discussion', label: '토론모임' },
  { key: 'other', label: '특별모임' },
]

/**
 * MeetingFilter - 모임 유형별 필터 UI
 *
 * Design Decision (Marcus Wei):
 * - layoutId로 부드러운 pill 애니메이션
 * - Spring 기반 전환으로 자연스러운 느낌
 *
 * UX Note (Sarah Chen):
 * - 명확한 시각적 피드백으로 현재 상태 인지
 * - 터치 친화적 크기 (44px 터치 영역)
 */
export default function MeetingFilter({
  active,
  onFilterChange,
}: MeetingFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === key
              ? 'text-white'
              : 'text-text-muted hover:text-text bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          {active === key && (
            <motion.div
              layoutId="filter-pill"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  )
}
