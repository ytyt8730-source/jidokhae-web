'use client'

/**
 * 티켓 절취선 컴포넌트
 * M9 Phase 9.3: Commitment Ritual
 *
 * useTearGesture hook을 사용하여 드래그로 티켓 찢기
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import { useTearGesture } from '@/hooks/useTearGesture'

interface TicketPerforationProps {
  onTear?: () => void
  className?: string
}

export default function TicketPerforation({
  onTear,
  className = '',
}: TicketPerforationProps) {
  const {
    dragProgress,
    isTorn,
    isDragging,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    containerRef,
  } = useTearGesture({
    threshold: 150,
    onTear,
  })

  // 글로벌 마우스/터치 이벤트 등록
  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent | TouchEvent) => handleDrag(e)
    const handleUp = () => handleDragEnd()

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, handleDrag, handleDragEnd])

  return (
    <div
      ref={containerRef}
      className={`relative h-6 my-1 overflow-hidden ${className}`}
    >
      {/* 점선 절취선 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-full border-t-2 border-dashed border-gray-300"
          style={{
            maskImage: `linear-gradient(to right, black ${dragProgress * 100}%, transparent ${dragProgress * 100}%)`,
            WebkitMaskImage: `linear-gradient(to right, black ${dragProgress * 100}%, transparent ${dragProgress * 100}%)`,
          }}
        />
        <div
          className="w-full border-t-2 border-dashed border-gray-300"
          style={{
            maskImage: `linear-gradient(to right, transparent ${dragProgress * 100}%, black ${dragProgress * 100}%)`,
            WebkitMaskImage: `linear-gradient(to right, transparent ${dragProgress * 100}%, black ${dragProgress * 100}%)`,
          }}
        />
      </div>

      {/* 가위 아이콘 (드래그 핸들) */}
      {!isTorn && (
        <motion.div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 touch-none select-none"
          style={{ left: `${dragProgress * 100}%` }}
          animate={{
            scale: isDragging ? 1.1 : 1,
            x: 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className={`
            bg-white rounded-full p-1 shadow-md border border-gray-200
            ${isDragging ? 'ring-2 ring-brand-400 ring-opacity-50' : ''}
          `}>
            <Scissors
              size={14}
              strokeWidth={1.5}
              className={`transform rotate-90 transition-colors ${
                dragProgress > 0.5 ? 'text-brand-600' : 'text-gray-500'
              }`}
            />
          </div>
        </motion.div>
      )}

      {/* 찢어진 효과 */}
      {isTorn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-full border-t-2 border-gray-200" />
        </motion.div>
      )}

      {/* 힌트 텍스트 */}
      {!isTorn && dragProgress === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-400 bg-white px-2">
            밀어서 뜯기
          </span>
        </div>
      )}
    </div>
  )
}
