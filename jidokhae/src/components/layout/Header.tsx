'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType } from '@/types/database'

interface HeaderProps {
  user: UserType | null
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const navItems = [
    { href: '/', label: '홈' },
    { href: '/meetings', label: '모임 일정' },
  ]

  const userItems = user
    ? [
        { href: '/mypage', label: '마이페이지', icon: User },
        ...(isAdmin ? [{ href: '/admin', label: '관리자', icon: BookOpen }] : []),
      ]
    : []

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-warm-100">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-xl text-warm-900">지독해</span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'text-brand-600'
                  : 'text-warm-600 hover:text-warm-900'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* 데스크톱 유저 메뉴 */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {userItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-brand-600'
                      : 'text-warm-600 hover:text-warm-900'
                  )}
                >
                  {item.icon && <item.icon size={16} />}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-warm-500 hover:text-warm-700 transition-colors"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary">
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-warm-600"
          aria-label="메뉴"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-warm-100">
          <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'block py-2 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'text-brand-600'
                    : 'text-warm-600'
                )}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-warm-100" />
            {user ? (
              <>
                {userItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 py-2 text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'text-brand-600'
                        : 'text-warm-600'
                    )}
                  >
                    {item.icon && <item.icon size={18} />}
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-base font-medium text-warm-500"
                >
                  <LogOut size={18} />
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-base font-medium text-brand-600"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

