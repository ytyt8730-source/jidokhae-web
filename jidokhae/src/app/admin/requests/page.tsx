/**
 * 요청함(건의함) 관리 페이지
 * M5 Phase 4 - 운영자 요청함 답변
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { RequestsClient } from './RequestsClient'

export default async function RequestsPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // request_respond 권한 확인
  const hasAccess = await hasPermission(authUser.id, 'request_respond')
  if (!hasAccess) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-800">요청함</h1>
      </div>

      <RequestsClient />
    </div>
  )
}
