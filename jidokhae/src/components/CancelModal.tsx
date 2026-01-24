'use client'

/**
 * 취소 모달 컴포넌트
 * M2-022~032: 취소/환불 처리
 * M5-048: 계좌이체 건 취소 시 환불 계좌 입력
 *
 * M2-023: 마음 돌리기 화면 표시
 * M2-029: 취소 사유 필수 입력
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import RefundAccountModal from '@/components/RefundAccountModal'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday, getRefundPercentText } from '@/lib/payment'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import { createLogger } from '@/lib/logger'
import type { Meeting, Registration, RefundRule, RefundAccountInfo } from '@/types/database'

const logger = createLogger('payment')

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  meeting: Meeting
  registration: Registration
  refundRules: RefundRule[]
}

const CANCEL_REASONS = [
  { value: 'schedule_conflict', label: '일정이 변경되었어요' },
  { value: 'personal_reason', label: '개인 사정이 생겼어요' },
  { value: 'health_issue', label: '건강 문제가 생겼어요' },
  { value: 'other', label: '기타' },
]

export default function CancelModal({
  isOpen,
  onClose,
  meeting,
  registration,
  refundRules,
}: CancelModalProps) {
  const router = useRouter()
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRefundAccountModal, setShowRefundAccountModal] = useState(false)

  // 계좌이체 결제이고 이미 입금 확인된 경우 환불 계좌 입력 필요 (M5-048)
  const isTransferPayment = registration.payment_method === 'transfer'
  const isPaid = registration.payment_status === 'paid'
  const needsRefundAccount = isTransferPayment && isPaid

  const dday = getDday(meeting.datetime)
  const refundPercent = getRefundPercentText(new Date(meeting.datetime), refundRules)
  const paymentAmount = registration.payment_amount || meeting.fee
  const refundAmount = Math.floor(paymentAmount * (parseInt(refundPercent) / 100))

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleCancel = async () => {
    // 취소 사유 필수 확인 (M2-029)
    if (!selectedReason) {
      setError('취소 사유를 선택해주세요')
      return
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('취소 사유를 입력해주세요')
      return
    }

    // 계좌이체 결제이고 이미 결제 완료된 경우 환불 계좌 입력 모달 표시 (M5-048)
    if (needsRefundAccount) {
      setShowRefundAccountModal(true)
      return
    }

    await processCancellation()
  }

  // 실제 취소 처리 로직
  const processCancellation = async () => {
    setIsLoading(true)
    setError('')

    try {
      const cancelReason = selectedReason === 'other'
        ? customReason
        : CANCEL_REASONS.find(r => r.value === selectedReason)?.label || selectedReason

      const res = await fetch('/api/registrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          cancelReason,
        }),
      })

      const data = await res.json()

      if (data.data?.success) {
        onClose()
        router.refresh()
        alert(data.data.message)
      } else {
        setError(data.data?.message || '취소 처리 중 오류가 발생했습니다')
      }
    } catch (err) {
      logger.error('Cancel error', { error: err instanceof Error ? err.message : 'Unknown' })
      setError('취소 처리 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 환불 계좌 입력 후 취소 처리 (M5-049)
  const handleRefundAccountSubmit = async (refundInfo: RefundAccountInfo) => {
    setIsLoading(true)
    setError('')

    try {
      // 환불 계좌 저장 API 호출
      const res = await fetch('/api/registrations/transfer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          refundInfo,
        }),
      })

      const data = await res.json()

      if (data.data?.success) {
        setShowRefundAccountModal(false)
        onClose()
        router.refresh()
        alert('환불 신청이 완료되었습니다. 영업일 기준 1~2일 내 환불됩니다.')
      } else {
        setError(data.data?.message || '환불 계좌 저장 중 오류가 발생했습니다')
      }
    } catch (err) {
      logger.error('Refund account save error', { error: err instanceof Error ? err.message : 'Unknown' })
      setError('환불 계좌 저장 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-brand-800">마음 돌리기</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* 본문 */}
              <div className="p-4 space-y-4">
                {/* 모임 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-brand-800">{meeting.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar size={14} strokeWidth={1.5} />
                        <span>{formatMeetingDate(meeting.datetime)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
                      {dday}
                    </span>
                  </div>
                </div>

                {/* 환불 정보 */}
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertCircle size={16} strokeWidth={1.5} />
                    <span className="text-sm font-medium">환불 안내</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">결제 금액</span>
                      <span className="text-brand-800">{formatFee(paymentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">환불율</span>
                      <span className="text-brand-800">{refundPercent}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-amber-200">
                      <span className="text-gray-700">환불 예정 금액</span>
                      <span className="text-amber-700">{formatFee(refundAmount)}</span>
                    </div>
                  </div>
                  {/* 계좌이체 결제인 경우 안내 (M5-048) */}
                  {needsRefundAccount && (
                    <p className="text-xs text-amber-600 mt-3 pt-2 border-t border-amber-200">
                      계좌이체 결제는 환불 계좌 입력이 필요합니다.
                    </p>
                  )}
                </div>

                {/* 취소 사유 선택 (M2-029) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    취소 사유 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedReason === reason.value
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="sr-only"
                        />
                        <span className={`text-sm ${
                          selectedReason === reason.value ? 'text-brand-700' : 'text-gray-700'
                        }`}>
                          {reason.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === 'other' && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="취소 사유를 입력해주세요"
                      className="w-full mt-2 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                      rows={3}
                    />
                  )}
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertCircle size={16} strokeWidth={1.5} />
                    {error}
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="p-4 border-t border-gray-100 space-y-2">
                <Button
                  onClick={handleCancel}
                  isLoading={isLoading}
                  variant="secondary"
                  className="w-full !bg-red-50 !text-red-600 hover:!bg-red-100"
                >
                  취소하기
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="w-full"
                >
                  닫기 (마음 돌리기)
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* 환불 계좌 입력 모달 (M5-048) */}
      <RefundAccountModal
        isOpen={showRefundAccountModal}
        onClose={() => setShowRefundAccountModal(false)}
        onSubmit={handleRefundAccountSubmit}
        refundAmount={refundAmount}
        isLoading={isLoading}
      />
    </AnimatePresence>
  )
}
