'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Calendar, Users, TrendingUp, Banknote, RefreshCcw,
  Clock, CreditCard, ChevronLeft, ChevronRight,
  type LucideIcon
} from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { DashboardStats } from '@/app/api/admin/stats/route'

interface StatCardProps {
  label: string
  value: ReactNode
  subValue?: string
  icon: LucideIcon
  color: string
  bg: string
  href?: string
  urgent?: boolean
}

function StatCard({ label, value, subValue, icon: Icon, color, bg, href, urgent }: StatCardProps) {
  const content = (
    <div className={`card p-4 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${urgent ? 'ring-2 ring-orange-300' : ''}`}>
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={color} size={20} strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-bold text-brand-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      {href && <span className="text-xs text-brand-600 mt-2 block">확인하기 →</span>}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function MonthPicker({
  value,
  onChange
}: {
  value: string
  onChange: (month: string) => void
}) {
  const [year, month] = value.split('-').map(Number)

  const handlePrev = () => {
    const date = new Date(year, month - 2, 1)
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNext = () => {
    const date = new Date(year, month, 1)
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrev}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft size={20} className="text-gray-600" strokeWidth={1.5} />
      </button>
      <span className="text-gray-700 font-medium min-w-[100px] text-center">
        {year}년 {month}월
      </span>
      <button
        onClick={handleNext}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <ChevronRight size={20} className="text-gray-600" strokeWidth={1.5} />
      </button>
    </div>
  )
}

export default function DashboardClient() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stats?month=${selectedMonth}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error?.message || '통계를 불러오는데 실패했습니다.')
      }
    } catch {
      setError('통계를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string, current: number, capacity: number) => {
    if (status === 'closed') {
      return <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">마감</span>
    }
    if (status === 'cancelled') {
      return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">취소됨</span>
    }
    if (current >= capacity) {
      return <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">정원 마감</span>
    }
    if (capacity - current <= 3) {
      return <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">마감임박</span>
    }
    return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded">모집중</span>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-800">대시보드</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-800">대시보드</h1>
        <div className="card p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="btn-secondary"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-brand-800">대시보드</h1>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* 통계 카드 - 상단 3개 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="참가 현황"
          value={`확정 ${stats.registrations.confirmed}건`}
          subValue={`취소 ${stats.registrations.cancelled}건`}
          icon={Calendar}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard
          label="수입"
          value={<Price amount={stats.income.total} size="lg" />}
          icon={Banknote}
          color="text-green-500"
          bg="bg-green-50"
        />
        <StatCard
          label="환불"
          value={<Price amount={stats.income.refunded} size="lg" />}
          subValue={`${stats.income.refundCount}건`}
          icon={RefreshCcw}
          color="text-orange-500"
          bg="bg-orange-50"
        />
      </div>

      {/* 통계 카드 - 하단 3개 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="입금대기"
          value={`${stats.transfers.pendingCount}건`}
          icon={Clock}
          color="text-yellow-600"
          bg="bg-yellow-50"
          href={stats.transfers.pendingCount > 0 ? '/admin/transfers' : undefined}
          urgent={stats.transfers.pendingCount > 0}
        />
        <StatCard
          label="환불대기"
          value={`${stats.transfers.refundPendingCount}건`}
          icon={CreditCard}
          color="text-red-500"
          bg="bg-red-50"
          href={stats.transfers.refundPendingCount > 0 ? '/admin/transfers?tab=refund' : undefined}
          urgent={stats.transfers.refundPendingCount > 0}
        />
        <StatCard
          label="재참여율"
          value={`${stats.retention.rate}%`}
          subValue={`${stats.retention.returningUsers}/${stats.retention.totalUsers}명`}
          icon={TrendingUp}
          color="text-purple-500"
          bg="bg-purple-50"
        />
      </div>

      {/* 세그먼트별 회원 수 */}
      <div className="card p-6">
        <h2 className="font-semibold text-brand-800 mb-4 flex items-center gap-2">
          <Users size={18} strokeWidth={1.5} />
          회원 세그먼트
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.segments.new}</p>
            <p className="text-sm text-gray-600">신규</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.segments.growth}</p>
            <p className="text-sm text-gray-600">성장</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.segments.loyal}</p>
            <p className="text-sm text-gray-600">충성</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.segments.dormantRisk}</p>
            <p className="text-sm text-gray-600">이탈위험</p>
          </div>
          <div className="text-center p-3 bg-gray-100 rounded-lg">
            <p className="text-2xl font-bold text-gray-500">{stats.segments.dormant}</p>
            <p className="text-sm text-gray-600">휴면</p>
          </div>
        </div>
      </div>

      {/* 이번 달 모임 현황 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-800 flex items-center gap-2">
            <Calendar size={18} strokeWidth={1.5} />
            모임 현황
          </h2>
          <Link href="/admin/meetings" className="text-sm text-brand-600 hover:underline">
            전체 보기
          </Link>
        </div>

        {stats.meetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">모임명</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">일시</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">참가</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">상태</th>
                </tr>
              </thead>
              <tbody>
                {stats.meetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/meetings/${meeting.id}/edit`}
                        className="text-brand-800 hover:text-brand-600"
                      >
                        {meeting.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600">
                      {formatDate(meeting.datetime)}
                    </td>
                    <td className="py-3 px-3 text-center text-sm font-medium text-gray-700">
                      {meeting.currentParticipants}/{meeting.capacity}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(meeting.status, meeting.currentParticipants, meeting.capacity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            이번 달 예정된 모임이 없습니다.
          </p>
        )}
      </div>

      {/* 빠른 작업 */}
      <div className="card p-6">
        <h2 className="font-semibold text-brand-800 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/meetings/new"
            className="p-4 bg-brand-50 rounded-xl text-center hover:bg-brand-100 transition-colors"
          >
            <Calendar className="mx-auto text-brand-600 mb-2" size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium text-brand-800">모임 생성</span>
          </Link>
          <Link
            href="/admin/transfers"
            className="p-4 bg-yellow-50 rounded-xl text-center hover:bg-yellow-100 transition-colors"
          >
            <Clock className="mx-auto text-yellow-600 mb-2" size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium text-yellow-800">입금 확인</span>
          </Link>
          <Link
            href="/admin/notifications"
            className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors"
          >
            <Users className="mx-auto text-blue-600 mb-2" size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium text-blue-800">알림 발송</span>
          </Link>
          <Link
            href="/admin/users"
            className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors"
          >
            <Users className="mx-auto text-gray-600 mb-2" size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-700">회원 관리</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
