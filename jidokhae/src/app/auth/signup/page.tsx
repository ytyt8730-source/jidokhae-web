'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // 전화번호는 숫자만 허용
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [name]: digitsOnly }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // 유효성 검사
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    // 특수문자 포함 검사
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
    if (!specialCharRegex.test(formData.password)) {
      setError('비밀번호에 특수문자를 1개 이상 포함해주세요.')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      // Supabase Auth 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone || null,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      // 참고: users 테이블은 DB Trigger(handle_new_user)가 자동으로 생성합니다.
      // 아래 코드는 Trigger 실패 시 백업용이며, 에러가 발생해도 무시합니다.
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone || null,
            role: 'member',
            is_new_member: true,
          }, { onConflict: 'id' })

        if (insertError) {
          // Trigger가 이미 처리했거나 RLS 문제 - 로그만 남기고 진행
          console.warn('User upsert warning (may be handled by trigger):', insertError.message)
        }
      }

      setSuccess(true)
      
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold font-serif text-brand-800 mb-2">회원가입 완료!</h2>
          <p className="text-gray-600">
            잠시 후 로그인 페이지로 이동합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-serif text-brand-800 mb-2">회원가입</h1>
          <p className="text-gray-600">
            지독해와 함께 독서 여정을 시작하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle size={18} strokeWidth={1.5} />
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="text"
                name="name"
                placeholder="이름"
                value={formData.name}
                onChange={handleChange}
                className="pl-11"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                className="pl-11"
                required
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="tel"
                name="phone"
                placeholder="전화번호 (선택, 숫자만)"
                value={formData.phone}
                onChange={handleChange}
                className="pl-11"
                maxLength={11}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="password"
                name="password"
                placeholder="비밀번호 (8자 이상, 특수문자 포함)"
                value={formData.password}
                onChange={handleChange}
                className="pl-11"
                required
                minLength={8}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="pl-11"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              회원가입
            </Button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 로그인 링크 */}
          <p className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

