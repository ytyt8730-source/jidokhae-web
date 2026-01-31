'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MeetingCard from '@/components/MeetingCard'
import MeetingFilter, { type FilterType } from '@/components/MeetingFilter'
import { springStaggerContainer, springStaggerItem } from '@/lib/animations'
import type { MeetingWithStatus } from '@/types/database'

interface MeetingsListWithFilterProps {
  meetings: MeetingWithStatus[]
}

/**
 * MeetingsListWithFilter - 필터와 Stagger 애니메이션이 적용된 모임 목록
 *
 * Design Decision (Marcus Wei):
 * - Spring 기반 Stagger 애니메이션으로 자연스러운 리스트 진입
 * - AnimatePresence로 필터 변경 시 부드러운 전환
 *
 * Tech Note (Yuki Tanaka):
 * - useMemo로 필터링 연산 최적화
 * - layoutId 없이 key로 재렌더링 관리하여 성능 유지
 */
export default function MeetingsListWithFilter({
  meetings,
}: MeetingsListWithFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredMeetings = useMemo(() => {
    if (activeFilter === 'all') return meetings
    return meetings.filter((m) => m.meeting_type === activeFilter)
  }, [meetings, activeFilter])

  return (
    <div>
      {/* 필터 UI */}
      <div className="mb-6">
        <MeetingFilter
          active={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* 모임 목록 */}
      <AnimatePresence mode="wait">
        {filteredMeetings.length > 0 ? (
          <motion.div
            key={activeFilter}
            variants={springStaggerContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredMeetings.map((meeting) => (
              <motion.div key={meeting.id} variants={springStaggerItem}>
                <MeetingCard meeting={meeting} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-12 text-center"
          >
            <p className="text-text-muted mb-2">
              {activeFilter === 'all'
                ? '등록된 모임이 없습니다.'
                : `등록된 ${
                    activeFilter === 'regular'
                      ? '정기모임'
                      : activeFilter === 'discussion'
                      ? '토론모임'
                      : '특별모임'
                  }이 없습니다.`}
            </p>
            <p className="text-sm text-text-muted/70">
              곧 새로운 모임이 등록될 예정이에요.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
