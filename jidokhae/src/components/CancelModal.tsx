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
import { X, Calendar, AlertCircle, Users, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import RefundAccountModal from '@/components/RefundAccountModal'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday, getRefundPercentText } from '@/lib/payment'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import { createLogger } from '@/lib/logger'
import { MICROCOPY } from '@/lib/constants/microcopy'
import type { Meeting, Registration, RefundRule, RefundAccountInfo } from '@/types/database'

const logger = createLogger('payment')

/** 함께 참가하는 회원 정보 */
interface OtherParticipant {
  name: string
  nickname: string
}

interface CancelModalProps {
  isOpen: boolean
  onClose: () => void
  meeting: Meeting
  registration: Registration
  refundRules: RefundRule[]
  /** 함께 참가하는 다른 회원 목록 (마음 돌리기 설득용) */
  otherParticipants?: OtherParticipant[]
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
  otherParticipants = [],
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

  // 마음 돌리기 설득 요소 계산 (PRD 섹션 6)
  const meetingDate = new Date(meeting.datetime)
  const now = new Date()
  const daysUntilMeeting = Math.ceil(
    (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isSoonMeeting = daysUntilMeeting <= 3
  const remainingSpots = meeting.capacity - meeting.current_participants
  const hasOtherParticipants = otherParticipants.length > 0

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
            className="fixed inset-0 bg-black/50 z-modal-overlay"
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div className="bg-bg-surface rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <h2 id="cancel-modal-title" className="text-lg font-semibold text-brand-800">마음 돌리기</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* 본문 (스크롤 가능) */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* 마음 돌리기 설득 섹션 (PRD 섹션 6: 취소 마찰) */}
                {(hasOtherParticipants || isSoonMeeting || remainingSpots <= 2) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-2"
                  >
                    {/* 함께 참가하는 회원 */}
                    {hasOtherParticipants && (
                      <div className="flex items-center gap-2 text-sm text-brand-700">
                        <Users size={16} strokeWidth={1.5} className="text-brand-500" />
                        <span>
                          {MICROCOPY.cancel.persuasion.withOthers(
                            otherParticipants.slice(0, 3).map(p => p.nickname || p.name)
                          )}
                        </span>
                      </div>
                    )}

                    {/* 모임 임박 */}
                    {isSoonMeeting && (
                      <div className="flex items-center gap-2 text-sm text-brand-700">
                        <Clock size={16} strokeWidth={1.5} className="text-brand-500" />
                        <span className={daysUntilMeeting === 0 ? 'font-semibold' : ''}>
                          {MICROCOPY.cancel.persuasion.soonMeeting(daysUntilMeeting)}
                        </span>
                      </div>
                    )}

                    {/* 자리 거의 다 참 */}
                    {remainingSpots <= 2 && remainingSpots > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <AlertCircle size={16} strokeWidth={1.5} className="text-amber-500" />
                        <span>{MICROCOPY.cancel.persuasion.almostFull(remainingSpots)}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 모임 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-brand-800 line-clamp-2">{meeting.title}</h3>
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
              <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
                <Button
                  onClick={handleCancel}
                  isLoading={isLoading}
                  variant="secondary"
                  className="w-full !bg-red-50 !text-red-600 hover:!bg-red-100"
                >
                  {MICROCOPY.buttons.cancel}
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="w-full"
                >
                  {MICROCOPY.buttons.close}
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
