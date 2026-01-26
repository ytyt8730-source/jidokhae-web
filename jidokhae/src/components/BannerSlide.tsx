'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string | null
}

interface BannerSlideProps {
  banners: Banner[]
  autoPlayInterval?: number
}

export function BannerSlide({ banners, autoPlayInterval = 5000 }: BannerSlideProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const next = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // 자동 재생
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(next, autoPlayInterval)
    return () => clearInterval(timer)
  }, [banners.length, autoPlayInterval, next])

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const BannerContent = (
    <motion.div
      key={currentIndex}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="absolute inset-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentBanner.image_url}
        alt={currentBanner.title}
        className="w-full h-full object-cover"
      />
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      {/* 제목 */}
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-white text-lg font-medium drop-shadow-lg">{currentBanner.title}</p>
      </div>
    </motion.div>
  )

  return (
    <div className="relative w-full aspect-[2/1] md:aspect-[3/1] rounded-2xl overflow-hidden bg-gray-100">
      <AnimatePresence initial={false} custom={direction}>
        {currentBanner.link_url ? (
          <Link href={currentBanner.link_url} className="block absolute inset-0">
            {BannerContent}
          </Link>
        ) : (
          BannerContent
        )}
      </AnimatePresence>

      {/* 네비게이션 버튼 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors z-10"
            aria-label="이전 배너"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors z-10"
            aria-label="다음 배너"
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
              aria-label={`${index + 1}번째 배너로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
