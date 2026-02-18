'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin-meetings')

interface DeleteMeetingButtonProps {
  meetingId: string
  meetingTitle: string
}

export default function DeleteMeetingButton({ meetingId, meetingTitle }: DeleteMeetingButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) {
        alert('모임 삭제 중 오류가 발생했습니다.')
        logger.error('Failed to delete meeting', { error: error instanceof Error ? error.message : 'Unknown' })
        return
      }

      router.refresh()
      setShowConfirm(false)
    } catch {
      alert('모임 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="bg-bg-surface rounded-2xl p-6 max-w-sm w-full"
        >
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle size={24} />
            <h3 id="delete-dialog-title" className="font-semibold text-lg">모임 삭제</h3>
          </div>
          <p className="text-gray-600 mb-6">
            &ldquo;{meetingTitle}&rdquo; 모임을 정말 삭제하시겠습니까?
            <br />
            <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              isLoading={isLoading}
            >
              삭제
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="text-red-500 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 size={16} />
    </Button>
  )
}

