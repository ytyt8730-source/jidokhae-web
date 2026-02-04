/**
 * 온보딩 시스템 타입 정의
 * M6-Onboarding Phase 1
 */

/**
 * 온보딩 진행 단계 (1~5)
 */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5

/**
 * 온보딩 상태 (API 응답용)
 */
export interface OnboardingState {
  step: OnboardingStep
  completedAt: string | null
  problemSelections: string[]
  firstAhaAt: string | null
  secondAhaAt: string | null
}

/**
 * 문제 인식 선택 옵션
 */
export interface ProblemOption {
  id: string
  label: string
  icon: string // Lucide icon name
}

/**
 * 문제 인식 선택지 (1단계)
 * No-Emoji: Lucide 아이콘 사용
 */
export const PROBLEM_OPTIONS: ProblemOption[] = [
  { id: 'unread_books', label: '책 사놓고 안 읽은 지 꽤 됐다', icon: 'BookX' },
  { id: 'routine_life', label: '회사-집 반복, 새로운 사람 만날 일이 없다', icon: 'Repeat' },
  { id: 'no_deep_talk', label: '진지한 대화 나눌 곳이 없다', icon: 'MessageCircleOff' },
  { id: 'want_belonging', label: '어딘가에 속해 있고 싶다', icon: 'Users' },
]

/**
 * 유효한 문제 ID 목록
 */
export const VALID_PROBLEM_IDS = PROBLEM_OPTIONS.map((option) => option.id)

/**
 * Aha Moment 타입
 */
export type AhaMomentType = 'first' | 'second'

/**
 * DB에서 가져온 User의 온보딩 관련 필드
 */
export interface OnboardingUserRow {
  onboarding_step: number | null
  onboarding_completed_at: string | null
  problem_selections: string[] | null
  first_aha_at: string | null
  second_aha_at: string | null
}

/**
 * DB row를 OnboardingState로 변환
 */
export function toOnboardingState(row: OnboardingUserRow): OnboardingState {
  return {
    step: (row.onboarding_step ?? 1) as OnboardingStep,
    completedAt: row.onboarding_completed_at,
    problemSelections: row.problem_selections ?? [],
    firstAhaAt: row.first_aha_at,
    secondAhaAt: row.second_aha_at,
  }
}

/**
 * 온보딩 단계 유효성 검사
 */
export function isValidOnboardingStep(step: unknown): step is OnboardingStep {
  return typeof step === 'number' && [1, 2, 3, 4, 5].includes(step)
}

/**
 * 문제 ID 유효성 검사
 */
export function isValidProblemId(id: string): boolean {
  return VALID_PROBLEM_IDS.includes(id)
}

/**
 * Aha Moment 타입 유효성 검사
 */
export function isValidAhaType(type: unknown): type is AhaMomentType {
  return type === 'first' || type === 'second'
}
