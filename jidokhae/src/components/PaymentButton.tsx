'use client'

/**
 * 결제 버튼 컴포넌트
 * WP-M2 Phase 2: 결제 연동 (포트원)
 *
 * M2-007: 신청하기 버튼 활성화
 * M2-013: 결제 팝업 호출
 * M2-014~015: 결제 완료 처리
 * M2-017: 결제 완료 화면
 * M2-018~019: 결제 실패 처리
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { generateIdempotencyKey, PAYMENT_MESSAGES } from '@/lib/payment'
import type { Meeting, User, PreparePaymentResponse } from '@/types/database'

// 포트원 SDK 타입
declare global {
  interface Window {
    PortOne?: {
      requestPayment: (options: PortOnePaymentRequest) => Promise<PortOnePaymentResponse>
    }
  }
}

interface PortOnePaymentRequest {
  storeId: string
  channelKey: string
  paymentId: string
  orderName: string
  totalAmount: number
  currency: string
  payMethod: string
  customer?: {
    email?: string
    phoneNumber?: string
    fullName?: string
  }
  redirectUrl?: string
}

interface PortOnePaymentResponse {
  code?: string
  message?: string
  paymentId?: string
  transactionType?: string
}

interface PaymentButtonProps {
  meeting: Meeting
  user: User | null
  disabled?: boolean
  className?: string
}

export default function PaymentButton({
  meeting,
  user,
  disabled = false,
  className = '',
}: PaymentButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 결제 처리
  const handlePayment = async () => {
    if (!user) {
      router.push(`/auth/login?redirectTo=/meetings/${meeting.id}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. 결제 준비 API 호출
      const prepareRes = await fetch('/api/registrations/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      })

      const prepareData = await prepareRes.json()
      const prepareResult = prepareData.data as PreparePaymentResponse

      if (!prepareResult.success) {
        setError(prepareResult.message)
        setIsLoading(false)

        // 대기 신청 안내
        if (prepareResult.message.includes('대기')) {
          const confirmWait = window.confirm(prepareResult.message)
          if (confirmWait) {
            router.push(`/meetings/${meeting.id}/waitlist`)
          }
        }
        return
      }

      const { registrationId, amount, meetingTitle } = prepareResult

      // 무료 모임인 경우 바로 완료 처리
      if (!amount || amount === 0) {
        await completePayment(registrationId!, 'FREE_' + Date.now(), 'free', 0)
        return
      }

      // 2. 포트원 결제 SDK 호출 (M2-013)
      if (!window.PortOne) {
        // 포트원 SDK가 로드되지 않은 경우 수동 처리
        console.warn('PortOne SDK not loaded, falling back to test mode')
        // 테스트 모드: 바로 완료 처리 (개발용)
        if (process.env.NODE_ENV === 'development') {
          const testPaymentId = `TEST_${Date.now()}`
          await completePayment(registrationId!, testPaymentId, 'test', amount!)
          return
        }
        setError('결제 시스템을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        await cancelPending(registrationId!)
        setIsLoading(false)
        return
      }

      const idempotencyKey = generateIdempotencyKey(user.id, meeting.id)
      const paymentId = `payment_${registrationId}_${Date.now()}`

      const paymentResponse = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '',
        paymentId,
        orderName: meetingTitle || meeting.title,
        totalAmount: amount!,
        currency: 'KRW',
        payMethod: 'EASY_PAY', // 카카오페이, 토스페이 등
        customer: {
          email: user.email,
          phoneNumber: user.phone || undefined,
          fullName: user.name,
        },
        redirectUrl: `${window.location.origin}/meetings/${meeting.id}/payment-result`,
      })

      // 3. 결제 결과 처리
      if (paymentResponse.code) {
        // 결제 실패/취소 (M2-018~019)
        console.error('Payment failed:', paymentResponse.code, paymentResponse.message)
        await cancelPending(registrationId!, paymentResponse.code === 'PAY_PROCESS_CANCELED' ? 'user_cancelled' : 'payment_failed')

        if (paymentResponse.code === 'PAY_PROCESS_CANCELED') {
          setError(PAYMENT_MESSAGES.CANCELLED)
        } else {
          setError(PAYMENT_MESSAGES.FAILED)
        }
        setIsLoading(false)
        return
      }

      // 결제 성공 (M2-014~017)
      await completePayment(registrationId!, paymentResponse.paymentId || paymentId, 'portone', amount!, idempotencyKey)
    } catch (err) {
      console.error('Payment error:', err)
      setError('결제 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 결제 완료 처리
  const completePayment = async (
    registrationId: string,
    paymentId: string,
    paymentMethod: string,
    amount: number,
    idempotencyKey?: string
  ) => {
    try {
      const completeRes = await fetch('/api/registrations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          paymentId,
          paymentMethod,
          amount,
          idempotencyKey,
        }),
      })

      const completeData = await completeRes.json()

      if (completeData.data?.success) {
        // 성공 (M2-017)
        router.push(`/meetings/${meeting.id}/payment-complete`)
        router.refresh()
      } else {
        setError(completeData.data?.message || '결제 완료 처리 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Complete payment error:', err)
      setError('결제 완료 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // Pending 취소 처리
  const cancelPending = async (registrationId: string, reason?: string) => {
    try {
      await fetch('/api/registrations/cancel-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, reason }),
      })
    } catch (err) {
      console.error('Cancel pending error:', err)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? '처리 중...' : user ? '신청하기' : '로그인 후 신청'}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
