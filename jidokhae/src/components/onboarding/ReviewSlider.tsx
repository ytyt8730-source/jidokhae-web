'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote } from 'lucide-react'

interface Review {
  id: string
  content: string
  author: string
  meetingTitle?: string
}

interface ReviewSliderProps {
  reviews: Review[]
}

/**
 * 회원 후기 슬라이더
 * 공개 동의된 후기를 자동/수동으로 슬라이드
 */
export default function ReviewSlider({ reviews }: ReviewSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
  }, [reviews.length])

  // 자동 슬라이드 (5초 간격)
  useEffect(() => {
    if (reviews.length <= 1 || isPaused) return

    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [reviews.length, isPaused, nextSlide])

  if (reviews.length === 0) {
    return null
  }

  const currentReview = reviews[currentIndex]

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 후기 카드 */}
      <div className="bg-bg-surface rounded-xl p-6 min-h-[160px]">
        <Quote size={24} strokeWidth={1.5} className="text-primary/40 mb-3" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReview.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-text leading-relaxed mb-4">{currentReview.content}</p>
            <div className="text-sm text-text-muted">
              <span className="font-medium text-text">{currentReview.author}</span>
              {currentReview.meetingTitle && (
                <span> / {currentReview.meetingTitle}</span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 인디케이터 */}
      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${index === currentIndex ? 'bg-primary w-4' : 'bg-bg-surface'}
              `}
              aria-label={`후기 ${index + 1}번으로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
