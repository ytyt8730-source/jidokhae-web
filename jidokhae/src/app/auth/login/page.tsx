'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { MICROCOPY } from '@/lib/constants/microcopy'

// 카카오 로고 SVG 컴포넌트
function KakaoLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.68 1.784 5.03 4.477 6.362l-.906 3.334c-.08.294.238.536.499.38l4.025-2.631c.636.086 1.287.135 1.905.135 5.523 0 10-3.464 10-7.691S17.523 3 12 3z"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)

  const supabase = createClient()

  // 이메일 로그인 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 카카오 로그인 핸들러 (M2-002, M2-003, M2-004)
  const handleKakaoLogin = async () => {
    setError('')
    setIsKakaoLoading(true)

    try {
      const { error: kakaoError } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            // 카카오 프로필 정보 요청 범위
            scope: 'profile_nickname profile_image account_email',
          },
        },
      })

      if (kakaoError) {
        setError('카카오 로그인 중 오류가 발생했습니다.')
        setIsKakaoLoading(false)
      }
      // 성공 시 카카오 로그인 페이지로 리다이렉트됨
    } catch {
      setError('카카오 로그인 중 오류가 발생했습니다.')
      setIsKakaoLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold heading-themed text-brand-800 mb-2">{MICROCOPY.buttons.login}</h1>
          <p className="text-gray-600">
            {MICROCOPY.alerts.welcomeBack}
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="card p-6 sm:p-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle size={18} strokeWidth={1.5} />
              {error}
            </div>
          )}

          {/* 카카오 로그인 버튼 (M2-001) */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isKakaoLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-medium rounded-xl transition-colors disabled:opacity-70"
          >
            <KakaoLogo className="w-5 h-5" />
            {isKakaoLoading ? '로그인 중...' : '카카오로 시작하기'}
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 이메일 로그인 폼 (M2-006 기존 기능 유지) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              isLoading={isLoading}
            >
              이메일로 로그인
            </Button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 회원가입 링크 */}
          <p className="text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-brand-600 font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

