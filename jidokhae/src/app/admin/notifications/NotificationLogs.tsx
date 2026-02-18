'use client'

/**
 * 알림 발송 이력 컴포넌트
 * M3 알림시스템 - Phase 4
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface NotificationLog {
  id: string
  user_id: string
  template_code: string
  phone_number: string
  status: string
  message_id: string | null
  error_message: string | null
  meeting_id: string | null
  created_at: string
  users: {
    name: string
  } | null
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const TEMPLATE_LABELS: Record<string, string> = {
  reminder_3d: '3일 전 리마인드',
  reminder_1d: '1일 전 리마인드',
  reminder_today: '당일 리마인드',
  waitlist_spot: '대기자 자리 발생',
  waitlist_expired: '대기 기한 만료',
  monthly_encourage: '월말 독려',
  eligibility_warning: '자격 만료 임박',
  dormant_risk: '휴면 위험',
  onboarding_risk: '온보딩 이탈',
  admin_notice: '운영자 공지',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  sent: { label: '발송 완료', color: 'text-green-600', icon: CheckCircle },
  failed: { label: '발송 실패', color: 'text-red-600', icon: XCircle },
  pending: { label: '대기 중', color: 'text-yellow-600', icon: Clock },
}

export default function NotificationLogs() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async (offset: number = 0) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/notifications?limit=${pagination.limit}&offset=${offset}`
      )
      const data = await response.json()

      if (data.success && data.data) {
        setLogs(data.data.logs || [])
        setPagination(data.data.pagination || { total: 0, limit: 20, offset: 0, hasMore: false })
      } else {
        setError(data.error?.message || '이력을 불러오지 못했습니다')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleRefresh = () => {
    fetchLogs(0)
  }

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      fetchLogs(Math.max(0, pagination.offset - pagination.limit))
    }
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      fetchLogs(pagination.offset + pagination.limit)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const maskPhone = (phone: string) => {
    if (phone.length >= 8) {
      return phone.slice(0, -4) + '****'
    }
    return phone
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          총 {pagination.total.toLocaleString()}건
        </p>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* 로그 목록 */}
      {isLoading && logs.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="animate-spin mx-auto text-gray-400 mb-2" size={24} strokeWidth={1.5} />
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">발송 이력이 없습니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-2">일시</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-2">수신자</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-2">유형</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-2">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending
                const StatusIcon = statusConfig.icon

                return (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-600">
                        {formatDateTime(log.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium text-brand-800">
                          {log.users?.name || '알 수 없음'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {maskPhone(log.phone_number)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-600">
                        {TEMPLATE_LABELS[log.template_code] || log.template_code}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={14} className={statusConfig.color} />
                        <span className={`text-sm ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-full">
                          {log.error_message}
                        </p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrevPage}
            disabled={pagination.offset === 0 || isLoading}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <span className="text-sm text-gray-600">
            {Math.floor(pagination.offset / pagination.limit) + 1} / {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!pagination.hasMore || isLoading}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
}
