'use client'

/**
 * 분위기 미리보기 섹션 (인라인)
 * M7-003: 팝업 → 인라인 미리보기로 대체
 * 
 * 신규회원에게만 표시, 공개 동의한 후기로 분위기 전달
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight } from 'lucide-react'

interface Review {
  content: string
}

interface MeetingPreviewSectionProps {
  isNewMember: boolean
  reviews: Review[] | null
}

export default function MeetingPreviewSection({
  isNewMember,
  reviews,
}: MeetingPreviewSectionProps) {
  // 신규회원이 아니거나 후기가 없으면 표시 안함
  if (!isNewMember || !reviews || reviews.length === 0) {
    return null
  }

  // 최대 3개까지만 표시
  const displayReviews = reviews.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-6 p-4 bg-warm-50 rounded-xl border border-warm-100"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-brand-500" />
        <h3 className="text-sm font-medium text-warm-700">
          💬 지난 모임의 분위기
        </h3>
      </div>
      
      {/* 후기 목록 */}
      <div className="space-y-2 mb-3">
        {displayReviews.map((review, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
            className="text-sm text-warm-600 italic pl-3 border-l-2 border-brand-200"
          >
            &ldquo;{review.content.length > 60 
              ? `${review.content.slice(0, 60)}...` 
              : review.content}&rdquo;
          </motion.p>
        ))}
      </div>
      
      {/* 더 알아보기 링크 */}
      <Link 
        href="/about" 
        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors group"
      >
        지독해 더 알아보기
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  )
}
