/**
 * 배너 관리 페이지
 * M5 Phase 4 - 홈 화면 배너 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { BannersClient } from './BannersClient'

export default async function BannersPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // banner_manage 권한 확인
  const hasAccess = await hasPermission(authUser.id, 'banner_manage')
  if (!hasAccess) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">배너 관리</h1>
      </div>

      <BannersClient />
    </div>
  )
}
