'use client'

/**
 * 입금대기 취소 버튼 컴포넌트
 * MX-C02: 입금대기 상태에서 취소
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface TransferCancelButtonProps {
  registrationId: string
  meetingTitle: string
  variant?: 'primary' | 'secondary' | 'text'
}

export default function TransferCancelButton({
  registrationId,
  meetingTitle,
  variant = 'secondary',
}: TransferCancelButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/registrations/cancel-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const data = await res.json()

      if (data.success && data.data?.success) {
        router.push('/mypage')
        router.refresh()
      } else {
        alert(data.data?.message || data.error?.message || '취소 처리 중 오류가 발생했습니다.')
      }
    } catch {
      alert('취소 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-500 hover:text-red-600 underline"
        >
          신청 취소
        </button>

        {showConfirm && (
          <ConfirmModal
            meetingTitle={meetingTitle}
            isLoading={isLoading}
            onCancel={() => setShowConfirm(false)}
            onConfirm={handleCancel}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Button
        variant={variant === 'primary' ? 'danger' : 'secondary'}
        onClick={() => setShowConfirm(true)}
        className="w-full"
      >
        신청 취소
      </Button>

      {showConfirm && (
        <ConfirmModal
          meetingTitle={meetingTitle}
          isLoading={isLoading}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleCancel}
        />
      )}
    </>
  )
}

// 확인 모달 컴포넌트
function ConfirmModal({
  meetingTitle,
  isLoading,
  onCancel,
  onConfirm,
}: {
  meetingTitle: string
  isLoading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-lg font-semibold text-brand-800 mb-2">신청 취소</h3>
        <p className="text-gray-600 mb-2">
          <span className="font-medium">{meetingTitle}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          입금 전 취소이므로 환불 절차 없이 바로 취소됩니다.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            돌아가기
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            취소하기
          </Button>
        </div>
      </div>
    </div>
  )
}
