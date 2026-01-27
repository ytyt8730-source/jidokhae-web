'use client'

/**
 * CancelComplete 컴포넌트
 * M9 Phase 9.4: 취소 Flow
 *
 * 취소 완료 화면 (부드러운 작별 메시지)
 */

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import Button from '@/components/ui/Button'
import { MICROCOPY } from '@/lib/constants/microcopy'
import { fadeInUp } from '@/lib/animations'

interface CancelCompleteProps {
  onGoHome: () => void
}

export default function CancelComplete({ onGoHome }: CancelCompleteProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      {/* 아이콘 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center">
          <Heart size={32} strokeWidth={1.5} className="text-primary" />
        </div>
      </motion.div>

      {/* 메시지 */}
      <h1 className="text-2xl font-bold text-text-primary mb-3">
        {MICROCOPY.cancel.complete}
      </h1>
      <p className="text-text-secondary mb-8 max-w-sm">
        {MICROCOPY.cancel.completeSub}
      </p>

      {/* 버튼 */}
      <Button variant="primary" onClick={onGoHome} className="min-w-[200px]">
        {MICROCOPY.buttons.goHome}
      </Button>
    </motion.div>
  )
}
