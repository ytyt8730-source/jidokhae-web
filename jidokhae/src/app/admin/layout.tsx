import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Calendar, Users, Settings, Bell, CreditCard } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    redirect('/auth/login')
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    redirect('/')
  }

  const navItems = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/meetings', label: '모임 관리', icon: Calendar },
    { href: '/admin/transfers', label: '입금 확인', icon: CreditCard },
    { href: '/admin/users', label: '회원 관리', icon: Users },
    { href: '/admin/notifications', label: '알림 발송', icon: Bell },
    { href: '/admin/settings', label: '설정', icon: Settings },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-warm-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 사이드바 */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="card p-4">
              <h2 className="font-semibold text-warm-900 mb-4 px-2">관리자</h2>
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-warm-600 hover:bg-warm-50 hover:text-warm-900 transition-colors"
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

