'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, User, BookOpen, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType } from '@/types/database'

interface SidebarProps {
  user: UserType | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const navItems = [
    { href: '/', label: '홈', icon: Home },
    { href: '/meetings', label: '모임 일정', icon: Calendar },
    { href: '/about', label: '소개', icon: BookOpen },
  ]

  const userItems = user
    ? [
        { href: '/mypage', label: '마이페이지', icon: User },
        ...(isAdmin ? [{ href: '/admin', label: '관리자', icon: Settings }] : []),
      ]
    : []

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0">
      {/* 로고 */}
      <div className="p-8 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <BookOpen className="text-white" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-serif font-bold text-xl text-brand-800 block">지독해</span>
            <span className="text-xs text-gray-400 tracking-wide">JIDOKHAE</span>
          </div>
        </Link>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === item.href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* 구분선 */}
        {user && (
          <>
            <div className="my-6 border-t border-gray-100" />
            <div className="space-y-1">
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon size={18} strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* 하단 영역 */}
      <div className="p-6 border-t border-gray-100">
        {user ? (
          <div className="space-y-4">
            <div className="px-4">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200"
            >
              <LogOut size={18} strokeWidth={1.5} />
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            멤버십 입장
          </Link>
        )}
      </div>
    </aside>
  )
}
