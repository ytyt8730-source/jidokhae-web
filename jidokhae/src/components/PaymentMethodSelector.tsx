'use client'

/**
 * 결제 방식 선택 컴포넌트
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * M5-040: 결제 방식 선택 UI 표시
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Building2, ArrowLeft, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import IneligibilityModal from '@/components/IneligibilityModal'
import TransferInfo from '@/components/TransferInfo'
import {
  generateTransferSenderName,
  calculateTransferDeadline,
  TRANSFER_BANK_NAME,
  TRANSFER_ACCOUNT_NUMBER,
} from '@/lib/transfer'
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

type PaymentMethod = 'easy' | 'transfer'

interface PaymentMethodSelectorProps {
  meeting: Meeting
  user: User
  onClose?: () => void
}

export default function PaymentMethodSelector({
  meeting,
  user,
  onClose,
}: PaymentMethodSelectorProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('easy')
  const [step, setStep] = useState<'select' | 'transfer'>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)
  const [showIneligibilityModal, setShowIneligibilityModal] = useState(false)

  // 계좌이체 정보
  const senderName = generateTransferSenderName(user.name)
  const deadline = calculateTransferDeadline()

  // 계좌이체 설정 확인
  const isTransferAvailable = Boolean(TRANSFER_BANK_NAME && TRANSFER_ACCOUNT_NUMBER)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // 결제 준비 API 호출
  const preparePayment = async () => {
    const res = await fetch('/api/registrations/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: meeting.id }),
    })
    const data = await res.json()
    return data.data as PreparePaymentResponse
  }

  // Pending 취소
  const cancelPending = async (registrationId: string, reason?: string) => {
    try {
      await fetch('/api/registrations/cancel-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, reason }),
      })
    } catch {
      // 무시
    }
  }

  // 간편결제 처리 (기존 PaymentButton 로직)
  const handleEasyPayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const prepareResult = await preparePayment()

      if (!prepareResult.success) {
        // 자격 부족 에러 시 모달 표시
        if (prepareResult.message?.includes('자격')) {
          setShowIneligibilityModal(true)
          setIsLoading(false)
          return
        }
        setError(prepareResult.message)
        setIsLoading(false)
        return
      }

      const { registrationId, amount, meetingTitle } = prepareResult

      // 무료 모임
      if (!amount || amount === 0) {
        await completeEasyPayment(registrationId!, 'FREE_' + Date.now(), 'free', 0)
        return
      }

      // 포트원 SDK 호출
      if (!window.PortOne) {
        if (process.env.NODE_ENV === 'development') {
          const testPaymentId = `TEST_${Date.now()}`
          await completeEasyPayment(registrationId!, testPaymentId, 'test', amount!)
          return
        }
        setError('결제 시스템을 불러오는 중입니다.')
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
        payMethod: 'EASY_PAY',
        customer: {
          email: user.email,
          phoneNumber: user.phone || undefined,
          fullName: user.name,
        },
        redirectUrl: `${window.location.origin}/meetings/${meeting.id}/payment-result`,
      })

      if (paymentResponse.code) {
        await cancelPending(registrationId!, paymentResponse.code === 'PAY_PROCESS_CANCELED' ? 'user_cancelled' : 'payment_failed')
        if (paymentResponse.code === 'PAY_PROCESS_CANCELED') {
          setError(PAYMENT_MESSAGES.CANCELLED)
        } else {
          setError(PAYMENT_MESSAGES.FAILED)
        }
        setIsLoading(false)
        return
      }

      await completeEasyPayment(registrationId!, paymentResponse.paymentId || paymentId, 'portone', amount!, idempotencyKey)
    } catch {
      setError('결제 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 간편결제 완료
  const completeEasyPayment = async (
    registrationId: string,
    paymentId: string,
    paymentMethod: string,
    amount: number,
    idempotencyKey?: string
  ) => {
    try {
      const res = await fetch('/api/registrations/complete', {
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

      const data = await res.json()

      if (data.data?.success) {
        // PRD: 결제 완료 → Toast 메시지 + 모달 닫기
        showToast('참여 확정!', 'success')
        onClose?.()
        router.refresh()
      } else {
        setError(data.data?.message || '결제 완료 처리 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    } catch {
      setError('결제 완료 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 계좌이체 확인 (M5-044)
  const handleTransferConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/registrations/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          senderName,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // 입금대기 완료 화면으로 이동
        router.push(`/meetings/${meeting.id}/transfer-pending?registrationId=${data.data.registrationId}`)
        router.refresh()
      } else {
        setError(data.error?.message || '신청 처리 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    } catch {
      setError('신청 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 다음 단계로 이동
  const handleNext = () => {
    if (selectedMethod === 'easy') {
      handleEasyPayment()
    } else {
      setStep('transfer')
    }
  }

  // 입금 확인 버튼 클릭 시 확인 모달
  const handleTransferClick = () => {
    setShowTransferConfirm(true)
  }

  // 확인 모달에서 확인 클릭
  const handleConfirmTransfer = () => {
    setShowTransferConfirm(false)
    handleTransferConfirm()
  }

  return (
    <div className="space-y-6">
      {step === 'select' ? (
        <>
          {/* 결제 방식 선택 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-brand-800">결제 방식 선택</h3>

            {/* 간편결제 */}
            <label
              className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                ${selectedMethod === 'easy'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="easy"
                checked={selectedMethod === 'easy'}
                onChange={() => setSelectedMethod('easy')}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                ${selectedMethod === 'easy' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                <CreditCard size={20} strokeWidth={1.5} className={selectedMethod === 'easy' ? 'text-brand-600' : 'text-gray-500'} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${selectedMethod === 'easy' ? 'text-brand-700' : 'text-brand-800'}`}>
                  간편결제
                </p>
                <p className="text-sm text-gray-500">카카오페이</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === 'easy' ? 'border-brand-500' : 'border-gray-300'}`}>
                {selectedMethod === 'easy' && (
                  <div className="w-3 h-3 rounded-full bg-brand-500" />
                )}
              </div>
            </label>

            {/* 계좌이체 */}
            <label
              className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                ${!isTransferAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                ${selectedMethod === 'transfer'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="transfer"
                checked={selectedMethod === 'transfer'}
                onChange={() => isTransferAvailable && setSelectedMethod('transfer')}
                className="sr-only"
                disabled={!isTransferAvailable}
              />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                ${selectedMethod === 'transfer' ? 'bg-brand-100' : 'bg-gray-100'}`}>
                <Building2 size={20} strokeWidth={1.5} className={selectedMethod === 'transfer' ? 'text-brand-600' : 'text-gray-500'} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${selectedMethod === 'transfer' ? 'text-brand-700' : 'text-brand-800'}`}>
                  계좌이체
                </p>
                <p className="text-sm text-gray-500">
                  {isTransferAvailable ? '직접 계좌로 입금' : '현재 이용 불가'}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === 'transfer' ? 'border-brand-500' : 'border-gray-300'}`}>
                {selectedMethod === 'transfer' && (
                  <div className="w-3 h-3 rounded-full bg-brand-500" />
                )}
              </div>
            </label>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={18} strokeWidth={1.5} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            {onClose && (
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoading}
              isLoading={isLoading}
              className="flex-1"
            >
              {selectedMethod === 'easy' ? '결제하기' : '다음'}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* 뒤로 가기 */}
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            결제 방식 다시 선택
          </button>

          {/* 계좌이체 정보 */}
          <TransferInfo
            senderName={senderName}
            amount={meeting.fee}
            deadline={deadline}
            onConfirmTransfer={handleTransferClick}
            isLoading={isLoading}
          />

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={18} strokeWidth={1.5} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </>
      )}

      {/* 입금 확인 모달 */}
      {showTransferConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTransferConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-brand-800 mb-2">입금 확인</h3>
            <p className="text-gray-600 mb-4">
              입금을 완료하셨나요?<br />
              확인 후 참가 신청이 완료됩니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowTransferConfirm(false)}
                className="flex-1"
              >
                아니요
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                className="flex-1"
              >
                네, 입금했습니다
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 자격 부족 모달 */}
      <IneligibilityModal
        isOpen={showIneligibilityModal}
        onClose={() => setShowIneligibilityModal(false)}
        lastRegularMeetingAt={user.last_regular_meeting_at}
        daysRemaining={null}
      />
    </div>
  )
}
