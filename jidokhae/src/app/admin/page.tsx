import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface UpcomingMeeting {
  id: string
  title: string
  datetime: string
  current_participants: number
  capacity: number
}

export const metadata = {
  title: '관리자 대시보드 - 지독해',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 이번 달 모임 수
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const endOfMonth = new Date()
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setDate(0)
  endOfMonth.setHours(23, 59, 59, 999)

  const { count: meetingsCount } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .gte('datetime', startOfMonth.toISOString())
    .lte('datetime', endOfMonth.toISOString())

  // 전체 회원 수
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // 다가오는 모임 (가장 가까운 3개)
  const { data: upcomingMeetings } = await supabase
    .from('meetings')
    .select('id, title, datetime, current_participants, capacity')
    .gte('datetime', new Date().toISOString())
    .eq('status', 'open')
    .order('datetime', { ascending: true })
    .limit(3) as { data: UpcomingMeeting[] | null }

  const stats = [
    {
      label: '이번 달 모임',
      value: meetingsCount || 0,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: '전체 회원',
      value: usersCount || 0,
      icon: Users,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      label: '이번 달 신청',
      value: '-',
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: '이번 달 수입',
      value: '-',
      icon: DollarSign,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-warm-900">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-4">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-warm-900">{stat.value}</p>
            <p className="text-sm text-warm-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 다가오는 모임 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-warm-900">다가오는 모임</h2>
          <Link href="/admin/meetings" className="text-sm text-brand-600 hover:underline">
            전체 보기
          </Link>
        </div>
        
        {upcomingMeetings && upcomingMeetings.length > 0 ? (
          <div className="divide-y divide-warm-100">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-warm-900">{meeting.title}</p>
                  <p className="text-sm text-warm-500">
                    {new Date(meeting.datetime).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-warm-700">
                    {meeting.current_participants}/{meeting.capacity}명
                  </p>
                  <p className="text-xs text-warm-400">참가 인원</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-warm-500 text-center py-4">
            예정된 모임이 없습니다.
          </p>
        )}
      </div>

      {/* 빠른 작업 */}
      <div className="card p-6">
        <h2 className="font-semibold text-warm-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/meetings/new"
            className="p-4 bg-brand-50 rounded-xl text-center hover:bg-brand-100 transition-colors"
          >
            <Calendar className="mx-auto text-brand-600 mb-2" size={24} />
            <span className="text-sm font-medium text-brand-800">모임 생성</span>
          </Link>
          <Link
            href="/admin/users"
            className="p-4 bg-warm-50 rounded-xl text-center hover:bg-warm-100 transition-colors"
          >
            <Users className="mx-auto text-warm-600 mb-2" size={24} />
            <span className="text-sm font-medium text-warm-700">회원 관리</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

