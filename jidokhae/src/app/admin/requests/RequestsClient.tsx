'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Loader2, CheckCircle, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin-requests')

interface RequestUser {
  id: string
  name: string
  email: string
}

interface RequestMeeting {
  id: string
  title: string
}

interface RequestAnswerer {
  id: string
  name: string
}

interface Request {
  id: string
  content: string
  status: 'pending' | 'answered' | 'closed'
  answer: string | null
  answered_at: string | null
  created_at: string
  user: RequestUser | null
  meeting: RequestMeeting | null
  answerer: RequestAnswerer | null
}

export function RequestsClient() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests')
      const data = await res.json()
      if (data.success) {
        setRequests(data.data.requests)
        setPendingCount(data.data.pendingCount)
      }
    } catch (error) {
      logger.error('Failed to fetch requests', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!selectedRequest || !answerText.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerText }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchRequests()
        setSelectedRequest(null)
        setAnswerText('')
      }
    } catch (error) {
      logger.error('Failed to submit answer', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'answered') return r.status === 'answered' || r.status === 'closed'
    return true
  })

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          전체 ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending'
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          미답변 ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('answered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'answered'
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          답변완료 ({requests.length - pendingCount})
        </button>
      </div>

      {/* 요청 목록 */}
      {filteredRequests.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'pending' ? '미답변 요청이 없습니다' : '요청이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedRequest(request)
                setAnswerText(request.answer || '')
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <User size={20} className="text-brand-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-semibold text-brand-800">
                      {request.user?.name || '익명'}
                    </span>
                    {request.meeting && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({request.meeting.title})
                      </span>
                    )}
                    <div className="text-xs text-gray-400">{formatDate(request.created_at)}</div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${request.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                    }`}
                >
                  {request.status === 'pending' ? (
                    <span className="flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.5} />
                      미답변
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={12} strokeWidth={1.5} />
                      답변완료
                    </span>
                  )}
                </span>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{request.content}</p>

              {request.answer && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Send size={14} className="text-brand-600" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-brand-600">
                      {request.answerer?.name || '운영자'} 답변
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">
                    {request.answer}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* 상세/답변 모달 */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="request-detail-title"
              className="bg-bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 id="request-detail-title" className="text-xl font-bold text-brand-800">요청 상세</h2>
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setAnswerText('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                {/* 요청 내용 */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <User size={20} className="text-brand-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="font-semibold text-brand-800">
                        {selectedRequest.user?.name || '익명'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedRequest.user?.email}
                        {selectedRequest.meeting && ` · ${selectedRequest.meeting.title}`}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.content}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatDate(selectedRequest.created_at)}
                  </div>
                </div>

                {/* 답변 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedRequest.status === 'pending' ? '답변 작성' : '답변 수정'}
                  </label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="답변을 입력해주세요..."
                    className="input w-full h-32 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setAnswerText('')
                    }}
                    className="btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !answerText.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Send size={18} strokeWidth={1.5} />
                    )}
                    {selectedRequest.status === 'pending' ? '답변 등록' : '답변 수정'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
