'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import {
  Plus,
  X,
  Loader2,
  GripVertical,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('admin-gallery')

interface GalleryImage {
  id: string
  image_url: string
  alt_text: string
  is_active: boolean
  display_order: number
  created_at: string
}

export function GalleryClient() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [formData, setFormData] = useState({
    image_url: '',
    alt_text: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gallery')
      const data = await res.json()
      if (data.success) {
        setImages(data.data)
      }
    } catch (error) {
      logger.error('Failed to fetch gallery images', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleReorder = async (newOrder: GalleryImage[]) => {
    setImages(newOrder)

    try {
      await fetch('/api/admin/gallery/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: newOrder.map((img) => img.id) }),
      })
    } catch (error) {
      logger.error('Failed to reorder images', { error: error instanceof Error ? error.message : 'Unknown' })
      fetchImages() // 실패 시 원래 순서 복원
    }
  }

  const handleSubmit = async () => {
    if (!formData.image_url || !formData.alt_text) return

    setSubmitting(true)
    try {
      const url = editingImage
        ? `/api/admin/gallery/${editingImage.id}`
        : '/api/admin/gallery'

      const res = await fetch(url, {
        method: editingImage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchImages()
        closeModal()
      }
    } catch (error) {
      logger.error('Failed to save image', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (image: GalleryImage) => {
    try {
      await fetch(`/api/admin/gallery/${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !image.is_active }),
      })
      await fetchImages()
    } catch (error) {
      logger.error('Failed to toggle image', { error: error instanceof Error ? error.message : 'Unknown' })
    }
  }

  const deleteImage = async (id: string) => {
    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) return

    setDeletingId(id)
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
      await fetchImages()
    } catch (error) {
      logger.error('Failed to delete image', { error: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setDeletingId(null)
    }
  }

  const openCreateModal = () => {
    setEditingImage(null)
    setFormData({ image_url: '', alt_text: '' })
    setShowModal(true)
  }

  const openEditModal = (image: GalleryImage) => {
    setEditingImage(image)
    setFormData({
      image_url: image.image_url,
      alt_text: image.alt_text,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingImage(null)
    setFormData({ image_url: '', alt_text: '' })
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
      {/* 이미지 추가 버튼 */}
      <div className="flex justify-end">
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} strokeWidth={1.5} />
          이미지 추가
        </button>
      </div>

      {/* 이미지 목록 */}
      {images.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-gray-500">등록된 갤러리 이미지가 없습니다</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={images}
          onReorder={handleReorder}
          className="space-y-4"
        >
          {images.map((image) => (
            <Reorder.Item key={image.id} value={image}>
              <motion.div
                layout
                className="card p-4 cursor-grab active:cursor-grabbing"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* 상단 영역: 드래그 + 순서 + 썸네일 + 정보 */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* 드래그 핸들 */}
                    <div className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <GripVertical size={20} strokeWidth={1.5} />
                    </div>

                    {/* 순서 번호 */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                      {image.display_order}
                    </div>

                    {/* 썸네일 */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {image.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={image.image_url}
                          alt={image.alt_text}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-brand-800 text-sm sm:text-base line-clamp-2">
                        {image.alt_text}
                      </span>
                      <div className="text-xs sm:text-sm text-gray-500 truncate mt-1 hidden sm:block">
                        {image.image_url}
                      </div>
                    </div>
                  </div>

                  {/* 하단 영역: 상태 토글 + 액션 버튼 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                    {/* 상태 토글 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleActive(image)
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${image.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {image.is_active ? (
                        <>
                          <ToggleRight size={16} strokeWidth={1.5} />
                          활성
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} strokeWidth={1.5} />
                          비활성
                        </>
                      )}
                    </button>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(image)
                        }}
                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteImage(image.id)
                        }}
                        disabled={deletingId === image.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deletingId === image.id ? (
                          <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Trash2 size={18} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <p className="text-sm text-gray-500 text-center">
        드래그하여 이미지 순서를 변경할 수 있습니다
      </p>

      {/* 이미지 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
            className="bg-bg-surface rounded-2xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="gallery-modal-title" className="text-xl font-bold text-brand-800">
                {editingImage ? '이미지 수정' : '새 이미지 추가'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이미지 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="input w-full"
                />
                {formData.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.image_url}
                      alt="미리보기"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대체 텍스트 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="이미지 설명 (접근성용)"
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  이미지를 설명하는 텍스트를 입력하세요 (스크린 리더 사용자를 위해 필요)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.image_url || !formData.alt_text}
                className="btn-primary flex items-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />}
                {editingImage ? '수정' : '추가'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
