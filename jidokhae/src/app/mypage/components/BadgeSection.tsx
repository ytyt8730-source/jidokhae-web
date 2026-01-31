import { Trophy } from 'lucide-react'
import BadgeIcon from '@/components/BadgeIcon'
import { getBadgeInfo } from '@/lib/badges'

interface BadgeSectionProps {
  badges: { id: string; badge_type: string }[]
}

/**
 * BadgeSection - 배지 섹션 (Trophy Glow 효과)
 *
 * Design Note (Marcus Wei):
 * - Ambient Glow로 프리미엄 분위기 연출
 * - drop-shadow로 Trophy 아이콘 강조
 */
export default function BadgeSection({ badges }: BadgeSectionProps) {
  if (badges.length === 0) return null

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Ambient Glow - 프리미엄 분위기 연출 */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

      <h3 className="flex items-center gap-2 font-semibold text-text mb-4 relative">
        <Trophy
          size={22}
          className="text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]"
          strokeWidth={1.5}
        />
        나의 배지
      </h3>
      <div className="flex flex-wrap gap-3 relative">
        {badges.map((badge) => {
          const info = getBadgeInfo(badge.badge_type)
          if (!info) return null
          return (
            <div
              key={badge.id}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)]/80 backdrop-blur-sm rounded-xl border border-yellow-200/30 hover:border-yellow-300/50 transition-colors"
              title={info.description}
            >
              <BadgeIcon icon={info.icon} size={20} className="text-primary" />
              <span className="text-sm font-medium text-text">{info.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
