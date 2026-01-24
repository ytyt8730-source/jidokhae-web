'use client'

/**
 * 분위기 미리보기 섹션 (신규회원용)
 * M7-003: 팝업 대신 인라인으로 지난 모임 분위기 보여주기
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight } from 'lucide-react'

interface Review {
  content: string
}

interface AtmospherePreviewProps {
  reviews: Review[]
}

export default function AtmospherePreview({ reviews }: AtmospherePreviewProps) {
  if (!reviews || reviews.length === 0) return null

  // 최대 3개까지만 표시
  const displayReviews = reviews.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-brand-500" />
        <h3 className="text-sm font-medium text-gray-700">
          지난 모임의 분위기
        </h3>
      </div>

      {/* 후기 목록 */}
      <div className="space-y-2 mb-3">
        {displayReviews.map((review, index) => (
          <p
            key={index}
            className="text-sm text-gray-600 italic leading-relaxed"
          >
            &ldquo;{review.content.length > 60 
              ? `${review.content.slice(0, 60)}...` 
              : review.content}&rdquo;
          </p>
        ))}
      </div>

      {/* 더 알아보기 링크 */}
      <Link 
        href="/about" 
        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors"
      >
        지독해 더 알아보기
        <ArrowRight size={12} />
      </Link>
    </motion.div>
  )
}
