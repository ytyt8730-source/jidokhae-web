'use client'

/**
 * 티켓 절취선 컴포넌트
 * M9 Phase 9.1: Commitment Ritual
 *
 * 드래그하여 찢을 수 있는 절취선
 */

import { useState, useRef } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Scissors } from 'lucide-react'

interface TicketPerforationProps {
  onTear?: () => void
  className?: string
}

export default function TicketPerforation({
  onTear,
  className = '',
}: TicketPerforationProps) {
  const [dragProgress, setDragProgress] = useState(0)
  const [isTorn, setIsTorn] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!containerRef.current || isTorn) return

    const containerWidth = containerRef.current.offsetWidth
    const progress = Math.min(Math.max(info.offset.x / containerWidth, 0), 1)
    setDragProgress(progress)
  }

  const handleDragEnd = () => {
    if (dragProgress > 0.7 && !isTorn) {
      setIsTorn(true)
      onTear?.()
    } else {
      setDragProgress(0)
    }
  }

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
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${dragProgress * 100}%` }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="bg-white rounded-full p-1 shadow-md border border-gray-200">
            <Scissors
              size={14}
              strokeWidth={1.5}
              className="text-gray-500 transform rotate-90"
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
