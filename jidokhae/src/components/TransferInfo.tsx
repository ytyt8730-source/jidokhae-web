'use client'

/**
 * 계좌이체 정보 표시 컴포넌트
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * M5-041: 계좌이체 선택 시 계좌 정보 표시
 * M5-042: 계좌번호 클립보드 복사
 * M5-043: 입금자명 클립보드 복사
 */

import { useState } from 'react'
import { Copy, Check, CreditCard, AlertCircle } from 'lucide-react'
import {
  TRANSFER_BANK_NAME,
  TRANSFER_ACCOUNT_NUMBER,
  TRANSFER_ACCOUNT_HOLDER,
  formatTransferDeadline,
  TRANSFER_MESSAGES,
} from '@/lib/transfer'

interface TransferInfoProps {
  senderName: string
  amount: number
  deadline: Date
  onConfirmTransfer: () => void
  isLoading?: boolean
}

export default function TransferInfo({
  senderName,
  amount,
  deadline,
  onConfirmTransfer,
  isLoading = false,
}: TransferInfoProps) {
  const [copiedField, setCopiedField] = useState<'account' | 'sender' | null>(null)

  const handleCopy = async (text: string, field: 'account' | 'sender') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const formatAmount = (value: number) => {
    return value.toLocaleString() + '원'
  }

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-center gap-2 text-gray-700">
        <CreditCard size={20} strokeWidth={1.5} className="text-brand-500" />
        <span className="font-medium">{TRANSFER_MESSAGES.PENDING_INFO}</span>
      </div>

      {/* 계좌 정보 카드 */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        {/* 은행명 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">은행</span>
          <span className="font-medium text-brand-800">{TRANSFER_BANK_NAME}</span>
        </div>

        {/* 계좌번호 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">계좌번호</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-brand-800 font-mono">
              {TRANSFER_ACCOUNT_NUMBER}
            </span>
            <button
              onClick={() => handleCopy(TRANSFER_ACCOUNT_NUMBER, 'account')}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="계좌번호 복사"
            >
              {copiedField === 'account' ? (
                <Check size={16} strokeWidth={1.5} className="text-green-500" />
              ) : (
                <Copy size={16} strokeWidth={1.5} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* 예금주 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">예금주</span>
          <span className="font-medium text-brand-800">{TRANSFER_ACCOUNT_HOLDER}</span>
        </div>

        {/* 구분선 */}
        <hr className="border-gray-200" />

        {/* 입금자명 (중요) */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">입금자명</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-600 font-mono text-lg">
              {senderName}
            </span>
            <button
              onClick={() => handleCopy(senderName, 'sender')}
              className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
              title="입금자명 복사"
            >
              {copiedField === 'sender' ? (
                <Check size={16} strokeWidth={1.5} className="text-green-500" />
              ) : (
                <Copy size={16} strokeWidth={1.5} className="text-brand-500" />
              )}
            </button>
          </div>
        </div>

        {/* 입금 금액 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">입금 금액</span>
          <span className="font-bold text-brand-800 text-lg">
            {formatAmount(amount)}
          </span>
        </div>
      </div>

      {/* 입금 기한 */}
      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
        <AlertCircle size={18} strokeWidth={1.5} className="text-orange-500 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-orange-800">
            <span className="font-medium">입금 기한:</span> {formatTransferDeadline(deadline)}
          </p>
          <p className="text-orange-600 text-xs mt-0.5">
            {TRANSFER_MESSAGES.DEADLINE_WARNING}
          </p>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 입금자명을 반드시 위와 같이 입력해주세요.</p>
        <p>• 입금자명이 다를 경우 확인이 지연될 수 있습니다.</p>
        <p>• 입금 확인 후 참가가 확정됩니다.</p>
      </div>

      {/* 입금 완료 버튼 */}
      <button
        onClick={onConfirmTransfer}
        disabled={isLoading}
        className="w-full py-4 bg-brand-600 text-white rounded-xl font-semibold
                   hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '처리 중...' : '입금했습니다'}
      </button>
    </div>
  )
}
