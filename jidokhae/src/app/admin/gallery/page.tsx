/**
 * 갤러리 이미지 관리 페이지
 * About 페이지의 갤러리 이미지를 관리
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { GalleryClient } from './GalleryClient'

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // banner_manage 권한 재사용 (갤러리도 콘텐츠 관리 범주)
  const hasAccess = await hasPermission(authUser.id, 'banner_manage')
  if (!hasAccess) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-800">갤러리 관리</h1>
      </div>

      <GalleryClient />
    </div>
  )
}
