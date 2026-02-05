'use client'

/**
 * 결제 버튼 컴포넌트
 * WP-M2 Phase 2: 결제 연동 (포트원)
 * WP-M5 Phase 1: 계좌이체 결제 지원 추가
 *
 * M2-007: 신청하기 버튼 활성화
 * M2-013: 결제 팝업 호출
 * M2-014~015: 결제 완료 처리
 * M2-017: 결제 완료 화면
 * M2-018~019: 결제 실패 처리
 * M5-040: 결제 방식 선택 UI 표시
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import PaymentMethodSelector from '@/components/PaymentMethodSelector'
import IneligibilityModal from '@/components/IneligibilityModal'
import { useToast } from '@/components/ui/Toast'
import { generateIdempotencyKey, PAYMENT_MESSAGES } from '@/lib/payment'
import { MICROCOPY } from '@/lib/constants/microcopy'
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
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showIneligibilityModal, setShowIneligibilityModal] = useState(false)

  // 결제 버튼 클릭
  const handlePaymentClick = async () => {
    if (!user) {
      router.push(`/auth/login?redirectTo=/meetings/${meeting.id}`)
      return
    }

    // 무료 모임인 경우 바로 처리
    if (meeting.fee === 0) {
      await handleFreePayment()
      return
    }

    // 유료 모임: 결제 방식 선택 모달 표시
    setShowPaymentModal(true)
  }

  // 무료 모임 처리
  const handleFreePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const prepareRes = await fetch('/api/registrations/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      })

      const prepareData = await prepareRes.json()
      const prepareResult = prepareData.data as PreparePaymentResponse

      if (!prepareResult.success) {
        // 자격 부족 에러 시 모달 표시
        if (prepareResult.message?.includes('자격')) {
          setShowIneligibilityModal(true)
          setIsLoading(false)
          return
        }

        setError(prepareResult.message)
        setIsLoading(false)

        if (prepareResult.message?.includes('대기')) {
          const confirmWait = window.confirm(prepareResult.message)
          if (confirmWait) {
            router.push(`/meetings/${meeting.id}/waitlist`)
          }
        }
        return
      }

      await completePayment(prepareResult.registrationId!, 'FREE_' + Date.now(), 'free', 0)
    } catch {
      setError('처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 기존 결제 처리 (기존 코드 유지 - 레거시 지원용)
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

  // handlePayment 사용하지 않는 경고 방지
  void handlePayment

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
        // PRD: 결제 완료 → Toast 메시지 + 모달 닫기
        showToast('참여 확정!', 'success')
        setShowPaymentModal(false)
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
        onClick={handlePaymentClick}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? MICROCOPY.status.processing : user ? MICROCOPY.buttons.register : '로그인 후 신청'}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      {/* 결제 방식 선택 모달 (M5-040) */}
      {showPaymentModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-brand-800 mb-4">
                {meeting.title} 신청
              </h2>
              <PaymentMethodSelector
                meeting={meeting}
                user={user}
                onClose={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 자격 부족 모달 */}
      <IneligibilityModal
        isOpen={showIneligibilityModal}
        onClose={() => setShowIneligibilityModal(false)}
        lastRegularMeetingAt={user?.last_regular_meeting_at || null}
        daysRemaining={null}
      />
    </div>
  )
}
