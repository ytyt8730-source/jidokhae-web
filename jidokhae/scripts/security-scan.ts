/**
 * 보안 취약점 스캔 스크립트
 * Phase 2: DevOps 검토 (Alex Rivera)
 *
 * 실행: npx tsx scripts/security-scan.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface SecurityCheck {
  id: string
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  check: () => Promise<{ passed: boolean; message: string; findings?: string[] }>
}

const PROJECT_ROOT = path.resolve(__dirname, '..')

// 민감한 패턴들
const SENSITIVE_PATTERNS = {
  apiKeys: [
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
  ],
  hardcodedSecrets: [
    /sk_live_[a-zA-Z0-9]+/g, // Stripe live key
    /pk_live_[a-zA-Z0-9]+/g, // Stripe public key
    /ghp_[a-zA-Z0-9]+/g, // GitHub personal token
    /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT tokens
  ],
  sqlInjection: [
    /`\$\{.*\}`.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi,
    /'\s*\+\s*\w+\s*\+\s*'/g, // String concatenation in queries
  ],
}

// 스캔 대상 확장자
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']
const IGNORE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build']

function getAllFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        getAllFiles(fullPath, files)
      }
    } else if (SCAN_EXTENSIONS.some((ext) => item.endsWith(ext))) {
      files.push(fullPath)
    }
  }

  return files
}

const SECURITY_CHECKS: SecurityCheck[] = [
  {
    id: 'SEC-001',
    name: 'API 키 하드코딩',
    severity: 'critical',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative(PROJECT_ROOT, file)

        for (const pattern of SENSITIVE_PATTERNS.apiKeys) {
          const matches = content.match(pattern)
          if (matches) {
            // .env 파일 참조는 제외
            const filteredMatches = matches.filter(
              (m) => !m.includes('process.env') && !m.includes('NEXT_PUBLIC_')
            )
            if (filteredMatches.length > 0) {
              findings.push(`${relativePath}: ${filteredMatches[0].substring(0, 50)}...`)
            }
          }
        }
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? 'No hardcoded API keys found'
            : `Found ${findings.length} potential hardcoded secrets`,
        findings: findings.slice(0, 10),
      }
    },
  },
  {
    id: 'SEC-002',
    name: '하드코딩된 시크릿 토큰',
    severity: 'critical',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative(PROJECT_ROOT, file)

        for (const pattern of SENSITIVE_PATTERNS.hardcodedSecrets) {
          const matches = content.match(pattern)
          if (matches) {
            findings.push(`${relativePath}: Found token pattern`)
          }
        }
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? 'No hardcoded secret tokens found'
            : `Found ${findings.length} potential secret tokens`,
        findings,
      }
    },
  },
  {
    id: 'SEC-003',
    name: 'SQL Injection 패턴',
    severity: 'high',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative(PROJECT_ROOT, file)

        for (const pattern of SENSITIVE_PATTERNS.sqlInjection) {
          const matches = content.match(pattern)
          if (matches) {
            findings.push(`${relativePath}: Potential SQL injection pattern`)
          }
        }
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? 'No SQL injection patterns found'
            : `Found ${findings.length} potential SQL injection patterns`,
        findings,
      }
    },
  },
  {
    id: 'SEC-004',
    name: '.env 파일 노출',
    severity: 'critical',
    check: async () => {
      const envFiles = ['.env', '.env.local', '.env.production', '.env.development']
      const findings: string[] = []

      // .gitignore 확인
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore')
      let gitignoreContent = ''

      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8')
      }

      for (const envFile of envFiles) {
        if (fs.existsSync(path.join(PROJECT_ROOT, envFile))) {
          if (!gitignoreContent.includes(envFile) && !gitignoreContent.includes('.env')) {
            findings.push(`${envFile} exists but may not be in .gitignore`)
          }
        }
      }

      // .env가 git에 추적되고 있는지 확인
      if (!gitignoreContent.includes('.env')) {
        findings.push('.env pattern not found in .gitignore')
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? '.env files properly ignored'
            : 'Potential .env exposure issues',
        findings,
      }
    },
  },
  {
    id: 'SEC-005',
    name: 'console.log 제거',
    severity: 'low',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        // 테스트 파일과 스크립트 제외
        if (file.includes('.test.') || file.includes('/scripts/')) continue

        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')
        const relativePath = path.relative(PROJECT_ROOT, file)

        lines.forEach((line, index) => {
          // 주석 처리된 것 제외
          const trimmed = line.trim()
          if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return

          if (line.includes('console.log(') || line.includes('console.log (')) {
            findings.push(`${relativePath}:${index + 1}`)
          }
        })
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? 'No console.log statements found'
            : `Found ${findings.length} console.log statements`,
        findings: findings.slice(0, 10),
      }
    },
  },
  {
    id: 'SEC-006',
    name: 'dangerouslySetInnerHTML 사용',
    severity: 'high',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative(PROJECT_ROOT, file)

        if (content.includes('dangerouslySetInnerHTML')) {
          const lines = content.split('\n')
          lines.forEach((line, index) => {
            if (line.includes('dangerouslySetInnerHTML')) {
              findings.push(`${relativePath}:${index + 1}`)
            }
          })
        }
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0
            ? 'No dangerouslySetInnerHTML usage found'
            : `Found ${findings.length} dangerouslySetInnerHTML usages (potential XSS)`,
        findings,
      }
    },
  },
  {
    id: 'SEC-007',
    name: 'eval() 사용',
    severity: 'critical',
    check: async () => {
      const files = getAllFiles(path.join(PROJECT_ROOT, 'src'))
      const findings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative(PROJECT_ROOT, file)

        // eval( 또는 new Function( 패턴 검사
        if (content.includes('eval(') || content.includes('new Function(')) {
          findings.push(relativePath)
        }
      }

      return {
        passed: findings.length === 0,
        message:
          findings.length === 0 ? 'No eval() or new Function() usage found' : 'Found unsafe eval usage',
        findings,
      }
    },
  },
]

async function runSecurityScan(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('   SECURITY SCAN REPORT')
  console.log('='.repeat(60) + '\n')

  const results: Array<{
    id: string
    name: string
    severity: string
    passed: boolean
    message: string
  }> = []

  for (const check of SECURITY_CHECKS) {
    process.stdout.write(`[${check.id}] ${check.name} (${check.severity.toUpperCase()})... `)
    try {
      const result = await check.check()
      console.log(result.passed ? '[PASS]' : '[FAIL]')
      console.log(`        ${result.message}`)
      if (result.findings && result.findings.length > 0) {
        console.log('        Findings:')
        result.findings.forEach((f) => console.log(`          - ${f}`))
      }
      results.push({ id: check.id, name: check.name, severity: check.severity, ...result })
    } catch (err) {
      console.log('[ERROR]')
      console.log(`        ${err instanceof Error ? err.message : 'Unknown error'}`)
      results.push({
        id: check.id,
        name: check.name,
        severity: check.severity,
        passed: false,
        message: String(err),
      })
    }
    console.log('')
  }

  // Summary
  const criticalFailed = results.filter((r) => !r.passed && r.severity === 'critical').length
  const highFailed = results.filter((r) => !r.passed && r.severity === 'high').length
  const mediumFailed = results.filter((r) => !r.passed && r.severity === 'medium').length
  const lowFailed = results.filter((r) => !r.passed && r.severity === 'low').length

  console.log('='.repeat(60))
  console.log('   SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Total Checks: ${results.length}`)
  console.log(`  Passed: ${results.filter((r) => r.passed).length}`)
  console.log(`  Failed:`)
  console.log(`    [CRITICAL]: ${criticalFailed}`)
  console.log(`    [HIGH]: ${highFailed}`)
  console.log(`    [MEDIUM]: ${mediumFailed}`)
  console.log(`    [LOW]: ${lowFailed}`)
  console.log('='.repeat(60) + '\n')

  if (criticalFailed > 0 || highFailed > 0) {
    console.log('[RESULT] FAILED - Critical or High severity issues found')
    process.exit(1)
  } else if (mediumFailed > 0 || lowFailed > 0) {
    console.log('[RESULT] PASSED with warnings')
    process.exit(0)
  } else {
    console.log('[RESULT] PASSED - No security issues found')
    process.exit(0)
  }
}

runSecurityScan().catch(console.error)
