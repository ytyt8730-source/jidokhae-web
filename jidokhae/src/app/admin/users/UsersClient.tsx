'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, User, Mail, Phone, Calendar, Award, BookOpen } from 'lucide-react'
import Input from '@/components/ui/Input'

interface UserData {
  id: string
  email: string
  name: string
  nickname: string
  phone: string | null
  role: 'member' | 'admin' | 'super_admin'
  is_new_member: boolean
  total_participations: number
  total_praises_received: number
  created_at: string
  last_regular_meeting_at: string | null
}

export function UsersClient() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data as UserData[])
      setFilteredUsers(data as UserData[])
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            (user.nickname && user.nickname.toLowerCase().includes(query)) ||
            user.email.toLowerCase().includes(query) ||
            (user.phone && user.phone.includes(query))
        )
      )
    }
  }, [searchQuery, users])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
            슈퍼관리자
          </span>
        )
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            운영자
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            회원
          </span>
        )
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
    }
    return phone
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
        <Input
          type="text"
          placeholder="이름, 이메일, 전화번호로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-800">{users.length}</p>
          <p className="text-sm text-gray-500">전체 회원</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-800">
            {users.filter((u) => u.is_new_member).length}
          </p>
          <p className="text-sm text-gray-500">신규 회원</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-800">
            {users.filter((u) => ['admin', 'super_admin'].includes(u.role)).length}
          </p>
          <p className="text-sm text-gray-500">운영진</p>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="card divide-y divide-gray-100">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="text-gray-500" size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-brand-800 truncate min-w-0">
                        {user.name}
                        {user.nickname && <span className="text-gray-500 font-normal"> ({user.nickname})</span>}
                      </span>
                      <span className="flex-shrink-0">{getRoleBadge(user.role)}</span>
                      {user.is_new_member && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>참여 {user.total_participations}회</p>
                  <p>가입 {formatDate(user.created_at)}</p>
                </div>
              </div>

              {/* 상세 정보 (펼침) */}
              {selectedUser?.id === user.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} strokeWidth={1.5} />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} strokeWidth={1.5} />
                    <span>{formatPhone(user.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} strokeWidth={1.5} />
                    <span>마지막 참여: {formatDate(user.last_regular_meeting_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award size={16} strokeWidth={1.5} />
                    <span>받은 칭찬: {user.total_praises_received}개</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={16} strokeWidth={1.5} />
                    <span>총 참여: {user.total_participations}회</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
