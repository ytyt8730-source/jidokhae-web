/**
 * 운영자 알림 발송 페이지
 * M3 알림시스템 - Phase 4
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationForm from './NotificationForm'
import NotificationLogs from './NotificationLogs'

export const metadata = {
  title: '알림 발송 - 관리자 - 지독해',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/auth/login')
  }

  // 관리자 권한 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
    redirect('/')
  }

  // 모임 목록 조회 (특정 모임 참가자 알림용)
  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, title, datetime')
    .gte('datetime', new Date().toISOString())
    .eq('status', 'open')
    .order('datetime', { ascending: true })
    .limit(20)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-warm-900">알림 발송</h1>

      {/* 알림 발송 폼 */}
      <div className="card p-6">
        <h2 className="font-semibold text-warm-900 mb-4">수동 알림 발송</h2>
        <NotificationForm meetings={meetings || []} />
      </div>

      {/* 발송 이력 */}
      <div className="card p-6">
        <h2 className="font-semibold text-warm-900 mb-4">발송 이력</h2>
        <NotificationLogs />
      </div>
    </div>
  )
}
