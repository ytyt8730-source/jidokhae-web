'use client'

/**
 * 대기 취소 버튼 컴포넌트
 * MX-C01: 대기 취소 기능
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface WaitlistCancelButtonProps {
  waitlistId: string
  meetingTitle: string
}

export default function WaitlistCancelButton({
  waitlistId,
  meetingTitle,
}: WaitlistCancelButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/waitlists/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistId }),
      })

      const data = await res.json()

      if (data.success && data.data?.success) {
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

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setShowConfirm(true)}
        className="w-full sm:w-auto"
      >
        대기 취소
      </Button>
      <p className="text-xs text-gray-500 mt-3">
        현재 대기 중입니다. 자리가 생기면 알려드립니다.
      </p>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-brand-800 mb-2">
              대기 취소
            </h3>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{meetingTitle}</span> 모임의 대기를 취소하시겠습니까?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1"
              >
                아니요
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                isLoading={isLoading}
                className="flex-1"
              >
                대기 취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
