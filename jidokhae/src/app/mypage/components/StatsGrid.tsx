import Link from 'next/link'
import { Calendar, Award, Heart, BookOpen } from 'lucide-react'
import type { User as UserType } from '@/types/database'

interface StatsGridProps {
  user: UserType
  bookCount: number
}

/**
 * StatsGrid - 참여 통계 그리드
 */
export default function StatsGrid({ user, bookCount }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="card p-4 text-center">
        <Calendar className="mx-auto text-text-muted mb-2" size={24} strokeWidth={1.5} />
        <p className="text-2xl font-bold text-text">{user.total_participations}</p>
        <p className="text-xs text-text-muted">총 참여</p>
      </div>
      <div className="card p-4 text-center">
        <Award className="mx-auto text-text-muted mb-2" size={24} strokeWidth={1.5} />
        <p className="text-2xl font-bold text-text">{user.consecutive_weeks}</p>
        <p className="text-xs text-text-muted">연속 참여 (주)</p>
      </div>
      <div className="card p-4 text-center">
        <Heart className="mx-auto text-rose-500 mb-2" size={24} strokeWidth={1.5} fill="currentColor" />
        <p className="text-2xl font-bold text-text">{user.total_praises_received}</p>
        <p className="text-xs text-text-muted">받은 칭찬</p>
      </div>
      <Link href="/mypage/bookshelf" className="card p-4 text-center hover:shadow-md transition-shadow">
        <BookOpen className="mx-auto text-text-muted mb-2" size={24} strokeWidth={1.5} />
        <p className="text-2xl font-bold text-text">{bookCount}</p>
        <p className="text-xs text-text-muted">등록한 책</p>
      </Link>
    </div>
  )
}
