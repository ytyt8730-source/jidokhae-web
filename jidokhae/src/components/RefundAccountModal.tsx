'use client'

/**
 * 환불 계좌 입력 모달 컴포넌트
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * M5-048: 계좌이체 건 취소 시 환불 계좌 입력
 * M5-049: 환불 계좌 저장 성공
 */

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { KOREAN_BANKS, validateRefundAccount } from '@/lib/transfer'
import type { RefundAccountInfo } from '@/types/database'

interface RefundAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (refundInfo: RefundAccountInfo) => Promise<void>
  refundAmount: number
  isLoading?: boolean
}

export default function RefundAccountModal({
  isOpen,
  onClose,
  onSubmit,
  refundAmount,
  isLoading = false,
}: RefundAccountModalProps) {
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const refundInfo: Partial<RefundAccountInfo> = {
      bank,
      account: account.replace(/\s/g, ''),
      holder: holder.trim(),
    }

    const validation = validateRefundAccount(refundInfo)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    await onSubmit({
      ...refundInfo,
      requested_at: new Date().toISOString(),
    } as RefundAccountInfo)
  }

  const formatAmount = (value: number) => {
    return value.toLocaleString() + '콩'
  }

  if (!isOpen) return null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black/50 z-modal-overlay"
        onClick={onClose}
      />

    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">

      {/* 모달 */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-md shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-account-title"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 id="refund-account-title" className="text-lg font-semibold text-brand-800">환불 계좌 입력</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} strokeWidth={1.5} className="text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 안내 메시지 */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
            <AlertCircle size={18} strokeWidth={1.5} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p>계좌이체 결제 건은 수동으로 환불됩니다.</p>
              <p className="text-xs text-orange-600 mt-1">
                환불받을 계좌 정보를 정확히 입력해주세요.
              </p>
            </div>
          </div>

          {/* 환불 금액 */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">환불 예정 금액</span>
            <span className="text-xl font-bold text-brand-600">
              {formatAmount(refundAmount)}
            </span>
          </div>

          {/* 은행 선택 */}
          <div>
            <label htmlFor="refund-bank" className="block text-sm font-medium text-gray-700 mb-2">
              은행 선택
            </label>
            <select
              id="refund-bank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         bg-white text-brand-800"
              required
            >
              <option value="">은행을 선택하세요</option>
              {KOREAN_BANKS.map((b) => (
                <option key={b.code} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* 계좌번호 */}
          <div>
            <label htmlFor="refund-account" className="block text-sm font-medium text-gray-700 mb-2">
              계좌번호
            </label>
            <input
              id="refund-account"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="계좌번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         text-brand-800 placeholder:text-gray-400"
              required
            />
          </div>

          {/* 예금주 */}
          <div>
            <label htmlFor="refund-holder" className="block text-sm font-medium text-gray-700 mb-2">
              예금주
            </label>
            <input
              id="refund-holder"
              type="text"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="예금주명을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         text-brand-800 placeholder:text-gray-400"
              required
            />
          </div>

          {/* 에러 메시지 */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {/* 환불 소요 시간 */}
          <p className="text-xs text-gray-500 text-center">
            환불 소요: 영업일 기준 1~2일
          </p>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl
                         font-medium hover:bg-gray-50 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium
                         hover:bg-brand-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '환불 신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
