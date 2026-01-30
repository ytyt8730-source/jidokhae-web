'use client'

import BentoGrid from './BentoGrid'
import WeeklyCuratorCard from './WeeklyCuratorCard'
import GrowthCard from './GrowthCard'
import DdayCard from './DdayCard'
import type { Meeting, Registration, User } from '@/types/database'

interface BentoGridSectionProps {
  user: User | null
  thisWeekMeeting: Meeting | null
  nextRegistration: (Registration & { meetings: Meeting }) | null
}

/**
 * BentoGridSection - Design System v3.3 (목업 반영)
 * 홈페이지 대시보드 섹션
 * Weekly Curator (2열) + MY GROWTH (1열) + D-Day (1열)
 */
export default function BentoGridSection({
  user,
  thisWeekMeeting,
  nextRegistration,
}: BentoGridSectionProps) {
  // 로그인하지 않은 경우 Weekly Curator만 표시
  if (!user) {
    if (!thisWeekMeeting) return null

    return (
      <section className="border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BentoGrid>
            <WeeklyCuratorCard meeting={thisWeekMeeting} />
          </BentoGrid>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-[var(--border)]" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BentoGrid>
          {/* Weekly Curator - 2열 차지 */}
          <WeeklyCuratorCard meeting={thisWeekMeeting} />

          {/* MY GROWTH - 1열 차지 */}
          <GrowthCard totalParticipations={user.total_participations} />

          {/* D-Day - 1열 차지 */}
          <DdayCard registration={nextRegistration} />
        </BentoGrid>
      </div>
    </section>
  )
}
