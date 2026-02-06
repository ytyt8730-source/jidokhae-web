'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { MICROCOPY } from '@/lib/constants/microcopy'

type Step = 'info' | 'phone' | 'otp' | 'complete'

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('info')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const supabase = createClient()

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setError('')

    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  // Step 1: 기본 정보 검증
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
    if (!specialCharRegex.test(formData.password)) {
      setError('비밀번호에 특수문자를 1개 이상 포함해주세요.')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setStep('phone')
  }

  // Step 2: OTP 발송
  const handleSendOtp = useCallback(async () => {
    const phoneNumbers = formData.phone.replace(/\D/g, '')
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
        // 로그인이 필요하다는 에러는 무시하고 진행 (회원가입 전이므로)
        if (response.status === 401) {
          // 회원가입 시에는 로그인 없이도 OTP 발송 가능하도록 별도 API 사용
          const signupResponse = await fetch('/api/auth/phone/send-otp-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumbers }),
          })

          const signupData = await signupResponse.json()

          if (!signupResponse.ok) {
            setError(signupData.error || '인증번호 발송에 실패했습니다.')
            return
          }

          if (signupData.devOtp) {
            setDevOtp(signupData.devOtp)
          }

          setStep('otp')
          setCountdown(300)
          setOtp('')
          return
        }

        setError(data.error || '인증번호 발송에 실패했습니다.')
        return
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp)
      }

      setStep('otp')
      setCountdown(300)
      setOtp('')
    } catch {
      setError('인증번호 발송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [formData.phone])

  // Step 3: OTP 검증 및 회원가입 완료
  const handleVerifyAndSignup = async () => {
    if (otp.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const phoneNumbers = formData.phone.replace(/\D/g, '')

      // OTP 검증 (회원가입용)
      const verifyResponse = await fetch('/api/auth/phone/verify-otp-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumbers, otp }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setError(verifyData.error || '인증에 실패했습니다.')
        return
      }

      // Supabase Auth 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: phoneNumbers,
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

      // users 테이블에 저장 (Trigger 백업)
      if (authData.user) {
        await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: phoneNumbers,
            phone_verified: true,
            role: 'member',
            is_new_member: true,
          }, { onConflict: 'id' })
      }

      setStep('complete')

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

  // 재발송
  const handleResend = () => {
    if (countdown > 0) return
    setOtp('')
    setDevOtp(null)
    handleSendOtp()
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
            회원가입 완료!
          </h2>
          <p className="text-gray-600">
            이메일 인증 후 로그인해주세요.
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
          <h1 className="text-2xl font-bold heading-themed text-brand-800 mb-2">
            {MICROCOPY.buttons.signup}
          </h1>
          <p className="text-gray-600">
            {step === 'info' && MICROCOPY.alerts.welcomeNew}
            {step === 'phone' && '알림 수신을 위해 전화번호를 인증해주세요.'}
            {step === 'otp' && '문자로 발송된 인증번호를 입력해주세요.'}
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['info', 'phone', 'otp'].map((s, i) => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full transition-colors ${
                ['info', 'phone', 'otp'].indexOf(step) >= i
                  ? 'bg-brand-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
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

          {/* Step 1: 기본 정보 입력 */}
          {step === 'info' && (
            <form onSubmit={handleInfoSubmit} className="space-y-5">
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
                  autoFocus
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

              <Button type="submit" className="w-full">
                <span>다음</span>
                <ArrowRight size={18} strokeWidth={1.5} />
              </Button>
            </form>
          )}

          {/* Step 2: 전화번호 입력 */}
          {step === 'phone' && (
            <div className="space-y-5">
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                  strokeWidth={1.5}
                />
                <Input
                  type="tel"
                  name="phone"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-11"
                  maxLength={13}
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500">
                전화번호는 모임 알림 및 긴급 연락 시에만 사용됩니다.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex items-center justify-center gap-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                  이전
                </button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSendOtp}
                  isLoading={isLoading}
                  disabled={formData.phone.replace(/\D/g, '').length !== 11}
                >
                  <span>인증번호 받기</span>
                  <ArrowRight size={18} strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: OTP 입력 */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{formData.phone}</span>로 발송된 인증번호
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
                  onClick={handleVerifyAndSignup}
                  isLoading={isLoading}
                  disabled={otp.length !== 6 || countdown === 0}
                >
                  가입 완료
                </Button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setOtp('')
                      setDevOtp(null)
                    }}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-lg transition-colors"
                  >
                    번호 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
                      countdown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    다시 받기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 구분선 */}
          {step === 'info' && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-center text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
                  로그인
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
