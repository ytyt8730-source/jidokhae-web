/**
 * 회원 관리 페이지
 * admin, super_admin 전용 - 회원 목록 조회 및 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/auth/login')
  }

  // admin 이상 권한 확인
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">회원 관리</h1>
        <p className="text-gray-600 mt-1">
          전체 회원 목록을 확인하고 관리하세요
        </p>
      </div>
      <UsersClient />
    </div>
  )
}
