/**
 * 배지 정의 (클라이언트 전용)
 * 서버 전용 badges.ts에서 배지 정의를 분리하여 클라이언트에서도 사용 가능
 */

// No-Emoji Policy: 아이콘은 Lucide 컴포넌트명으로 지정
export const BADGE_DEFINITIONS = {
  first_step: {
    type: 'first_step',
    name: '첫 발자국',
    description: '첫 모임에 참여했어요',
    icon: 'Footprints',
  },
  participation_10: {
    type: 'participation_10',
    name: '10회 참여',
    description: '10번째 모임이에요',
    icon: 'Target',
  },
  consecutive_4: {
    type: 'consecutive_4',
    name: '연속 4주',
    description: '4주 연속 참여했어요',
    icon: 'Flame',
  },
  praise_10: {
    type: 'praise_10',
    name: '칭찬 10개',
    description: '칭찬을 10개 받았어요',
    icon: 'Heart',
  },
  praise_30: {
    type: 'praise_30',
    name: '칭찬 30개',
    description: '칭찬을 30개 받았어요',
    icon: 'Star',
  },
  praise_50: {
    type: 'praise_50',
    name: '칭찬 50개',
    description: '칭찬을 50개 받았어요',
    icon: 'Crown',
  },
} as const

export type BadgeType = keyof typeof BADGE_DEFINITIONS

export function getBadgeInfo(badgeType: string) {
  return BADGE_DEFINITIONS[badgeType as BadgeType] || null
}
