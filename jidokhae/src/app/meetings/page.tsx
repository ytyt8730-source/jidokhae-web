import MeetingCard from '@/components/MeetingCard'
import { createClient } from '@/lib/supabase/server'
import { calculateMeetingStatus } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import type { Meeting } from '@/types/database'

export const metadata = {
  title: '모임 일정 - 지독해',
  description: '지독해 독서모임 일정을 확인하세요.',
}

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
        <h1 className="flex items-center gap-3 text-2xl font-bold heading-themed text-brand-800 mb-2">
          <CalendarDays className="text-brand-500" size={28} strokeWidth={1.5} />
          모임 일정
        </h1>
        <p className="text-gray-600">
          다가오는 모임을 확인하고 참여해보세요.
        </p>
      </div>

      {/* 모임 목록 */}
      {meetingsWithStatus.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetingsWithStatus.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-2">등록된 모임이 없습니다.</p>
          <p className="text-sm text-gray-400">
            곧 새로운 모임이 등록될 예정이에요.
          </p>
        </div>
      )}
    </div>
  )
}

