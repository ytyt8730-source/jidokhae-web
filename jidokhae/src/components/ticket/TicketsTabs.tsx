'use client'

/**
 * TicketsTabs 컴포넌트
 * M9 Phase 9.4: 티켓 보관함
 *
 * 티켓 탭 (예정/지난) (페이지에서 분리)
 */

import { MICROCOPY } from '@/lib/constants/microcopy'

interface TicketsTabsProps {
  activeTab: 'upcoming' | 'past'
  onTabChange: (tab: 'upcoming' | 'past') => void
}

export default function TicketsTabs({ activeTab, onTabChange }: TicketsTabsProps) {
  return (
    <div className="flex gap-2 mb-6 border-b border-border">
      <button
        onClick={() => onTabChange('upcoming')}
        className={`
          px-4 py-2 text-sm font-medium transition-colors relative
          ${activeTab === 'upcoming'
            ? 'text-primary'
            : 'text-text-secondary hover:text-text-primary'
          }
        `}
      >
        {MICROCOPY.ticket.upcoming}
        {activeTab === 'upcoming' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        )}
      </button>
      <button
        onClick={() => onTabChange('past')}
        className={`
          px-4 py-2 text-sm font-medium transition-colors relative
          ${activeTab === 'past'
            ? 'text-primary'
            : 'text-text-secondary hover:text-text-primary'
          }
        `}
      >
        {MICROCOPY.ticket.past}
        {activeTab === 'past' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        )}
      </button>
    </div>
  )
}
