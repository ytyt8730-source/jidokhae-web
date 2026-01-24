'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Bell, Shield, ChevronRight, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

interface RefundRule {
  days_before: number
  refund_percent: number
}

interface RefundPolicy {
  id: string
  name: string
  meeting_type: string
  rules: RefundRule[]
  created_at: string
}

interface SettingsClientProps {
  initialPolicies: RefundPolicy[]
}

export function SettingsClient({ initialPolicies }: SettingsClientProps) {
  const [policies, setPolicies] = useState<RefundPolicy[]>(initialPolicies)
  const [activeSection, setActiveSection] = useState<string | null>('refund')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const supabase = createClient()

  const formatRules = (rules: RefundRule[]) => {
    return rules
      .sort((a, b) => b.days_before - a.days_before)
      .map((rule) => {
        if (rule.days_before === 0) {
          return `당일: ${rule.refund_percent}% 환불`
        }
        return `${rule.days_before}일 전: ${rule.refund_percent}% 환불`
      })
      .join(' / ')
  }

  const handlePolicyUpdate = async (policyId: string, newRules: RefundRule[]) => {
    setIsSaving(true)
    setSaveMessage('')

    const { error } = await supabase
      .from('refund_policies')
      .update({ rules: newRules })
      .eq('id', policyId)

    if (error) {
      setSaveMessage('저장 중 오류가 발생했습니다.')
    } else {
      setSaveMessage('저장되었습니다.')
      setPolicies(policies.map(p =>
        p.id === policyId ? { ...p, rules: newRules } : p
      ))
    }

    setIsSaving(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const sections = [
    {
      id: 'refund',
      label: '환불 정책',
      icon: FileText,
      description: '모임 유형별 환불 규정을 관리합니다.',
    },
    {
      id: 'notification',
      label: '알림 설정',
      icon: Bell,
      description: '알림 발송 시간 및 템플릿을 관리합니다.',
    },
    {
      id: 'security',
      label: '보안 설정',
      icon: Shield,
      description: '비밀번호 정책 및 보안 설정을 관리합니다.',
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 메뉴 */}
      <div className="card divide-y divide-gray-100">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
              activeSection === section.id
                ? 'bg-brand-50'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <section.icon
                size={20}
                className={activeSection === section.id ? 'text-brand-600' : 'text-gray-400'}
                strokeWidth={1.5}
              />
              <div>
                <p className={`font-medium ${
                  activeSection === section.id ? 'text-brand-600' : 'text-brand-800'
                }`}>
                  {section.label}
                </p>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className={activeSection === section.id ? 'text-brand-600' : 'text-gray-300'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      {/* 설정 내용 */}
      <div className="lg:col-span-2">
        {activeSection === 'refund' && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-brand-800">환불 정책 관리</h2>

            {saveMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                saveMessage.includes('오류')
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-600'
              }`}>
                <Check size={16} strokeWidth={1.5} />
                {saveMessage}
              </div>
            )}

            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-brand-800">{policy.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                      {policy.meeting_type === 'regular' ? '정기모임' :
                       policy.meeting_type === 'discussion' ? '토론모임' : '기타'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {formatRules(policy.rules)}
                  </p>
                  <div className="space-y-2">
                    {policy.rules
                      .sort((a, b) => b.days_before - a.days_before)
                      .map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <input
                            type="number"
                            value={rule.days_before}
                            onChange={(e) => {
                              const newRules = [...policy.rules]
                              newRules[idx].days_before = parseInt(e.target.value) || 0
                              setPolicies(policies.map(p =>
                                p.id === policy.id ? { ...p, rules: newRules } : p
                              ))
                            }}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center"
                            min={0}
                          />
                          <span className="text-gray-500">일 전:</span>
                          <input
                            type="number"
                            value={rule.refund_percent}
                            onChange={(e) => {
                              const newRules = [...policy.rules]
                              newRules[idx].refund_percent = parseInt(e.target.value) || 0
                              setPolicies(policies.map(p =>
                                p.id === policy.id ? { ...p, rules: newRules } : p
                              ))
                            }}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center"
                            min={0}
                            max={100}
                          />
                          <span className="text-gray-500">% 환불</span>
                        </div>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => handlePolicyUpdate(policy.id, policy.rules)}
                    isLoading={isSaving}
                  >
                    저장
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'notification' && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-brand-800">알림 설정</h2>
            <p className="text-gray-500">
              알림 템플릿은 <a href="/admin/templates" className="text-brand-600 hover:underline">템플릿 관리</a> 페이지에서 관리할 수 있습니다.
            </p>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-brand-800 mb-2">기본 알림 발송 시간</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>- 모임 리마인드: 3일/1일/당일 오전 7시</p>
                <p>- 대기자 알림: 자리 발생 즉시</p>
                <p>- 신규 회원 환영: 첫 모임 1일 전 오후 8시</p>
                <p>- 모임 후 피드백: 모임 종료 3일 후 오전 10시</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-brand-800">보안 설정</h2>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-brand-800 mb-2">비밀번호 정책</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>- 최소 8자 이상</p>
                <p>- 특수문자 1개 이상 포함</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-brand-800 mb-2">연락처 형식</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>- 숫자만 허용 (하이픈 자동 제거)</p>
                <p>- 최대 11자리</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
