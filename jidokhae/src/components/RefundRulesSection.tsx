'use client'

/**
 * 환불 규정 섹션 컴포넌트
 * M7-001: 핵심 규정만 표시, 나머지는 "더보기"로 접기
 */

import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RefundRule {
  days_before: number
  refund_percent: number
}

interface RefundRulesSectionProps {
  rules: RefundRule[]
  policyName?: string
}

export default function RefundRulesSection({ rules }: RefundRulesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!rules || rules.length === 0) return null

  // 규정을 days_before 기준 내림차순 정렬
  const sortedRules = [...rules].sort((a, b) => b.days_before - a.days_before)
  
  // 가장 유리한 환불 조건 (첫 번째)
  const mainRule = sortedRules[0]
  const hasMoreRules = sortedRules.length > 1

  const formatRule = (rule: RefundRule) => {
    const dayText = rule.days_before === 0 ? '당일' : `${rule.days_before}일 전`
    return `${dayText}: ${rule.refund_percent}% 환불`
  }

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-warm-900">
        <Clock size={18} />
        환불 규정
      </h2>
      
      {/* 핵심 규정 (항상 표시) */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-warm-600">
          <span className="font-medium text-brand-600">
            {mainRule.days_before}일 전까지 {mainRule.refund_percent}% 환불
          </span>
        </p>
        
        {hasMoreRules && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-brand-600 transition-colors"
          >
            {isExpanded ? (
              <>
                접기
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                자세히
                <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </div>

      {/* 상세 규정 (펼침 시) */}
      <AnimatePresence>
        {isExpanded && hasMoreRules && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 pl-1 overflow-hidden"
          >
            {sortedRules.slice(1).map((rule, index) => (
              <li key={index} className="text-sm text-warm-500">
                • {formatRule(rule)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
