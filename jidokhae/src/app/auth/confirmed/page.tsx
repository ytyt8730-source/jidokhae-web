'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/auth/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-warm-900">
            이메일 확인 완료!
          </h1>
          <p className="text-warm-600">
            이메일 인증이 성공적으로 완료되었습니다.
            <br />
            이제 로그인하실 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-warm-500">
            {countdown}초 후 로그인 페이지로 이동합니다...
          </p>
          
          <Link
            href="/auth/login"
            className="btn-primary inline-block"
          >
            지금 로그인하기
          </Link>
        </div>
      </div>
    </div>
  )
}


