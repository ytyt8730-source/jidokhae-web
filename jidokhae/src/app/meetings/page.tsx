import { createClient } from '@/lib/supabase/server'
import { calculateMeetingStatus } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import MeetingsListWithFilter from '@/components/MeetingsListWithFilter'
import type { Meeting } from '@/types/database'

export const metadata = {
  title: '모임 일정 - 지독해',
  description: '지독해 독서모임 일정을 확인하세요.',
}

/**
 * MeetingsPage - 모임 목록 페이지
 *
 * Design Enhancement (Phase 2-1):
 * - 필터 UI로 유형별 탐색
 * - Spring Stagger 애니메이션으로 리스트 진입 효과
 */
export default async function MeetingsPage() {
  const supabase = await createClient()

  // 현재 이후 모임 조회
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .gte('datetime', new Date().toISOString())
    .eq('status', 'open')
    .order('datetime', { ascending: true }) as { data: Meeting[] | null }

  const meetingsWithStatus = (meetings || []).map(calculateMeetingStatus)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold heading-themed text-text mb-2">
          <CalendarDays className="text-primary" size={28} strokeWidth={1.5} />
          모임 일정
        </h1>
        <p className="text-text-muted">
          다가오는 모임을 확인하고 참여해보세요.
        </p>
      </div>

      {/* 모임 목록 (필터 + Stagger 애니메이션) */}
      <MeetingsListWithFilter meetings={meetingsWithStatus} />
    </div>
  )
}
