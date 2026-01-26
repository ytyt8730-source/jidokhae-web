'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Phone, AlertCircle, User } from 'lucide-react'

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')

  const supabase = createClient()

  useEffect(() => {
    // 현재 로그인된 사용자 정보 가져오기
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.preferred_username ||
          '사용자'
        setUserName(name)
      } else {
        // 로그인되지 않은 경우 로그인 페이지로
        router.push('/auth/login')
      }
    }
    getUser()
  }, [supabase, router])

  // 전화번호 포맷팅 (xxx-xxxx-xxxx)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // 전화번호 유효성 검사 (선택이므로 빈 값 허용)
    const phoneNumbers = phone.replace(/\D/g, '')
    if (phone && phoneNumbers.length !== 11) {
      setError('올바른 전화번호를 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인 정보를 찾을 수 없습니다.')
        setIsLoading(false)
        return
      }

      // 전화번호가 입력된 경우에만 저장
      if (phone) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ phone: phoneNumbers })
          .eq('id', user.id)

        if (updateError) {
          setError('전화번호 저장 중 오류가 발생했습니다.')
          setIsLoading(false)
          return
        }
      }

      // 다음 페이지로 이동
      router.push(next)
      router.refresh()
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-brand-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold heading-themed text-brand-800 mb-2">
            환영합니다, {userName}님!
          </h1>
          <p className="text-gray-600">
            모임 알림을 위해 전화번호를 입력해주세요.
            <br />
            <span className="text-sm text-gray-500">(선택사항)</span>
          </p>
        </div>

        {/* 폼 */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
              <Input
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-11"
                maxLength={13}
              />
            </div>

            <p className="text-xs text-gray-500">
              전화번호는 모임 알림 및 긴급 연락 시에만 사용됩니다.
            </p>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                {phone ? '저장하고 계속하기' : '계속하기'}
              </Button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                나중에 입력하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
