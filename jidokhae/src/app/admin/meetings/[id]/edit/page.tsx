'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { RefundPolicy, MeetingType, MeetingStatus } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditMeetingPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [refundPolicies, setRefundPolicies] = useState<RefundPolicy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    meeting_type: 'regular' as MeetingType,
    datetime: '',
    location: '',
    capacity: 14,
    fee: 10000,
    description: '',
    refund_policy_id: '',
    status: 'open' as MeetingStatus,
  })

  useEffect(() => {
    const fetchData = async () => {
      // 모임 정보 조회
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (meetingError || !meeting) {
        router.push('/admin/meetings')
        return
      }

      // 환불 규정 조회
      const { data: policies } = await supabase
        .from('refund_policies')
        .select('*')
        .order('name') as { data: RefundPolicy[] | null }

      if (policies) {
        setRefundPolicies(policies)
      }

      // 폼 데이터 설정
      const dt = new Date(meeting.datetime)
      const localDatetime = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)

      setFormData({
        title: meeting.title,
        meeting_type: meeting.meeting_type,
        datetime: localDatetime,
        location: meeting.location,
        capacity: meeting.capacity,
        fee: meeting.fee,
        description: meeting.description || '',
        refund_policy_id: meeting.refund_policy_id || '',
        status: meeting.status,
      })

      setIsFetching(false)
    }

    fetchData()
  }, [resolvedParams.id, router, supabase])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'fee' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // 유효성 검사
    if (!formData.title.trim()) {
      setError('모임명을 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.datetime) {
      setError('일시를 선택해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.location.trim()) {
      setError('장소를 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const updateData = {
        title: formData.title.trim(),
        meeting_type: formData.meeting_type,
        datetime: new Date(formData.datetime).toISOString(),
        location: formData.location.trim(),
        capacity: formData.capacity,
        fee: formData.fee,
        description: formData.description.trim() || null,
        refund_policy_id: formData.refund_policy_id || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
      }
      
      const { error: updateError } = await supabase
        .from('meetings')
        .update(updateData as never)
        .eq('id', resolvedParams.id)

      if (updateError) {
        setError('모임 수정 중 오류가 발생했습니다.')
        console.error(updateError)
        return
      }

      router.push('/admin/meetings')
      router.refresh()
    } catch {
      setError('모임 수정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 mb-6"
      >
        <ArrowLeft size={16} />
        모임 목록으로
      </Link>

      <h1 className="text-2xl font-bold text-warm-900 mb-6">모임 수정</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <Input
          label="모임명"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="예: 경주 1월 4주차 정기모임"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-warm-700">
              모임 유형
            </label>
            <select
              name="meeting_type"
              value={formData.meeting_type}
              onChange={handleChange}
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="regular">정기모임</option>
              <option value="discussion">토론모임</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-warm-700">
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="open">모집중</option>
              <option value="closed">마감</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
        </div>

        <Input
          label="일시"
          type="datetime-local"
          name="datetime"
          value={formData.datetime}
          onChange={handleChange}
          required
        />

        <Input
          label="장소"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="예: 경주 황리단길 ○○카페"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="정원"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min={1}
            required
          />
          <Input
            label="참가비 (콩)"
            type="number"
            name="fee"
            value={formData.fee}
            onChange={handleChange}
            min={0}
            step={1000}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-warm-700">
            환불 규정
          </label>
          <select
            name="refund_policy_id"
            value={formData.refund_policy_id}
            onChange={handleChange}
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">선택 안함</option>
            {refundPolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-warm-700">
            모임 설명 (선택)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="모임에 대한 추가 안내 사항을 입력해주세요."
            rows={4}
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            수정 완료
          </Button>
        </div>
      </form>
    </div>
  )
}

