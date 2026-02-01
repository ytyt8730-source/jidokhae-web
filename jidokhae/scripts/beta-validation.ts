/**
 * Beta 출시 전 종합 검증 스크립트
 *
 * 실행: npx tsx scripts/beta-validation.ts
 *
 * 3명의 전문가 페르소나 관점에서 검증:
 * - Dr. Maya Chen (QA): 데이터 무결성
 * - Alex Rivera (DevOps): 환경 설정, 보안
 * - Sarah Park (PM): PRD 충족도
 */

import { execSync } from 'child_process'
import * as path from 'path'

const SCRIPTS_DIR = __dirname

interface ValidationResult {
  phase: string
  expert: string
  script: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  message: string
}

const VALIDATION_PHASES = [
  {
    phase: 'Phase 1: Environment Check',
    expert: 'Alex Rivera (DevOps)',
    script: 'check-env.ts',
    description: '환경 변수 검증',
  },
  {
    phase: 'Phase 2: Security Scan',
    expert: 'Alex Rivera (DevOps)',
    script: 'security-scan.ts',
    description: '보안 취약점 스캔',
  },
  {
    phase: 'Phase 3: PRD Checklist',
    expert: 'Sarah Park (PM)',
    script: 'prd-checklist.ts',
    description: 'PRD 충족도 검사',
  },
  {
    phase: 'Phase 4: Data Integrity',
    expert: 'Dr. Maya Chen (QA)',
    script: 'data-integrity.ts',
    description: '데이터 무결성 검사',
    requiresDb: true,
  },
]

function runScript(scriptPath: string): { success: boolean; output: string; duration: number } {
  const start = Date.now()
  try {
    const output = execSync(`npx tsx ${scriptPath}`, {
      cwd: path.dirname(SCRIPTS_DIR),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    })
    return {
      success: true,
      output,
      duration: Date.now() - start,
    }
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string }
    return {
      success: false,
      output: (err.stdout || '') + (err.stderr || ''),
      duration: Date.now() - start,
    }
  }
}

async function runValidation(): Promise<void> {
  console.log('\n')
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║' + ' '.repeat(14) + 'BETA VALIDATION SUITE' + ' '.repeat(23) + '║')
  console.log('║' + ' '.repeat(58) + '║')
  console.log('║  Expert Panel:' + ' '.repeat(43) + '║')
  console.log('║    - Dr. Maya Chen (QA Engineering Director)' + ' '.repeat(12) + '║')
  console.log('║    - Alex Rivera (Principal DevOps Engineer)' + ' '.repeat(12) + '║')
  console.log('║    - Sarah Park (VP of Product)' + ' '.repeat(26) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')
  console.log('\n')

  const results: ValidationResult[] = []
  const hasDbAccess = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  for (const phase of VALIDATION_PHASES) {
    console.log('─'.repeat(60))
    console.log(`${phase.phase}`)
    console.log(`Expert: ${phase.expert}`)
    console.log(`Description: ${phase.description}`)
    console.log('─'.repeat(60))

    if (phase.requiresDb && !hasDbAccess) {
      console.log('[SKIP] Database access required but SUPABASE_SERVICE_ROLE_KEY not set\n')
      results.push({
        phase: phase.phase,
        expert: phase.expert,
        script: phase.script,
        status: 'skip',
        duration: 0,
        message: 'Skipped - DB access required',
      })
      continue
    }

    const scriptPath = path.join(SCRIPTS_DIR, phase.script)
    console.log(`Running: ${phase.script}...\n`)

    const { success, output, duration } = runScript(scriptPath)

    // 출력 표시 (마지막 30줄만)
    const lines = output.split('\n')
    const displayLines = lines.slice(-30)
    console.log(displayLines.join('\n'))

    results.push({
      phase: phase.phase,
      expert: phase.expert,
      script: phase.script,
      status: success ? 'pass' : 'fail',
      duration,
      message: success ? 'Passed' : 'Failed',
    })

    console.log('\n')
  }

  // Final Summary
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log('║' + ' '.repeat(18) + 'FINAL SUMMARY' + ' '.repeat(27) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')
  console.log('')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const skipped = results.filter((r) => r.status === 'skip').length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log('Results by Phase:')
  console.log('─'.repeat(60))

  for (const result of results) {
    const icon =
      result.status === 'pass' ? '[PASS]' : result.status === 'fail' ? '[FAIL]' : '[SKIP]'
    console.log(`  ${icon} ${result.phase}`)
    console.log(`        Expert: ${result.expert}`)
    console.log(`        Duration: ${result.duration}ms`)
  }

  console.log('')
  console.log('─'.repeat(60))
  console.log(`Total Phases: ${results.length}`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`Total Duration: ${totalDuration}ms`)
  console.log('─'.repeat(60))

  if (failed > 0) {
    console.log('\n[FINAL RESULT] BETA VALIDATION FAILED')
    console.log('Action Required: Fix all failed checks before Beta release')
    process.exit(1)
  } else {
    console.log('\n[FINAL RESULT] BETA VALIDATION PASSED')
    if (skipped > 0) {
      console.log(`Note: ${skipped} phase(s) skipped - run with full DB access for complete validation`)
    }
    process.exit(0)
  }
}

runValidation().catch(console.error)
