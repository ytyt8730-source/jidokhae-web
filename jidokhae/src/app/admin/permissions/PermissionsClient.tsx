'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, UserPlus, UserMinus, Check, X, Search, Loader2 } from 'lucide-react'
import { PERMISSION_LABELS, ALL_PERMISSIONS, Permission } from '@/lib/permissions-constants'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin-permissions')

interface Admin {
  id: string
  name: string
  email: string
  role: string
  permissions: Permission[]
}

interface Member {
  id: string
  name: string
  email: string
}

export function PermissionsClient() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  // 운영자 목록 로드
  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/permissions')
      const data = await res.json()
      if (data.success) {
        setAdmins(data.data)
      }
    } catch (error) {
      logger.error('Failed to fetch admins', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setLoading(false)
    }
  }

  // 권한 토글
  const togglePermission = async (adminId: string, permission: Permission) => {
    const admin = admins.find((a) => a.id === adminId)
    if (!admin || admin.role === 'super_admin') return

    setSavingId(adminId)
    const currentPermissions = admin.permissions
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission]

    try {
      const res = await fetch(`/api/admin/permissions/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions }),
      })
      const data = await res.json()
      if (data.success) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === adminId ? { ...a, permissions: data.data.permissions } : a
          )
        )
      }
    } catch (error) {
      logger.error('Failed to update permission', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setSavingId(null)
    }
  }

  // 회원 검색
  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) {
        // 이미 운영자인 사용자 제외
        const adminIds = admins.map((a) => a.id)
        setSearchResults(data.data.filter((m: Member) => !adminIds.includes(m.id)))
      }
    } catch (error) {
      logger.error('Failed to search members', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setSearching(false)
    }
  }

  // 운영자 추가
  const addAdmin = async (userId: string) => {
    setAddingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchAdmins()
        setShowAddModal(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (error) {
      logger.error('Failed to add admin', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setAddingUserId(null)
    }
  }

  // 운영자 해제
  const removeAdmin = async (userId: string) => {
    if (!confirm('이 운영자를 해제하시겠습니까? 모든 권한이 삭제됩니다.')) return

    setRemovingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      })
      const data = await res.json()
      if (data.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== userId))
      }
    } catch (error) {
      logger.error('Failed to remove admin', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setRemovingUserId(null)
    }
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
      {/* 운영자 추가 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} strokeWidth={1.5} />
          운영자 추가
        </button>
      </div>

      {/* 운영자 목록 */}
      <div className="space-y-4">
        {admins.map((admin, index) => (
          <motion.div
            key={admin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <Shield
                    size={20}
                    strokeWidth={1.5}
                    className={admin.role === 'super_admin' ? 'text-brand-600' : 'text-gray-500'}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-800">{admin.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${admin.role === 'super_admin'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {admin.role === 'super_admin' ? '최고 관리자' : '운영자'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{admin.email}</span>
                </div>
              </div>
              {admin.role !== 'super_admin' && (
                <button
                  onClick={() => removeAdmin(admin.id)}
                  disabled={removingUserId === admin.id}
                  className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  {removingUserId === admin.id ? (
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <UserMinus size={14} strokeWidth={1.5} />
                  )}
                  해제
                </button>
              )}
            </div>

            {/* 권한 체크박스 */}
            {admin.role === 'super_admin' ? (
              <p className="text-sm text-gray-500">모든 권한을 보유하고 있습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${admin.permissions.includes(permission)
                      ? 'bg-brand-50 border-brand-200'
                      : 'bg-bg-surface border-gray-200 hover:border-gray-300'
                      } ${savingId === admin.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={admin.permissions.includes(permission)}
                      onChange={() => togglePermission(admin.id, permission)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center ${admin.permissions.includes(permission)
                        ? 'bg-brand-600 text-white'
                        : 'border-2 border-gray-300'
                        }`}
                    >
                      {admin.permissions.includes(permission) && <Check size={14} strokeWidth={1.5} />}
                    </div>
                    <span className="text-sm text-gray-700">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 운영자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-surface rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-800">운영자 추가</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="relative mb-4">
              <Search size={18} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchMembers(e.target.value)
                }}
                placeholder="이름 또는 이메일로 검색"
                className="input pl-10 w-full"
              />
            </div>

            {/* 검색 결과 */}
            <div className="max-h-64 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" strokeWidth={1.5} />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-brand-800">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      <button
                        onClick={() => addAdmin(member.id)}
                        disabled={addingUserId === member.id}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        {addingUserId === member.id ? (
                          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                        ) : (
                          '추가'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-center text-gray-500 py-8">검색 결과가 없습니다</p>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  2글자 이상 입력하여 검색하세요
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
