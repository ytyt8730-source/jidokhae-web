'use client'

/**
 * 입금대기/환불대기 목록 클라이언트 컴포넌트
 * WP-M5 Phase 1: 계좌이체 결제
 *
 * M5-051: 입금대기 목록 화면
 * M5-052: 운영자 입금 확인 성공
 * M5-053: 입금자명 불일치 시 수동 매칭
 * M5-054: 환불대기 목록 표시
 * M5-055: 운영자 환불 완료 체크
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Check, Clock, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react'
import { getRemainingTime, maskAccountNumber } from '@/lib/transfer'

type Tab = 'pending' | 'refund'

interface TransferRegistration {
  id: string
  user_id: string
  meeting_id: string
  status: string
  payment_status: string
  payment_amount: number
  transfer_sender_name: string
  transfer_deadline: string
  refund_info: {
    bank: string
    account: string
    holder: string
    requested_at: string
  } | null
  users: {
    name: string
    phone: string | null
  }
  meetings: {
    title: string
  }
}

export default function TransfersClient() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'refund' ? 'refund' : 'pending'

  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('all') // MX-H02: 모임 필터
  const [pendingList, setPendingList] = useState<TransferRegistration[]>([])
  const [refundList, setRefundList] = useState<TransferRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/transfers')
      const data = await res.json()

      if (data.success) {
        setPendingList(data.data.pending || [])
        setRefundList(data.data.refundPending || [])
      } else {
        setError(data.error?.message || '데이터를 불러오는데 실패했습니다.')
      }
    } catch {
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 입금 확인 처리
  const handleConfirm = async (registrationId: string) => {
    if (!window.confirm('입금을 확인하셨습니까? 확인 후 참가가 확정됩니다.')) {
      return
    }

    setActionLoading(registrationId)
    try {
      const res = await fetch('/api/admin/registrations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const data = await res.json()

      if (data.success) {
        // 목록에서 제거
        setPendingList((prev) => prev.filter((r) => r.id !== registrationId))
      } else {
        alert(data.error?.message || '처리에 실패했습니다.')
      }
    } catch {
      alert('처리에 실패했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  // 환불 완료 처리
  const handleRefundComplete = async (registrationId: string) => {
    if (!window.confirm('환불을 완료하셨습니까?')) {
      return
    }

    setActionLoading(registrationId)
    try {
      const res = await fetch('/api/admin/registrations/refund-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const data = await res.json()

      if (data.success) {
        // 목록에서 제거
        setRefundList((prev) => prev.filter((r) => r.id !== registrationId))
      } else {
        alert(data.error?.message || '처리에 실패했습니다.')
      }
    } catch {
      alert('처리에 실패했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  // MX-H02: 모임 목록 추출 (중복 제거)
  const meetingOptions = Array.from(
    new Map(
      [...pendingList, ...refundList].map((r) => [r.meeting_id, r.meetings.title])
    )
  ).map(([id, title]) => ({ id, title }))

  // 검색 + 모임 필터링
  const filteredPendingList = pendingList.filter((r) => {
    // 모임 필터
    if (selectedMeetingId !== 'all' && r.meeting_id !== selectedMeetingId) {
      return false
    }
    // 검색 필터
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      r.users.name.toLowerCase().includes(query) ||
      r.transfer_sender_name?.toLowerCase().includes(query) ||
      r.meetings.title.toLowerCase().includes(query)
    )
  })

  const filteredRefundList = refundList.filter((r) => {
    // 모임 필터
    if (selectedMeetingId !== 'all' && r.meeting_id !== selectedMeetingId) {
      return false
    }
    // 검색 필터
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      r.users.name.toLowerCase().includes(query) ||
      r.meetings.title.toLowerCase().includes(query) ||
      r.refund_info?.holder?.toLowerCase().includes(query)
    )
  })

  // 기한 상태 확인
  const getDeadlineStatus = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now()
    if (remaining <= 0) return 'expired'
    if (remaining <= 6 * 60 * 60 * 1000) return 'urgent'
    return 'normal'
  }

  const formatAmount = (amount: number) => amount.toLocaleString() + '콩'

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-800">입금 확인</h1>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-brand-800">입금 확인</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-brand-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} strokeWidth={1.5} />
          새로고침
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'text-brand-600 border-brand-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Clock size={18} strokeWidth={1.5} />
          입금대기
          {pendingList.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('refund')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'refund'
              ? 'text-brand-600 border-brand-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <CreditCard size={18} strokeWidth={1.5} />
          환불대기
          {refundList.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
              {refundList.length}
            </span>
          )}
        </button>
      </div>

      {/* MX-H02: 검색 + 모임 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'pending' ? '회원명 또는 입금자명으로 검색' : '회원명 또는 예금주로 검색'}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        {meetingOptions.length > 0 && (
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white min-w-[180px]"
          >
            <option value="all">전체 모임</option>
            {meetingOptions.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* 입금대기 목록 */}
      {activeTab === 'pending' && (
        <div className="card overflow-hidden">
          {filteredPendingList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">회원명</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">입금자명</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">모임</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">금액</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">기한</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingList.map((reg) => {
                    const deadlineStatus = getDeadlineStatus(reg.transfer_deadline)
                    return (
                      <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-brand-800">{reg.users.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-gray-700">{reg.transfer_sender_name}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{reg.meetings.title}</td>
                        <td className="py-3 px-4 text-right font-medium text-brand-800">
                          {formatAmount(reg.payment_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${
                              deadlineStatus === 'expired'
                                ? 'text-red-600'
                                : deadlineStatus === 'urgent'
                                ? 'text-orange-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {deadlineStatus === 'urgent' && <AlertTriangle size={14} strokeWidth={1.5} />}
                            {getRemainingTime(reg.transfer_deadline)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleConfirm(reg.id)}
                            disabled={actionLoading === reg.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === reg.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <Check size={14} strokeWidth={1.5} />
                            )}
                            확인
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              입금대기 건이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 환불대기 목록 */}
      {activeTab === 'refund' && (
        <div className="card overflow-hidden">
          {filteredRefundList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">회원명</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">모임</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">환불금액</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">환불계좌</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefundList.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-brand-800">{reg.users.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{reg.meetings.title}</td>
                      <td className="py-3 px-4 text-right font-medium text-brand-800">
                        {formatAmount(reg.payment_amount)}
                      </td>
                      <td className="py-3 px-4">
                        {reg.refund_info ? (
                          <div className="text-sm">
                            <p className="text-brand-800">{reg.refund_info.bank}</p>
                            <p className="text-gray-600 font-mono">
                              {maskAccountNumber(reg.refund_info.account)}
                            </p>
                            <p className="text-gray-500">{reg.refund_info.holder}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRefundComplete(reg.id)}
                          disabled={actionLoading === reg.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === reg.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Check size={14} />
                          )}
                          완료
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              환불대기 건이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">
        {activeTab === 'pending' ? (
          <p>• 실제 통장 입금 내역을 확인한 후 [확인] 버튼을 눌러주세요.</p>
        ) : (
          <p>• 실제 환불 송금 완료 후 [완료] 버튼을 눌러주세요.</p>
        )}
      </div>
    </div>
  )
}
