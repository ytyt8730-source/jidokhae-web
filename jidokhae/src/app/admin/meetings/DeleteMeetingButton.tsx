'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

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
        console.error(error)
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="font-semibold text-lg">모임 삭제</h3>
          </div>
          <p className="text-warm-600 mb-6">
            &ldquo;{meetingTitle}&rdquo; 모임을 정말 삭제하시겠습니까?
            <br />
            <span className="text-sm text-warm-500">이 작업은 되돌릴 수 없습니다.</span>
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

