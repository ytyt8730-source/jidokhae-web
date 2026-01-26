'use client'

/**
 * 배지 아이콘 컴포넌트
 * No-Emoji Policy: Lucide 아이콘으로 배지 표시
 */

import { Footprints, Target, Flame, Heart, Star, Crown, Award, type LucideIcon } from 'lucide-react'

// Lucide 아이콘 매핑
const BADGE_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Target,
  Flame,
  Heart,
  Star,
  Crown,
  Award,
}

interface BadgeIconProps {
  /** 아이콘 이름 (Lucide 컴포넌트명) */
  icon: string
  /** 아이콘 크기 (기본: 20) */
  size?: number
  /** 추가 클래스 */
  className?: string
}

export default function BadgeIcon({ icon, size = 20, className = 'text-brand-600' }: BadgeIconProps) {
  const IconComponent = BADGE_ICONS[icon] || BADGE_ICONS.Award
  return <IconComponent size={size} strokeWidth={1.5} className={className} />
}
