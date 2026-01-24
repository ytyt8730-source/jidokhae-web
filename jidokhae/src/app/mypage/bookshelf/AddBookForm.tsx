'use client'

/**
 * 책 등록 폼 컴포넌트
 * M4 소속감 - Phase 5
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AddBookForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [oneLine, setOneLine] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('책 제목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/bookshelf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          oneLine: oneLine.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTitle('')
        setAuthor('')
        setOneLine('')
        setIsOpen(false)
        router.refresh()
      } else {
        setError(data.error?.message || '등록 중 오류가 발생했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full card p-4 border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all duration-200 text-center group"
      >
        <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-brand-600">
          <Plus size={20} strokeWidth={1.5} />
          <span className="font-medium">책 등록하기</span>
        </div>
      </button>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={20} strokeWidth={1.5} className="text-brand-500" />
        <h3 className="font-semibold text-brand-800">새 책 등록</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 책 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            책 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="책 제목을 입력하세요"
            maxLength={200}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-0 text-brand-800 placeholder-gray-400 disabled:opacity-50"
          />
        </div>

        {/* 저자 */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            저자
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="저자를 입력하세요 (선택)"
            maxLength={100}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-0 text-brand-800 placeholder-gray-400 disabled:opacity-50"
          />
        </div>

        {/* 한 문장 기록 (M7-012: 플레이스홀더 개선) */}
        <div>
          <label htmlFor="oneLine" className="block text-sm font-medium text-gray-700 mb-1">
            한 문장 기록
          </label>
          <input
            type="text"
            id="oneLine"
            value={oneLine}
            onChange={(e) => setOneLine(e.target.value)}
            placeholder='예: "결국 우리는 모두 이야기가 되어간다" (선택)'
            maxLength={200}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-0 text-brand-800 placeholder-gray-400 disabled:opacity-50"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsOpen(false)
              setError(null)
            }}
            disabled={isSubmitting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={1.5} className="mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              '등록하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
