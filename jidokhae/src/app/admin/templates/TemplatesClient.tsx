'use client'

/**
 * 알림 템플릿 목록 클라이언트 컴포넌트
 * M5 Phase 2 - 알림 템플릿 관리
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, Edit2, Eye, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { NotificationTemplate } from '@/types/database'

interface TemplatesClientProps {
  initialTemplates: NotificationTemplate[]
}

export default function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 템플릿 활성/비활성 토글
  const handleToggle = async (template: NotificationTemplate) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      })

      if (response.ok) {
        const { data } = await response.json()
        setTemplates(prev =>
          prev.map(t => t.id === template.id ? data : t)
        )
      }
    } catch (error) {
      console.error('Toggle failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 템플릿 수정 저장
  const handleSave = async (updatedTemplate: Partial<NotificationTemplate>) => {
    if (!selectedTemplate) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate),
      })

      if (response.ok) {
        const { data } = await response.json()
        setTemplates(prev =>
          prev.map(t => t.id === selectedTemplate.id ? data : t)
        )
        setIsEditModalOpen(false)
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 발송 시점 포맷팅
  const formatSendTiming = (template: NotificationTemplate) => {
    if (template.send_days_before !== null) {
      const days = template.send_days_before
      const time = template.send_time?.slice(0, 5) || ''
      if (days > 0) {
        return `모임 ${days}일 전 ${time}`
      } else if (days === 0) {
        return `모임 당일 ${time}`
      } else {
        return `모임 ${Math.abs(days)}일 후 ${time}`
      }
    }
    return template.send_timing || '이벤트 발생 시'
  }

  // 카테고리별 템플릿 그룹화
  const templateCategories = [
    {
      name: '모임 리마인드',
      templates: templates.filter(t =>
        t.code.startsWith('REMINDER_')
      ),
    },
    {
      name: '대기자 알림',
      templates: templates.filter(t =>
        t.code.startsWith('WAITLIST_')
      ),
    },
    {
      name: '참여 독려',
      templates: templates.filter(t =>
        ['MONTHLY_ENCOURAGE', 'POST_MEETING', 'WELCOME', 'ELIGIBILITY_WARNING', 'DORMANT_RISK'].includes(t.code)
      ),
    },
    {
      name: '계좌이체 관련',
      templates: templates.filter(t =>
        t.code.startsWith('TRANSFER_') || t.code === 'REFUND_ACCOUNT_RECEIVED'
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {templateCategories.map((category, idx) => (
        category.templates.length > 0 && (
          <div key={idx} className="card p-6">
            <h2 className="font-semibold text-brand-800 mb-4">{category.name}</h2>
            <div className="space-y-3">
              {category.templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 transition-colors ${template.is_active
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-100 bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={16} className={template.is_active ? 'text-brand-600' : 'text-gray-400'} strokeWidth={1.5} />
                        <span className="font-medium text-brand-800">{template.name}</span>
                        {!template.is_active && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            비활성
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} />
                          {formatSendTiming(template)}
                        </span>
                        <span className="text-gray-400">
                          코드: {template.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 미리보기 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedTemplate(template)
                          setIsPreviewModalOpen(true)
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="미리보기"
                      >
                        <Eye size={18} strokeWidth={1.5} />
                      </button>

                      {/* 수정 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedTemplate(template)
                          setIsEditModalOpen(true)
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>

                      {/* 활성/비활성 토글 */}
                      <button
                        onClick={() => handleToggle(template)}
                        disabled={isLoading}
                        className="p-2 transition-colors rounded-lg hover:bg-gray-100"
                        title={template.is_active ? '비활성화' : '활성화'}
                      >
                        {template.is_active ? (
                          <ToggleRight size={24} className="text-brand-600" strokeWidth={1.5} />
                        ) : (
                          <ToggleLeft size={24} className="text-gray-400" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      ))}

      {/* 수정 모달 */}
      <AnimatePresence>
        {isEditModalOpen && selectedTemplate && (
          <EditModal
            template={selectedTemplate}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedTemplate(null)
            }}
            onSave={handleSave}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      {/* 미리보기 모달 */}
      <AnimatePresence>
        {isPreviewModalOpen && selectedTemplate && (
          <PreviewModal
            template={selectedTemplate}
            onClose={() => {
              setIsPreviewModalOpen(false)
              setSelectedTemplate(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// 수정 모달 컴포넌트
function EditModal({
  template,
  onClose,
  onSave,
  isLoading,
}: {
  template: NotificationTemplate
  onClose: () => void
  onSave: (data: Partial<NotificationTemplate>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    message_template: template.message_template,
    send_days_before: template.send_days_before,
    send_time: template.send_time?.slice(0, 5) || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      description: formData.description || null,
      message_template: formData.message_template,
      send_days_before: formData.send_days_before,
      send_time: formData.send_time ? `${formData.send_time}:00` : null,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-800">템플릿 수정</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              템플릿 코드
            </label>
            <input
              type="text"
              value={template.code}
              disabled
              className="input bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              템플릿 이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              placeholder="템플릿에 대한 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메시지 내용
            </label>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              className="input min-h-[200px] font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              변수: {template.variables?.map(v => `#{${v}}`).join(', ') || '없음'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발송 시점 (모임 기준 일)
              </label>
              <input
                type="number"
                value={formData.send_days_before ?? ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  send_days_before: e.target.value ? parseInt(e.target.value) : null
                }))}
                className="input"
                placeholder="예: 3 (3일 전), -3 (3일 후)"
              />
              <p className="text-xs text-gray-500 mt-1">
                양수: N일 전, 음수: N일 후, 0: 당일
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발송 시간
              </label>
              <input
                type="time"
                value={formData.send_time}
                onChange={(e) => setFormData(prev => ({ ...prev, send_time: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// 미리보기 모달 컴포넌트
function PreviewModal({
  template,
  onClose,
}: {
  template: NotificationTemplate
  onClose: () => void
}) {
  // 샘플 데이터로 변수 치환
  const sampleData: Record<string, string> = {
    이름: '김독서',
    모임명: '경주 정기모임',
    날짜: '2026년 1월 25일 (토)',
    시간: '오후 2시',
    장소: '경주 카페',
    참가비: '10,000',
    응답시간: '24시간',
    링크: 'https://jidokhae.com/meetings/xxx',
    월: '1',
    모임목록: '• 경주 정기모임 (1/25)\n• 포항 토론모임 (1/27)',
    마지막참여일: '2025년 10월 15일',
    만료예정일: '2026년 4월 15일',
    은행: '카카오뱅크',
    계좌번호: '3333-XX-XXXXXX',
    금액: '10,000',
    입금자명형식: '0125_김독서',
    기한: '2026년 1월 22일 14:00',
    환불금액: '10,000',
  }

  // 변수 치환
  let previewMessage = template.message_template
  template.variables?.forEach((variable) => {
    const value = sampleData[variable] || `[${variable}]`
    previewMessage = previewMessage.replace(new RegExp(`#\\{${variable}\\}`, 'g'), value)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-800">미리보기</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">템플릿: {template.name}</div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-brand-800 font-sans">
                {previewMessage}
              </pre>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-medium text-gray-500 mb-2">샘플 데이터</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {template.variables?.map((v) => (
                <div key={v} className="flex justify-between">
                  <span className="text-gray-500">#{`{${v}}`}</span>
                  <span className="text-gray-700">{sampleData[v] || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
