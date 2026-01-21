'use client'

import { useState, useEffect } from 'react'
import { motion, Reorder } from 'framer-motion'
import {
  Plus,
  X,
  Loader2,
  GripVertical,
  ExternalLink,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from 'lucide-react'

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string | null
  is_active: boolean
  display_order: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

export function BannersClient() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      if (data.success) {
        setBanners(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (newOrder: Banner[]) => {
    setBanners(newOrder)

    try {
      await fetch('/api/admin/banners/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerIds: newOrder.map((b) => b.id) }),
      })
    } catch (error) {
      console.error('Failed to reorder banners:', error)
      fetchBanners() // 실패 시 원래 순서 복원
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) return

    setSubmitting(true)
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners'

      const res = await fetch(url, {
        method: editingBanner ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchBanners()
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save banner:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !banner.is_active }),
      })
      await fetchBanners()
    } catch (error) {
      console.error('Failed to toggle banner:', error)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return

    setDeletingId(id)
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      await fetchBanners()
    } catch (error) {
      console.error('Failed to delete banner:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const openCreateModal = () => {
    setEditingBanner(null)
    setFormData({ title: '', image_url: '', link_url: '' })
    setShowModal(true)
  }

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBanner(null)
    setFormData({ title: '', image_url: '', link_url: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 배너 추가 버튼 */}
      <div className="flex justify-end">
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          배너 추가
        </button>
      </div>

      {/* 배너 목록 */}
      {banners.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-warm-300 mx-auto mb-4" />
          <p className="text-warm-500">등록된 배너가 없습니다</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={banners}
          onReorder={handleReorder}
          className="space-y-4"
        >
          {banners.map((banner) => (
            <Reorder.Item key={banner.id} value={banner}>
              <motion.div
                layout
                className="card p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
              >
                {/* 드래그 핸들 */}
                <div className="text-warm-400 hover:text-warm-600">
                  <GripVertical size={20} />
                </div>

                {/* 순서 번호 */}
                <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-sm font-medium text-warm-600">
                  {banner.display_order}
                </div>

                {/* 썸네일 */}
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-warm-100 flex-shrink-0">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-warm-300" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-900 truncate">{banner.title}</span>
                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-500 hover:text-brand-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-warm-500 truncate">{banner.image_url}</div>
                </div>

                {/* 상태 토글 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleActive(banner)
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    banner.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-warm-100 text-warm-500'
                  }`}
                >
                  {banner.is_active ? (
                    <>
                      <ToggleRight size={16} />
                      활성
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={16} />
                      비활성
                    </>
                  )}
                </button>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(banner)
                    }}
                    className="p-2 text-warm-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBanner(banner.id)
                    }}
                    disabled={deletingId === banner.id}
                    className="p-2 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === banner.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <p className="text-sm text-warm-500 text-center">
        드래그하여 배너 순서를 변경할 수 있습니다
      </p>

      {/* 배너 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-warm-900">
                {editingBanner ? '배너 수정' : '새 배너 추가'}
              </h2>
              <button onClick={closeModal} className="text-warm-400 hover:text-warm-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="배너 제목"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  이미지 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="input w-full"
                />
                {formData.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-warm-100">
                    <img
                      src={formData.image_url}
                      alt="미리보기"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  링크 URL (선택)
                </label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com/page"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.title || !formData.image_url}
                className="btn-primary flex items-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {editingBanner ? '수정' : '추가'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
