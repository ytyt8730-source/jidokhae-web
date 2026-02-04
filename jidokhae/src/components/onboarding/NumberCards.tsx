'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, Sparkles } from 'lucide-react'

interface NumberCard {
  value: string
  label: string
  icon: React.ElementType
}

const cards: NumberCard[] = [
  { value: '4명', label: '함께 시작한 운영진', icon: Users },
  { value: '3년', label: '경주/포항에서 함께한 시간', icon: Calendar },
  { value: '250명', label: '함께 책 읽은 멤버', icon: Sparkles },
]

/**
 * 숫자 카드 컴포넌트
 * 신뢰 구축을 위한 통계 표시 (Stagger 애니메이션)
 */
export default function NumberCards() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: index * 0.15,
              duration: 0.4,
              ease: 'easeOut',
            }}
            className="bg-bg-surface rounded-xl p-4 text-center"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent size={20} strokeWidth={1.5} className="text-primary" />
            </div>
            <div className="text-xl font-bold text-text">{card.value}</div>
            <div className="text-xs text-text-muted mt-1">{card.label}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
