/**
 * 환경 변수 검증 스크립트
 * Phase 2: DevOps 검토 (Alex Rivera)
 *
 * 실행: npx tsx scripts/check-env.ts
 */

interface EnvCheck {
  name: string
  required: boolean
  category: 'supabase' | 'payment' | 'notification' | 'monitoring' | 'app'
  description: string
  validate?: (value: string) => boolean
}

const ENV_CHECKS: EnvCheck[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    category: 'supabase',
    description: 'Supabase 프로젝트 URL',
    validate: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    category: 'supabase',
    description: 'Supabase 익명 키',
    validate: (v) => v.length > 100,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    category: 'supabase',
    description: 'Supabase 서비스 롤 키 (서버 전용)',
    validate: (v) => v.length > 100,
  },

  // Payment
  {
    name: 'PORTONE_API_KEY',
    required: true,
    category: 'payment',
    description: 'PortOne API 키',
  },
  {
    name: 'PORTONE_API_SECRET',
    required: true,
    category: 'payment',
    description: 'PortOne API 시크릿',
  },
  {
    name: 'PORTONE_WEBHOOK_SECRET',
    required: true,
    category: 'payment',
    description: 'PortOne 웹훅 시크릿',
  },

  // Notification
  {
    name: 'SOLAPI_API_KEY',
    required: true,
    category: 'notification',
    description: 'Solapi API 키',
  },
  {
    name: 'SOLAPI_API_SECRET',
    required: true,
    category: 'notification',
    description: 'Solapi API 시크릿',
  },

  // Monitoring
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    category: 'monitoring',
    description: 'Sentry DSN (클라이언트)',
    validate: (v) => v.startsWith('https://') && v.includes('@'),
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    category: 'monitoring',
    description: 'Sentry DSN (서버)',
  },
  {
    name: 'SENTRY_AUTH_TOKEN',
    required: false,
    category: 'monitoring',
    description: 'Sentry Auth 토큰 (소스맵 업로드용)',
  },
  {
    name: 'SENTRY_ORG',
    required: false,
    category: 'monitoring',
    description: 'Sentry 조직 이름',
  },
  {
    name: 'SENTRY_PROJECT',
    required: false,
    category: 'monitoring',
    description: 'Sentry 프로젝트 이름',
  },

  // App
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    category: 'app',
    description: '앱 URL (프로덕션)',
    validate: (v) => v.startsWith('http'),
  },
  {
    name: 'TRANSFER_DEADLINE_HOURS',
    required: false,
    category: 'payment',
    description: '계좌이체 입금 기한 (시간)',
    validate: (v) => !isNaN(Number(v)) && Number(v) > 0,
  },
  {
    name: 'NEXT_PUBLIC_TRANSFER_BANK_NAME',
    required: false,
    category: 'payment',
    description: '계좌이체 은행명',
  },
  {
    name: 'NEXT_PUBLIC_TRANSFER_ACCOUNT_NUMBER',
    required: false,
    category: 'payment',
    description: '계좌이체 계좌번호',
  },
]

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  category: string
}

function checkEnvVars(): CheckResult[] {
  const results: CheckResult[] = []

  for (const check of ENV_CHECKS) {
    const value = process.env[check.name]

    if (!value) {
      if (check.required) {
        results.push({
          name: check.name,
          status: 'fail',
          message: `MISSING: ${check.description}`,
          category: check.category,
        })
      } else {
        results.push({
          name: check.name,
          status: 'warn',
          message: `Optional not set: ${check.description}`,
          category: check.category,
        })
      }
      continue
    }

    // Validate format if validator exists
    if (check.validate && !check.validate(value)) {
      results.push({
        name: check.name,
        status: 'fail',
        message: `INVALID FORMAT: ${check.description}`,
        category: check.category,
      })
      continue
    }

    results.push({
      name: check.name,
      status: 'pass',
      message: `OK: ${check.description}`,
      category: check.category,
    })
  }

  return results
}

function printResults(results: CheckResult[]): void {
  console.log('\n' + '='.repeat(60))
  console.log('   ENV VALIDATION REPORT')
  console.log('='.repeat(60) + '\n')

  const categories = ['supabase', 'payment', 'notification', 'monitoring', 'app']

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category)
    if (categoryResults.length === 0) continue

    console.log(`\n[${category.toUpperCase()}]`)
    console.log('-'.repeat(40))

    for (const result of categoryResults) {
      const icon =
        result.status === 'pass' ? '[PASS]' : result.status === 'fail' ? '[FAIL]' : '[WARN]'
      console.log(`  ${icon} ${result.name}`)
      console.log(`        ${result.message}`)
    }
  }

  // Summary
  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const warned = results.filter((r) => r.status === 'warn').length

  console.log('\n' + '='.repeat(60))
  console.log('   SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Total: ${results.length}`)
  console.log(`  [PASS]: ${passed}`)
  console.log(`  [FAIL]: ${failed}`)
  console.log(`  [WARN]: ${warned}`)
  console.log('='.repeat(60) + '\n')

  if (failed > 0) {
    console.log('[RESULT] FAILED - Missing required environment variables')
    process.exit(1)
  } else if (warned > 0) {
    console.log('[RESULT] PASSED with warnings - Some optional variables not set')
    process.exit(0)
  } else {
    console.log('[RESULT] PASSED - All environment variables configured')
    process.exit(0)
  }
}

// Main
const results = checkEnvVars()
printResults(results)
