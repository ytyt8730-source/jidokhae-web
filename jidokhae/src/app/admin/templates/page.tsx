/**
 * 알림 템플릿 관리 페이지
 * M5 Phase 2 - 알림 템플릿 관리
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TemplatesClient from './TemplatesClient'

export const metadata = {
  title: '알림 템플릿 관리 - 관리자 - 지독해',
}

export default async function TemplatesPage() {
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

  // 템플릿 목록 조회
  const { data: templates } = await supabase
    .from('notification_templates')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">알림 템플릿 관리</h1>
      </div>

      <p className="text-warm-600 text-sm">
        알림 문구를 수정하고, 발송 여부를 설정할 수 있습니다.
      </p>

      <TemplatesClient initialTemplates={templates || []} />
    </div>
  )
}
