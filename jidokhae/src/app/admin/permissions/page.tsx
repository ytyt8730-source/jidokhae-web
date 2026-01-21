/**
 * 권한 관리 페이지
 * super_admin 전용 - 운영자 목록 및 권한 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PermissionsClient } from './PermissionsClient'

export default async function PermissionsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">권한 관리</h1>
        <p className="text-warm-600 mt-1">
          운영자에게 역할에 맞는 권한을 부여하세요
        </p>
      </div>
      <PermissionsClient />
    </div>
  )
}
