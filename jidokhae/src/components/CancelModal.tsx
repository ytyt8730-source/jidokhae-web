'use client'

/**
 * 취소 모달 컴포넌트
 * M2-022~032: 취소/환불 처리
 *
 * M2-023: 마음 돌리기 화면 표시
 * M2-029: 취소 사유 필수 입력
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday, getRefundPercentText } from '@/lib/payment'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import type { Meeting, Registration, RefundRule } from '@/types/database'

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
        // 성공 토스트 또는 알림
        alert(data.data.message)
      } else {
        setError(data.data?.message || '취소 처리 중 오류가 발생했습니다')
      }
    } catch (err) {
      console.error('Cancel error:', err)
      setError('취소 처리 중 오류가 발생했습니다')
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
              <div className="flex items-center justify-between p-4 border-b border-warm-100">
                <h2 className="text-lg font-semibold text-warm-900">마음 돌리기</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-warm-400 hover:text-warm-600 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 본문 */}
              <div className="p-4 space-y-4">
                {/* 모임 정보 */}
                <div className="bg-warm-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-warm-900">{meeting.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-warm-600">
                        <Calendar size={14} />
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
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">환불 안내</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-600">결제 금액</span>
                      <span className="text-warm-900">{formatFee(paymentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-600">환불율</span>
                      <span className="text-warm-900">{refundPercent}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-amber-200">
                      <span className="text-warm-700">환불 예정 금액</span>
                      <span className="text-amber-700">{formatFee(refundAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* 취소 사유 선택 (M2-029) */}
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">
                    취소 사유 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedReason === reason.value
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-warm-200 hover:border-warm-300'
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
                          selectedReason === reason.value ? 'text-brand-700' : 'text-warm-700'
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
                      className="w-full mt-2 p-3 border border-warm-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                      rows={3}
                    />
                  )}
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="p-4 border-t border-warm-100 space-y-2">
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
    </AnimatePresence>
  )
}
