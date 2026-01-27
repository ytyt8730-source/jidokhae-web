'use client'

/**
 * RefundPolicySection 컴포넌트
 * M9 Phase 9.4: 취소 Flow
 *
 * 환불 규정 Collapsible 섹션 (CancelBottomSheet에서 분리)
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RefundPolicySectionProps {
  refundAmount: number
}

export default function RefundPolicySection({ refundAmount }: RefundPolicySectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
      >
        <span className="text-sm font-medium text-text-primary">
          환불 규정 확인하기
        </span>
        {isOpen ? (
          <ChevronUp size={16} strokeWidth={1.5} className="text-text-secondary" />
        ) : (
          <ChevronDown size={16} strokeWidth={1.5} className="text-text-secondary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-text-secondary space-y-2">
              <p>예상 환불 금액: <strong className="text-text-primary">{refundAmount} 콩</strong></p>
              <div className="pt-2 border-t border-border space-y-1">
                <p>• 3일 전까지: 100% 환불</p>
                <p>• 2일 전: 50% 환불</p>
                <p>• 1일 전 이후: 환불 불가</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
