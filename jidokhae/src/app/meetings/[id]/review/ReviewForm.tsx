'use client'

/**
 * 후기 작성 폼 컴포넌트
 * M4 소속감 - Phase 2
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine, Loader2, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ReviewFormProps {
  meetingId: string
}

export default function ReviewForm({ meetingId }: ReviewFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      setError('후기는 10자 이상 작성해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          content,
          isPublic,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/meetings/${meetingId}/review/complete`)
      } else {
        setError(data.error?.message || '처리 중 오류가 발생했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* 후기 입력 */}
      <div>
        <label htmlFor="content" className="block font-medium text-brand-800 mb-2">
          후기 내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="모임에서 인상 깊었던 점, 좋았던 점을 자유롭게 적어주세요."
          rows={6}
          maxLength={1000}
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-0 text-brand-800 placeholder-gray-400 resize-none disabled:opacity-50"
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>최소 10자</span>
          <span>{content.length}/1000</span>
        </div>
      </div>

      {/* 공개 동의 */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          disabled={isSubmitting}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          <span className="font-medium flex items-center gap-1">
            <Eye size={14} strokeWidth={1.5} />
            후기 공개에 동의합니다
          </span>
          <span className="block text-gray-500 mt-1">
            동의하시면 랜딩 페이지에 익명으로 후기가 게시될 수 있습니다.
          </span>
        </label>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {/* 제출 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={content.trim().length < 10 || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} strokeWidth={1.5} className="mr-2 animate-spin" />
            등록 중...
          </>
        ) : (
          <>
            <PenLine size={20} strokeWidth={1.5} className="mr-2" />
            후기 등록하기
          </>
        )}
      </Button>
    </div>
  )
}
