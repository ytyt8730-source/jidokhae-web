'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, BookOpen, Settings } from 'lucide-react'
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
    { href: '/about', label: '소개' },
  ]

  const userItems = user
    ? [
        { href: '/mypage', label: '마이페이지', icon: User },
        ...(isAdmin ? [{ href: '/admin', label: '관리자', icon: Settings }] : []),
      ]
    : []

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={16} strokeWidth={1.5} />
          </div>
          <span className="font-serif font-bold text-xl text-brand-800">지독해</span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'text-brand-600'
                  : 'text-gray-600 hover:text-gray-900'
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
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {item.icon && <item.icon size={16} strokeWidth={1.5} />}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm px-5 py-2.5">
              멤버십 입장
            </Link>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-600"
          aria-label="메뉴"
        >
          {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'block py-2 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'text-brand-600'
                    : 'text-gray-600'
                )}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-gray-100" />
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
                        : 'text-gray-600'
                    )}
                  >
                    {item.icon && <item.icon size={18} strokeWidth={1.5} />}
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-base font-medium text-gray-500"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-base font-medium text-brand-600"
              >
                멤버십 입장
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
