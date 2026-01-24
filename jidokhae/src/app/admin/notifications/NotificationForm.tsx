'use client'

/**
 * 알림 발송 폼 컴포넌트
 * M3 알림시스템 - Phase 4
 */

import { useState } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  datetime: string
}

interface NotificationFormProps {
  meetings: Meeting[]
}

type TargetType = 'all' | 'active' | 'meeting_participants'

interface SendResult {
  success: boolean
  message: string
  stats?: {
    total: number
    sent: number
    failed: number
  }
}

export default function NotificationForm({ meetings }: NotificationFormProps) {
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      setResult({ success: false, message: '메시지를 입력해주세요' })
      return
    }

    if (targetType === 'meeting_participants' && !selectedMeetingId) {
      setResult({ success: false, message: '모임을 선택해주세요' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          meetingId: targetType === 'meeting_participants' ? selectedMeetingId : undefined,
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setResult(data.data)
        if (data.data.success) {
          setMessage('')
        }
      } else {
        setResult({
          success: false,
          message: data.error?.message || '알림 발송에 실패했습니다',
        })
      }
    } catch {
      setResult({
        success: false,
        message: '네트워크 오류가 발생했습니다',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const targetOptions = [
    { value: 'all', label: '전체 회원', description: '등록된 모든 회원에게 발송' },
    { value: 'active', label: '활성 회원', description: '최근 3개월 내 참여한 회원' },
    { value: 'meeting_participants', label: '특정 모임 참가자', description: '선택한 모임의 확정 참가자' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 대상 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          발송 대상
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {targetOptions.map((option) => (
            <label
              key={option.value}
              className={`
                relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-colors
                ${targetType === option.value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="targetType"
                value={option.value}
                checked={targetType === option.value}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="sr-only"
              />
              <span className="font-medium text-brand-800">{option.label}</span>
              <span className="text-sm text-gray-500 mt-1">{option.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 모임 선택 (특정 모임 참가자 선택 시) */}
      {targetType === 'meeting_participants' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            모임 선택
          </label>
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">모임을 선택하세요</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title} ({new Date(meeting.datetime).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 메시지 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          알림 메시지
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="회원에게 전달할 메시지를 입력하세요"
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <p className="text-sm text-gray-400 mt-1 text-right">
          {message.length}/500자
        </p>
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {result.success ? (
            <CheckCircle className="flex-shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
          ) : (
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
          )}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.stats && (
              <p className="text-sm mt-1">
                전체 {result.stats.total}명 중 {result.stats.sent}명 성공, {result.stats.failed}명 실패
              </p>
            )}
          </div>
        </div>
      )}

      {/* 발송 버튼 */}
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} strokeWidth={1.5} />
            발송 중...
          </>
        ) : (
          <>
            <Send size={18} strokeWidth={1.5} />
            알림 발송
          </>
        )}
      </button>
    </form>
  )
}
