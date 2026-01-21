'use client'

/**
 * 참여 완료 선택 옵션 컴포넌트
 * M4 소속감 - Phase 1
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, CheckCircle, PenLine, Loader2 } from 'lucide-react'

interface FeedbackOptionsProps {
  meetingId: string
  registrationId: string
}

export default function FeedbackOptions({ meetingId, registrationId }: FeedbackOptionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePraise = () => {
    router.push(`/meetings/${meetingId}/praise`)
  }

  const handleConfirm = async () => {
    setIsLoading('confirm')
    try {
      const response = await fetch('/api/participations/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          method: 'confirm',
        }),
      })

      const data = await response.json()
      if (response.ok) {
        const badges = data.data?.awardedBadges || []
        const badgesParam = badges.length > 0 ? `?badges=${encodeURIComponent(badges.join(','))}` : ''
        router.push(`/meetings/${meetingId}/feedback/complete${badgesParam}`)
      } else {
        alert(data.error?.message || '처리 중 오류가 발생했습니다.')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleReview = () => {
    router.push(`/meetings/${meetingId}/review`)
  }

  return (
    <div className="p-6 sm:p-8 space-y-4">
      {/* 칭찬하기 */}
      <button
        onClick={handlePraise}
        disabled={isLoading !== null}
        className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Heart size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-warm-900 mb-1">
              칭찬하기
            </h3>
            <p className="text-sm text-warm-600">
              모임에서 좋았던 분에게 감사 전달
            </p>
          </div>
        </div>
      </button>

      {/* 참여했어요 */}
      <button
        onClick={handleConfirm}
        disabled={isLoading !== null}
        className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            {isLoading === 'confirm' ? (
              <Loader2 size={20} className="text-green-600 animate-spin" />
            ) : (
              <CheckCircle size={20} className="text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-warm-900 mb-1">
              참여했어요
            </h3>
            <p className="text-sm text-warm-600">
              그냥 참여 완료 처리만
            </p>
          </div>
        </div>
      </button>

      {/* 후기 남기기 */}
      <button
        onClick={handleReview}
        disabled={isLoading !== null}
        className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <PenLine size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-warm-900 mb-1">
              후기 남기기
            </h3>
            <p className="text-sm text-warm-600">
              모임 경험을 나눠주세요
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
