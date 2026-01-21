/**
 * 자격 만료 임박 알림 Cron API
 * M6 Phase 3 - 자격 체크 & 유도
 *
 * 매주 월요일 오전 10시(KST) 실행
 * - 정기모임 자격 만료 30일 이내인 회원 대상
 * - 정기모임 참여 유도 알림 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cronLogger } from '@/lib/logger'
import { getEligibilityWarningUsers } from '@/lib/eligibility'

const CRON_SECRET = process.env.CRON_SECRET

function verifyCronRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }

  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) {
    return true
  }

  return false
}

/**
 * 자격 만료 임박 알림 발송
 */
async function sendWarningNotification(user: {
  id: string
  name: string
  phone: string | null
  daysRemaining: number
}): Promise<boolean> {
  if (!user.phone) return false

  const supabase = await createServiceClient()

  const { data: template } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('code', 'ELIGIBILITY_WARNING')
    .eq('is_active', true)
    .single()

  if (!template) {
    cronLogger.warn('eligibility_warning_template_not_found')
    return false
  }

  const message = template.message_template
    .replace(/#{회원명}/g, user.name)
    .replace(/#{남은일수}/g, String(user.daysRemaining))

  // TODO: 실제 알림톡 발송 (Solapi)
  cronLogger.info('eligibility_warning_sent', {
    userId: user.id,
    phone: user.phone.slice(0, -4) + '****',
    daysRemaining: user.daysRemaining,
    message: message.slice(0, 50) + '...',
  })

  await supabase.from('notification_logs').insert({
    user_id: user.id,
    template_code: 'ELIGIBILITY_WARNING',
    phone_number: user.phone,
    status: 'sent',
  })

  return true
}

export async function GET(request: NextRequest) {
  const logger = cronLogger
  const timer = logger.startTimer()

  if (!verifyCronRequest(request)) {
    logger.warn('cron_unauthorized', { path: '/api/cron/eligibility-warning' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('eligibility_warning_cron_started')

  try {
    const users = await getEligibilityWarningUsers()
    let sent = 0

    for (const user of users) {
      const success = await sendWarningNotification(user)
      if (success) sent++
    }

    const stats = { total: users.length, sent }
    timer.done('eligibility_warning_cron_completed', stats)

    return NextResponse.json({
      success: true,
      message: 'Eligibility warning cron completed',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('eligibility_warning_cron_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
