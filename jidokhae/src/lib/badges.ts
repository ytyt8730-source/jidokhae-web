/**
 * 배지 시스템
 * M4 소속감 - Phase 3
 *
 * 조건 충족 시 배지 자동 부여
 */

import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'

const logger = cronLogger

// 배지 정의 (No-Emoji Policy: Lucide 컴포넌트명 사용)
export const BADGE_DEFINITIONS = {
  first_step: {
    type: 'first_step',
    name: '첫 발자국',
    description: '첫 모임에 참여했어요',
    icon: 'Footprints',
    conditionType: 'participation',
    conditionValue: 1,
  },
  participation_10: {
    type: 'participation_10',
    name: '10회 참여',
    description: '10번째 모임이에요',
    icon: 'Target',
    conditionType: 'participation',
    conditionValue: 10,
  },
  consecutive_4: {
    type: 'consecutive_4',
    name: '연속 4주',
    description: '4주 연속 참여했어요',
    icon: 'Flame',
    conditionType: 'consecutive',
    conditionValue: 4,
  },
  praise_10: {
    type: 'praise_10',
    name: '칭찬 10개',
    description: '칭찬을 10개 받았어요',
    icon: 'Heart',
    conditionType: 'praise',
    conditionValue: 10,
  },
  praise_30: {
    type: 'praise_30',
    name: '칭찬 30개',
    description: '칭찬을 30개 받았어요',
    icon: 'Star',
    conditionType: 'praise',
    conditionValue: 30,
  },
  praise_50: {
    type: 'praise_50',
    name: '칭찬 50개',
    description: '칭찬을 50개 받았어요',
    icon: 'Crown',
    conditionType: 'praise',
    conditionValue: 50,
  },
} as const

export type BadgeType = keyof typeof BADGE_DEFINITIONS

// 배지 정보 가져오기
export function getBadgeInfo(badgeType: string) {
  return BADGE_DEFINITIONS[badgeType as BadgeType] || null
}

// 모든 배지 목록
export function getAllBadges() {
  return Object.values(BADGE_DEFINITIONS)
}

/**
 * 사용자가 획득한 배지 목록 조회
 */
export async function getUserBadges(userId: string) {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .order('acquired_at', { ascending: false })

  if (error) {
    logger.error('get_user_badges_error', {
      userId,
      error: error.message,
    })
    return []
  }

  return data || []
}

/**
 * 배지 부여
 */
async function awardBadge(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  badgeType: BadgeType
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('badges')
      .insert({
        user_id: userId,
        badge_type: badgeType,
      })

    if (error) {
      // 이미 있는 배지면 무시
      if (error.code === '23505') {
        return false
      }
      logger.error('award_badge_error', {
        userId,
        badgeType,
        error: error.message,
      })
      return false
    }

    logger.info('badge_awarded', {
      userId,
      badgeType,
      badgeName: BADGE_DEFINITIONS[badgeType].name,
    })

    return true
  } catch (error) {
    logger.error('award_badge_exception', {
      userId,
      badgeType,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

/**
 * 배지 조건 체크 및 부여
 * - 참여 완료, 칭찬 수신 시 호출
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const supabase = await createServiceClient()
  const awardedBadges: string[] = []

  try {
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_participations, consecutive_weeks, total_praises_received')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('check_badges_user_not_found', { userId })
      return awardedBadges
    }

    // 이미 획득한 배지 조회
    const { data: existingBadges } = await supabase
      .from('badges')
      .select('badge_type')
      .eq('user_id', userId)

    const earnedTypes = new Set(existingBadges?.map((b: { badge_type: string }) => b.badge_type) || [])

    // 참여 횟수 기반 배지 체크
    const participationBadges = [
      { type: 'first_step' as BadgeType, value: 1 },
      { type: 'participation_10' as BadgeType, value: 10 },
    ]

    for (const badge of participationBadges) {
      if (!earnedTypes.has(badge.type) && (user.total_participations || 0) >= badge.value) {
        const awarded = await awardBadge(supabase, userId, badge.type)
        if (awarded) {
          awardedBadges.push(badge.type)
        }
      }
    }

    // 연속 참여 기반 배지 체크
    if (!earnedTypes.has('consecutive_4') && (user.consecutive_weeks || 0) >= 4) {
      const awarded = await awardBadge(supabase, userId, 'consecutive_4')
      if (awarded) {
        awardedBadges.push('consecutive_4')
      }
    }

    // 칭찬 수신 기반 배지 체크
    const praiseBadges = [
      { type: 'praise_10' as BadgeType, value: 10 },
      { type: 'praise_30' as BadgeType, value: 30 },
      { type: 'praise_50' as BadgeType, value: 50 },
    ]

    for (const badge of praiseBadges) {
      if (!earnedTypes.has(badge.type) && (user.total_praises_received || 0) >= badge.value) {
        const awarded = await awardBadge(supabase, userId, badge.type)
        if (awarded) {
          awardedBadges.push(badge.type)
        }
      }
    }

    if (awardedBadges.length > 0) {
      logger.info('badges_check_complete', {
        userId,
        awardedBadges,
      })
    }

    return awardedBadges
  } catch (error) {
    logger.error('check_badges_error', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return awardedBadges
  }
}
