/**
 * 설정 페이지
 * super_admin 전용 - 시스템 설정 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/auth/login')
  }

  // super_admin 권한 확인
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!user || user.role !== 'super_admin') {
    redirect('/admin')
  }

  // 환불 정책 조회
  const { data: refundPolicies } = await supabase
    .from('refund_policies')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">설정</h1>
        <p className="text-gray-600 mt-1">
          시스템 설정을 관리하세요
        </p>
      </div>
      <SettingsClient initialPolicies={refundPolicies || []} />
    </div>
  )
}
