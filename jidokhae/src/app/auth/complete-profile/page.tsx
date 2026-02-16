'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Phone, AlertCircle, User, CheckCircle, ArrowRight, AtSign } from 'lucide-react'
import { useNicknameCheck } from '@/hooks/useNicknameCheck'

type Step = 'phone' | 'otp' | 'complete'

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const { status: nicknameStatus, scheduleCheck: scheduleNicknameCheck } = useNicknameCheck()

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.preferred_username ||
          '사용자'
        setUserName(name)
      } else {
        router.push('/auth/login')
      }
    }
    getUser()
  }, [supabase, router])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 전화번호 포맷팅
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
    setError('')
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 6)
    setNickname(value)
    setError('')
    scheduleNicknameCheck(value)
  }

  // 인증번호 발송
  const handleSendOtp = useCallback(async () => {
    const nicknameTrimmed = nickname.trim()
    if (nicknameTrimmed.length < 2 || nicknameTrimmed.length > 6) {
      setError('닉네임은 2~6자 사이로 입력해주세요.')
      return
    }

    if (nicknameStatus === 'taken') {
      setError('이미 사용 중인 닉네임입니다.')
      return
    }

    const phoneNumbers = phone.replace(/\D/g, '')
    if (phoneNumbers.length !== 11) {
      setError('올바른 전화번호를 입력해주세요.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumbers }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증번호 발송에 실패했습니다.')
        return
      }

      // 개발 환경에서 테스트용 OTP 표시
      if (data.devOtp) {
        setDevOtp(data.devOtp)
      }

      setStep('otp')
      setCountdown(300) // 5분
      setOtp('')
    } catch {
      setError('인증번호 발송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [phone, nickname, nicknameStatus])

  // 인증번호 확인
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const phoneNumbers = phone.replace(/\D/g, '')
      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumbers, otp, nickname: nickname.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증에 실패했습니다.')
        return
      }

      setStep('complete')

      // 2초 후 다음 페이지로 이동
      setTimeout(() => {
        router.push(next)
        router.refresh()
      }, 2000)
    } catch {
      setError('인증 확인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 재발송
  const handleResend = () => {
    if (countdown > 0) return
    setStep('phone')
    setOtp('')
    setDevOtp(null)
  }

  // 완료 화면
  if (step === 'complete') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold heading-themed text-brand-800 mb-2">
            인증 완료!
          </h2>
          <p className="text-gray-600">잠시 후 이동합니다...</p>
        </div>
      </div>
    )
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
            {step === 'phone'
              ? '닉네임과 전화번호를 입력해주세요.'
              : '문자로 발송된 인증번호를 입력해주세요.'}
          </p>
        </div>

        {/* 폼 */}
        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle size={18} strokeWidth={1.5} />
              {error}
            </div>
          )}

          {/* 개발 환경 테스트용 OTP 표시 */}
          {devOtp && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-600">
              <CheckCircle size={18} strokeWidth={1.5} />
              [개발용] 인증번호: <strong>{devOtp}</strong>
            </div>
          )}

          {step === 'phone' ? (
            // Step 1: 전화번호 입력
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <AtSign
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <Input
                    type="text"
                    placeholder="닉네임 (2~6자, 다른 회원에게 표시)"
                    value={nickname}
                    onChange={handleNicknameChange}
                    className="pl-11"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {nicknameStatus === 'checking' && (
                  <p className="text-xs text-gray-400 mt-1">확인 중...</p>
                )}
                {nicknameStatus === 'available' && (
                  <p className="text-xs text-green-600 mt-1">사용 가능한 닉네임입니다.</p>
                )}
                {nicknameStatus === 'taken' && (
                  <p className="text-xs text-red-500 mt-1">이미 사용 중인 닉네임입니다.</p>
                )}
              </div>

              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                  strokeWidth={1.5}
                />
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

              <Button
                type="button"
                className="w-full"
                onClick={handleSendOtp}
                isLoading={isLoading}
                disabled={phone.replace(/\D/g, '').length !== 11 || nickname.trim().length < 2 || nicknameStatus === 'taken'}
              >
                <span>인증번호 받기</span>
                <ArrowRight size={18} strokeWidth={1.5} />
              </Button>
            </div>
          ) : (
            // Step 2: OTP 입력
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{phone}</span>로 발송된 인증번호
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="인증번호 6자리"
                  value={otp}
                  onChange={handleOtpChange}
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {countdown > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  남은 시간:{' '}
                  <span className="text-brand-600 font-medium">
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </p>
              )}

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  isLoading={isLoading}
                  disabled={otp.length !== 6 || countdown === 0}
                >
                  인증 확인
                </Button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={`w-full text-sm py-2 rounded-lg transition-colors ${countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                  다시 받기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
