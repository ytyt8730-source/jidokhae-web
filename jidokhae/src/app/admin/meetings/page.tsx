import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Edit } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import DeleteMeetingButton from './DeleteMeetingButton'
import type { Meeting } from '@/types/database'

export const metadata = {
  title: '모임 관리 - 지독해 관리자',
}

export default async function AdminMeetingsPage() {
  const supabase = await createClient()

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .order('datetime', { ascending: false }) as { data: Meeting[] | null }

  const getMeetingTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: 'brand' | 'info' | 'default' }> = {
      regular: { label: '정기모임', variant: 'brand' },
      discussion: { label: '토론모임', variant: 'info' },
      other: { label: '특별모임', variant: 'default' },
    }
    const t = types[type] || types.other
    return <Badge variant={t.variant}>{t.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
      open: { label: '모집중', variant: 'success' },
      closed: { label: '마감', variant: 'default' },
      cancelled: { label: '취소됨', variant: 'warning' },
    }
    const s = statuses[status] || statuses.open
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">모임 관리</h1>
        <Link href="/admin/meetings/new">
          <Button>
            <Plus size={18} className="mr-1" />
            모임 생성
          </Button>
        </Link>
      </div>

      {/* 모임 목록 */}
      <div className="card overflow-hidden">
        {meetings && meetings.length > 0 ? (
          <div className="divide-y divide-warm-100">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {getMeetingTypeBadge(meeting.meeting_type)}
                    {getStatusBadge(meeting.status)}
                  </div>
                  <h3 className="font-medium text-warm-900 truncate">{meeting.title}</h3>
                  <p className="text-sm text-warm-500 mt-1">
                    {formatMeetingDate(meeting.datetime)} · {meeting.location}
                  </p>
                  <p className="text-sm text-warm-500">
                    {formatFee(meeting.fee)} · {meeting.current_participants}/{meeting.capacity}명
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/meetings/${meeting.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Edit size={16} className="mr-1" />
                      수정
                    </Button>
                  </Link>
                  <DeleteMeetingButton meetingId={meeting.id} meetingTitle={meeting.title} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-warm-500 mb-4">등록된 모임이 없습니다.</p>
            <Link href="/admin/meetings/new">
              <Button>첫 모임 만들기</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

