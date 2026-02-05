'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BookOpen, User, Settings, LogOut, Zap, Coffee } from 'lucide-react'
import { cn, getMemberLevel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/providers/ThemeProvider'
import type { User as UserType } from '@/types/database'

interface SidebarProps {
  user: UserType | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const navItems = [
    { href: '/', label: 'HOME', icon: Home },
    { href: '/meetings', label: 'SESSIONS', icon: Calendar },
    { href: '/about', label: 'ABOUT', icon: BookOpen },
  ]

  const userItems = user
    ? [
        { href: '/mypage', label: 'MY PAGE', icon: User },
        ...(isAdmin ? [{ href: '/admin', label: 'ADMIN', icon: Settings }] : []),
      ]
    : []

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-bg-surface border-r border-[var(--border)] fixed left-0 top-0 z-sticky">
      {/* 로고 */}
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/" className="block">
          {theme === 'electric' ? (
            <div className="font-display font-extrabold text-2xl text-text flex items-center">
              JIDOKHAE
              <span className="w-2 h-2 bg-accent rounded-full ml-1" />
            </div>
          ) : (
            <div>
              <span className="font-serif font-bold text-2xl text-text">지독해.</span>
              <span className="block text-[9px] text-text-muted uppercase tracking-widest mt-0.5">
                Intellectual Ritual
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                pathname === item.href && 'active'
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
            <div className="my-4 border-t border-[var(--border)]" />
            <div className="space-y-1">
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'nav-item',
                    pathname === item.href && 'active'
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
      <div className="p-4 border-t border-[var(--border)] space-y-4">
        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-3 bg-bg-base border border-[var(--border)] rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
          aria-label={theme === 'electric' ? 'Warm 모드로 전환' : 'Electric 모드로 전환'}
        >
          {theme === 'electric' ? (
            <>
              <Coffee size={16} strokeWidth={1.5} />
              <span>Warm Mode</span>
            </>
          ) : (
            <>
              <Zap size={16} strokeWidth={1.5} />
              <span>Electric Mode</span>
            </>
          )}
        </button>

        {/* 유저 정보 */}
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text truncate">{user.name}</div>
                <span className="user-level">
                  {getMemberLevel(user.total_participations ?? 0, user.is_new_member ?? true).displayText}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="nav-item w-full justify-center"
            >
              <LogOut size={16} strokeWidth={1.5} />
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="btn-primary block w-full text-center text-sm"
          >
            멤버십 입장
          </Link>
        )}
      </div>
    </aside>
  )
}
