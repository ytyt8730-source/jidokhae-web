import type { User as UserType } from '@/types/database'

interface ProfileCardProps {
  user: UserType
  daysWithUs: number
}

/**
 * ProfileCard - 사용자 프로필 정보 카드
 */
export default function ProfileCard({ user, daysWithUs }: ProfileCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {user.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-text">{user.name}</h2>
          <p className="text-text-muted">{user.email}</p>
          {user.phone && (
            <p className="text-sm text-text-muted/70 mt-1">{user.phone}</p>
          )}
        </div>
      </div>

      {/* 함께한 기간 */}
      <div className="mt-6 p-4 bg-primary/5 rounded-xl text-center">
        <p className="text-sm text-primary">지독해와 함께한 지</p>
        <p className="text-2xl font-bold text-text mt-1">
          {daysWithUs}일째
        </p>
      </div>
    </div>
  )
}
