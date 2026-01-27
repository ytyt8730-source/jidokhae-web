'use client'

/**
 * TicketsPageHeader 컴포넌트
 * M9 Phase 9.4: 티켓 보관함
 *
 * 티켓 페이지 헤더 (페이지에서 분리)
 */

import { Ticket } from 'lucide-react'

export default function TicketsPageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Ticket size={24} strokeWidth={1.5} className="text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">나의 티켓</h1>
      </div>
      <p className="text-sm text-text-secondary">
        지독해에서 함께한 모든 순간을 확인하세요
      </p>
    </div>
  )
}
