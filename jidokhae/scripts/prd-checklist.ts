/**
 * PRD 충족도 검사 스크립트
 * Phase 3: PM 검토 (Sarah Park)
 *
 * 실행: npx tsx scripts/prd-checklist.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface PRDCheck {
  id: string
  requirement: string
  category: 'ux' | 'business' | 'design' | 'feature'
  priority: 'P0' | 'P1' | 'P2'
  check: () => { status: 'pass' | 'fail' | 'manual'; message: string }
}

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SRC_ROOT = path.join(PROJECT_ROOT, 'src')

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(SRC_ROOT, relativePath))
}

function fileContains(relativePath: string, pattern: string | RegExp): boolean {
  const fullPath = path.join(SRC_ROOT, relativePath)
  if (!fs.existsSync(fullPath)) return false
  const content = fs.readFileSync(fullPath, 'utf-8')
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
}

function searchInDir(dir: string, pattern: string | RegExp): string[] {
  const results: string[] = []
  const fullDir = path.join(SRC_ROOT, dir)

  if (!fs.existsSync(fullDir)) return results

  function search(currentDir: string) {
    const items = fs.readdirSync(currentDir)
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.includes('node_modules')) {
        search(fullPath)
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const matches = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
        if (matches) {
          results.push(path.relative(SRC_ROOT, fullPath))
        }
      }
    }
  }

  search(fullDir)
  return results
}

const PRD_CHECKS: PRDCheck[] = [
  // UX 요구사항
  {
    id: 'PRD-001',
    requirement: '3-Click 신청 룰',
    category: 'ux',
    priority: 'P0',
    check: () => ({
      status: 'manual',
      message: '수동 확인 필요: 홈 → 모임 클릭 → Bottom Sheet → CTA 클릭 = 3클릭',
    }),
  },
  {
    id: 'PRD-002',
    requirement: 'Bottom Sheet 패턴',
    category: 'ux',
    priority: 'P0',
    check: () => {
      const hasBottomSheet = fileExists('components/BottomSheet.tsx')
      return {
        status: hasBottomSheet ? 'pass' : 'fail',
        message: hasBottomSheet
          ? 'BottomSheet 컴포넌트 존재'
          : 'BottomSheet 컴포넌트 없음',
      }
    },
  },
  {
    id: 'PRD-003',
    requirement: '마음 돌리기 UI (취소 설득)',
    category: 'ux',
    priority: 'P0',
    check: () => {
      const hasPersuasion = fileContains('components/CancelModal.tsx', 'persuasion')
      return {
        status: hasPersuasion ? 'pass' : 'fail',
        message: hasPersuasion
          ? 'CancelModal에 설득 요소 구현됨'
          : 'CancelModal에 설득 요소 없음',
      }
    },
  },
  {
    id: 'PRD-004',
    requirement: 'Realtime 참가 인원 표시',
    category: 'feature',
    priority: 'P0',
    check: () => {
      const hasHook = fileExists('hooks/useMeetingParticipants.ts')
      return {
        status: hasHook ? 'pass' : 'fail',
        message: hasHook
          ? 'Realtime 참가 인원 훅 구현됨'
          : 'Realtime 참가 인원 훅 없음',
      }
    },
  },
  {
    id: 'PRD-005',
    requirement: '환불 규정 표시',
    category: 'business',
    priority: 'P0',
    check: () => {
      const hasRefundPolicy = searchInDir('components', /refund/i).length > 0
      return {
        status: hasRefundPolicy ? 'pass' : 'fail',
        message: hasRefundPolicy
          ? '환불 규정 컴포넌트 존재'
          : '환불 규정 컴포넌트 없음',
      }
    },
  },
  {
    id: 'PRD-006',
    requirement: '콩 화폐 단위 사용',
    category: 'design',
    priority: 'P0',
    check: () => {
      const hasKongIcon = fileExists('components/icons/KongIcon.tsx')
      const usesKong = searchInDir('components', 'KongIcon').length > 0
      return {
        status: hasKongIcon && usesKong ? 'pass' : 'fail',
        message:
          hasKongIcon && usesKong
            ? 'KongIcon 구현 및 사용 중'
            : `KongIcon: ${hasKongIcon ? 'O' : 'X'}, 사용: ${usesKong ? 'O' : 'X'}`,
      }
    },
  },
  {
    id: 'PRD-007',
    requirement: 'No-Emoji 정책',
    category: 'design',
    priority: 'P1',
    check: () => {
      // 이모지 패턴 검사 (간단한 검사)
      const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u
      const filesWithEmoji = searchInDir('components', emojiPattern)
      return {
        status: filesWithEmoji.length === 0 ? 'pass' : 'fail',
        message:
          filesWithEmoji.length === 0
            ? 'No-Emoji 정책 준수'
            : `이모지 발견: ${filesWithEmoji.join(', ')}`,
      }
    },
  },
  {
    id: 'PRD-008',
    requirement: 'Sticky CTA (모바일)',
    category: 'ux',
    priority: 'P1',
    check: () => {
      const hasSticky = searchInDir('app/meetings', /fixed.*bottom|sticky/i).length > 0
      return {
        status: hasSticky ? 'pass' : 'manual',
        message: hasSticky
          ? 'Sticky CTA 패턴 발견'
          : '수동 확인 필요: 모임 상세 페이지 모바일 CTA',
      }
    },
  },
  {
    id: 'PRD-009',
    requirement: '동시성 락 (FOR UPDATE)',
    category: 'feature',
    priority: 'P0',
    check: () => {
      const usesRPC = fileContains(
        'app/api/registrations/transfer/route.ts',
        'check_and_reserve_capacity'
      )
      return {
        status: usesRPC ? 'pass' : 'fail',
        message: usesRPC
          ? 'transfer API에서 RPC 사용 중'
          : 'transfer API에서 RPC 미사용 (동시성 위험)',
      }
    },
  },
  {
    id: 'PRD-010',
    requirement: 'Sentry 에러 모니터링',
    category: 'feature',
    priority: 'P0',
    check: () => {
      const hasSentryConfig = fs.existsSync(path.join(PROJECT_ROOT, 'sentry.client.config.ts'))
      const hasLoggerIntegration = fileContains('lib/logger.ts', 'Sentry')
      return {
        status: hasSentryConfig && hasLoggerIntegration ? 'pass' : 'fail',
        message:
          hasSentryConfig && hasLoggerIntegration
            ? 'Sentry 설정 및 로거 통합 완료'
            : `Sentry 설정: ${hasSentryConfig ? 'O' : 'X'}, 로거 통합: ${hasLoggerIntegration ? 'O' : 'X'}`,
      }
    },
  },
  {
    id: 'PRD-011',
    requirement: '모임 목록 필터',
    category: 'feature',
    priority: 'P1',
    check: () => {
      const hasFilter = fileExists('components/MeetingFilter.tsx')
      return {
        status: hasFilter ? 'pass' : 'fail',
        message: hasFilter
          ? 'MeetingFilter 컴포넌트 존재'
          : 'MeetingFilter 컴포넌트 없음',
      }
    },
  },
  {
    id: 'PRD-012',
    requirement: 'Stagger 애니메이션',
    category: 'design',
    priority: 'P1',
    check: () => {
      const hasStagger = fileContains('lib/animations.ts', 'stagger')
      return {
        status: hasStagger ? 'pass' : 'fail',
        message: hasStagger
          ? 'Stagger 애니메이션 정의됨'
          : 'Stagger 애니메이션 없음',
      }
    },
  },
  {
    id: 'PRD-013',
    requirement: '대기 신청 기능',
    category: 'feature',
    priority: 'P1',
    check: () => {
      const hasWaitlistAPI = fileExists('app/api/waitlists/register/route.ts')
      return {
        status: hasWaitlistAPI ? 'pass' : 'fail',
        message: hasWaitlistAPI
          ? '대기 신청 API 존재'
          : '대기 신청 API 없음',
      }
    },
  },
  {
    id: 'PRD-014',
    requirement: '배지 시스템',
    category: 'feature',
    priority: 'P2',
    check: () => ({
      status: 'manual',
      message: '수동 확인 필요: 마이페이지 배지 섹션 확인',
    }),
  },
  {
    id: 'PRD-015',
    requirement: '모바일 최적화 (360px)',
    category: 'ux',
    priority: 'P0',
    check: () => ({
      status: 'manual',
      message: '수동 확인 필요: 360px 뷰포트에서 전체 플로우 테스트',
    }),
  },
]

function runPRDChecklist(): void {
  console.log('\n' + '='.repeat(60))
  console.log('   PRD CHECKLIST REPORT')
  console.log('='.repeat(60) + '\n')

  const categories = ['ux', 'feature', 'business', 'design']
  const results: Array<{ id: string; requirement: string; status: string; priority: string }> = []

  for (const category of categories) {
    const categoryChecks = PRD_CHECKS.filter((c) => c.category === category)
    if (categoryChecks.length === 0) continue

    console.log(`\n[${category.toUpperCase()}]`)
    console.log('-'.repeat(40))

    for (const check of categoryChecks) {
      const result = check.check()
      const icon =
        result.status === 'pass' ? '[PASS]' : result.status === 'fail' ? '[FAIL]' : '[MANUAL]'
      console.log(`  ${icon} [${check.priority}] ${check.id}: ${check.requirement}`)
      console.log(`        ${result.message}`)

      results.push({
        id: check.id,
        requirement: check.requirement,
        status: result.status,
        priority: check.priority,
      })
    }
  }

  // Summary
  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const manual = results.filter((r) => r.status === 'manual').length

  const p0Failed = results.filter((r) => r.status === 'fail' && r.priority === 'P0').length

  console.log('\n' + '='.repeat(60))
  console.log('   SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Total: ${results.length}`)
  console.log(`  [PASS]: ${passed}`)
  console.log(`  [FAIL]: ${failed}`)
  console.log(`  [MANUAL]: ${manual}`)
  console.log(`  PRD 충족률: ${Math.round((passed / (passed + failed)) * 100)}%`)
  console.log('='.repeat(60) + '\n')

  if (p0Failed > 0) {
    console.log(`[RESULT] FAILED - ${p0Failed} P0 requirements not met`)
    process.exit(1)
  } else if (failed > 0) {
    console.log('[RESULT] PASSED with warnings - Some requirements not met')
    process.exit(0)
  } else {
    console.log('[RESULT] PASSED - All auto-checkable requirements met')
    console.log(`         ${manual} items require manual verification`)
    process.exit(0)
  }
}

runPRDChecklist()
