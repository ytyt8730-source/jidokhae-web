/**
 * 데이터 무결성 검사 스크립트
 * Phase 1: QA 검토 (Dr. Maya Chen)
 *
 * 실행: npx tsx scripts/data-integrity.ts
 *
 * 환경 변수 필요:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERROR] Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface IntegrityCheck {
  id: string
  name: string
  check: () => Promise<{ passed: boolean; message: string; details?: unknown }>
}

const INTEGRITY_CHECKS: IntegrityCheck[] = [
  {
    id: 'DI-001',
    name: '참가자 수 정합성',
    check: async () => {
      // registrations 수와 current_participants 비교
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, current_participants')
        .eq('status', 'open')

      if (error) return { passed: false, message: `Query error: ${error.message}` }

      const mismatches: Array<{ meetingId: string; title: string; expected: number; actual: number }> = []

      for (const meeting of meetings || []) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('meeting_id', meeting.id)
          .in('status', ['confirmed', 'pending_payment', 'pending_transfer'])

        if (count !== meeting.current_participants) {
          mismatches.push({
            meetingId: meeting.id,
            title: meeting.title,
            expected: count || 0,
            actual: meeting.current_participants,
          })
        }
      }

      if (mismatches.length > 0) {
        return {
          passed: false,
          message: `${mismatches.length} meetings have participant count mismatch`,
          details: mismatches,
        }
      }

      return { passed: true, message: `All ${meetings?.length || 0} meetings have correct participant counts` }
    },
  },
  {
    id: 'DI-002',
    name: '대기 순서 연속성',
    check: async () => {
      // 각 모임의 대기 순서가 1부터 연속적인지 확인
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title')
        .eq('status', 'open')

      if (error) return { passed: false, message: `Query error: ${error.message}` }

      const issues: Array<{ meetingId: string; title: string; issue: string }> = []

      for (const meeting of meetings || []) {
        const { data: waitlist } = await supabase
          .from('waitlist')
          .select('position')
          .eq('meeting_id', meeting.id)
          .eq('status', 'waiting')
          .order('position', { ascending: true })

        if (!waitlist || waitlist.length === 0) continue

        // 순서 확인
        for (let i = 0; i < waitlist.length; i++) {
          if (waitlist[i].position !== i + 1) {
            issues.push({
              meetingId: meeting.id,
              title: meeting.title,
              issue: `Position gap: expected ${i + 1}, got ${waitlist[i].position}`,
            })
            break
          }
        }
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `${issues.length} meetings have waitlist position issues`,
          details: issues,
        }
      }

      return { passed: true, message: 'All waitlist positions are sequential' }
    },
  },
  {
    id: 'DI-003',
    name: '환불 규정 존재',
    check: async () => {
      // 필수 환불 규정 존재 확인
      const { data: policies, error } = await supabase
        .from('refund_policies')
        .select('meeting_type, days_before')

      if (error) return { passed: false, message: `Query error: ${error.message}` }

      const requiredTypes = ['regular', 'discussion']
      const missingTypes: string[] = []

      for (const type of requiredTypes) {
        const typePolices = policies?.filter((p) => p.meeting_type === type)
        if (!typePolices || typePolices.length === 0) {
          missingTypes.push(type)
        }
      }

      if (missingTypes.length > 0) {
        return {
          passed: false,
          message: `Missing refund policies for: ${missingTypes.join(', ')}`,
        }
      }

      return { passed: true, message: `Refund policies exist for all meeting types` }
    },
  },
  {
    id: 'DI-004',
    name: '고아 등록 확인',
    check: async () => {
      // pending 상태로 24시간 이상 방치된 등록 확인
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: orphaned, error } = await supabase
        .from('registrations')
        .select('id, user_id, meeting_id, status, created_at')
        .eq('status', 'pending')
        .lt('created_at', cutoff)

      if (error) return { passed: false, message: `Query error: ${error.message}` }

      if (orphaned && orphaned.length > 0) {
        return {
          passed: false,
          message: `${orphaned.length} orphaned 'pending' registrations found (>24h old)`,
          details: orphaned.map((r) => ({
            id: r.id,
            createdAt: r.created_at,
          })),
        }
      }

      return { passed: true, message: 'No orphaned pending registrations' }
    },
  },
  {
    id: 'DI-005',
    name: 'RPC 함수 존재',
    check: async () => {
      // check_and_reserve_capacity 함수 호출 테스트 (실제 실행 X)
      const { error } = await supabase.rpc('check_and_reserve_capacity', {
        p_meeting_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
      })

      // 함수가 존재하면 'MEETING_NOT_FOUND' 에러가 나야 함
      // 함수가 없으면 'function does not exist' 에러
      if (error?.message?.includes('does not exist')) {
        return {
          passed: false,
          message: 'RPC function check_and_reserve_capacity does not exist',
        }
      }

      return { passed: true, message: 'RPC function check_and_reserve_capacity exists' }
    },
  },
  {
    id: 'DI-006',
    name: '사용자 테이블 동기화',
    check: async () => {
      // auth.users와 public.users 동기화 확인
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        return { passed: false, message: `Auth query error: ${authError.message}` }
      }

      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id')

      if (publicError) {
        return { passed: false, message: `Public users query error: ${publicError.message}` }
      }

      const authIds = new Set(authUsers.users.map((u) => u.id))
      const publicIds = new Set((publicUsers || []).map((u) => u.id))

      const missingInPublic = Array.from(authIds).filter((id) => !publicIds.has(id))

      if (missingInPublic.length > 0) {
        return {
          passed: false,
          message: `${missingInPublic.length} users missing in public.users table`,
          details: { missingUserIds: missingInPublic.slice(0, 5) },
        }
      }

      return { passed: true, message: `All ${authIds.size} auth users synced to public.users` }
    },
  },
]

async function runIntegrityChecks(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('   DATA INTEGRITY CHECK REPORT')
  console.log('='.repeat(60) + '\n')

  const results: Array<{ id: string; name: string; passed: boolean; message: string }> = []

  for (const check of INTEGRITY_CHECKS) {
    process.stdout.write(`[${check.id}] ${check.name}... `)
    try {
      const result = await check.check()
      console.log(result.passed ? '[PASS]' : '[FAIL]')
      console.log(`        ${result.message}`)
      if (result.details) {
        console.log(`        Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n        ')}`)
      }
      results.push({ id: check.id, name: check.name, ...result })
    } catch (err) {
      console.log('[ERROR]')
      console.log(`        ${err instanceof Error ? err.message : 'Unknown error'}`)
      results.push({ id: check.id, name: check.name, passed: false, message: String(err) })
    }
    console.log('')
  }

  // Summary
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log('='.repeat(60))
  console.log('   SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Total: ${results.length}`)
  console.log(`  [PASS]: ${passed}`)
  console.log(`  [FAIL]: ${failed}`)
  console.log('='.repeat(60) + '\n')

  if (failed > 0) {
    console.log('[RESULT] FAILED - Data integrity issues found')
    process.exit(1)
  } else {
    console.log('[RESULT] PASSED - All integrity checks passed')
    process.exit(0)
  }
}

runIntegrityChecks().catch(console.error)
