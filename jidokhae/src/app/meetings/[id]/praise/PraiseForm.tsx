'use client'

/**
 * 칭찬하기 폼 컴포넌트
 * M4 소속감 - Phase 2
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, Check } from 'lucide-react'
import { PRAISE_PHRASES } from '@/lib/praise'
import Button from '@/components/ui/Button'

interface Participant {
  id: string
  name: string
}

interface PraiseFormProps {
  meetingId: string
  participants: Participant[]
}

export default function PraiseForm({ meetingId, participants }: PraiseFormProps) {
  const router = useRouter()
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedPerson || !selectedPhrase) {
      setError('참가자와 칭찬 문구를 모두 선택해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/praises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          receiverId: selectedPerson,
          phraseId: selectedPhrase,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const badges = data.data?.awardedBadges || []
        const badgesParam = badges.length > 0 ? `?badges=${encodeURIComponent(badges.join(','))}` : ''
        router.push(`/meetings/${meetingId}/praise/complete${badgesParam}`)
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
      {/* 참가자 선택 */}
      <div>
        <h3 className="font-medium text-brand-800 mb-3">
          함께했던 분들
        </h3>
        <div className="space-y-2">
          {participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => setSelectedPerson(participant.id)}
              disabled={isSubmitting}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between ${
                selectedPerson === participant.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <span className="font-medium text-brand-800">
                {participant.name}
              </span>
              {selectedPerson === participant.id && (
                <Check size={20} strokeWidth={1.5} className="text-brand-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 칭찬 문구 선택 */}
      <div>
        <h3 className="font-medium text-brand-800 mb-3">
          어떤 마음을 전할까요?
        </h3>
        <div className="space-y-2">
          {PRAISE_PHRASES.map((phrase) => (
            <button
              key={phrase.id}
              onClick={() => setSelectedPhrase(phrase.id)}
              disabled={isSubmitting}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between ${
                selectedPhrase === phrase.id
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <span className="text-gray-700">
                {phrase.text}
              </span>
              {selectedPhrase === phrase.id && (
                <Heart size={20} strokeWidth={1.5} className="text-yellow-500 fill-yellow-500" />
              )}
            </button>
          ))}
        </div>
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
        disabled={!selectedPerson || !selectedPhrase || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} strokeWidth={1.5} className="mr-2 animate-spin" />
            전송 중...
          </>
        ) : (
          <>
            <Heart size={20} strokeWidth={1.5} className="mr-2" />
            칭찬 보내기
          </>
        )}
      </Button>
    </div>
  )
}
