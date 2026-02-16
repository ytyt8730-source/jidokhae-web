'use client'

/**
 * 대기 신청 버튼 컴포넌트
 * M2-033~040: 대기 시스템
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { MICROCOPY } from '@/lib/constants/microcopy'
import { createLogger } from '@/lib/logger'
import type { Meeting, User, Waitlist } from '@/types/database'

const logger = createLogger('waitlist')

interface WaitlistButtonProps {
  meeting: Meeting
  user: User | null
  existingWaitlist?: Waitlist | null
  className?: string
}

export default function WaitlistButton({
  meeting,
  user,
  existingWaitlist,
  className = '',
}: WaitlistButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitlistInfo, setWaitlistInfo] = useState<{ position?: number } | null>(
    existingWaitlist ? { position: existingWaitlist.position } : null
  )

  // 대기 등록 처리
  const handleRegister = async () => {
    if (!user) {
      router.push(`/auth/login?redirectTo=/meetings/${meeting.id}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      })

      const data = await res.json()

      if (data.data?.success) {
        setWaitlistInfo({ position: data.data.position })
        router.refresh()
      } else {
        setError(data.data?.message || '대기 등록 중 오류가 발생했습니다.')
      }
    } catch (err) {
      logger.error('Waitlist register error', { error: err instanceof Error ? err.message : 'Unknown' })
      setError('대기 등록 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 대기 취소 처리
  const handleCancel = async () => {
    if (!existingWaitlist) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlists/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistId: existingWaitlist.id }),
      })

      const data = await res.json()

      if (data.data?.success) {
        setWaitlistInfo(null)
        router.refresh()
      } else {
        setError(data.data?.message || '대기 취소 중 오류가 발생했습니다.')
      }
    } catch (err) {
      logger.error('Waitlist cancel error', { error: err instanceof Error ? err.message : 'Unknown' })
      setError('대기 취소 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 이미 대기 중인 경우
  if (existingWaitlist || waitlistInfo) {
    return (
      <div className={className}>
        <div className="flex items-center gap-3">
          <span className="text-sm text-brand-600 font-medium">
            대기 {waitlistInfo?.position || existingWaitlist?.position}번째
          </span>
          <Button
            onClick={handleCancel}
            variant="secondary"
            isLoading={isLoading}
            className="!text-red-600 hover:!bg-red-50"
          >
            대기 취소
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        onClick={handleRegister}
        variant="secondary"
        disabled={isLoading}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? MICROCOPY.status.processing : user ? MICROCOPY.buttons.waitlist : '로그인 후 대기 신청'}
      </Button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
