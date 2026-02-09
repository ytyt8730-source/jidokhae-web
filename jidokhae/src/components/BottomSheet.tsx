'use client'

import { useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showCloseButton?: boolean
  /** 드래그로 닫기 허용 (기본: true) */
  allowDragToClose?: boolean
  maxHeight?: string
}

/**
 * BottomSheet - Design System v3.3 (Phase 3 Enhanced)
 *
 * 개선 사항:
 * - 드래그 제스처로 닫기 지원 (100px 이상 아래로 드래그)
 * - useDragControls로 핸들바 드래그 최적화
 * - backdrop-blur 추가
 *
 * Design Note (Marcus Wei):
 * - Spring 애니메이션 (stiffness: 300, damping: 30)
 * - 네이티브 앱과 유사한 제스처 인터랙션
 *
 * UX Note (Sarah Chen):
 * - 컨텍스트 유지하면서 추가 정보 표시
 * - 모바일 사용자의 자연스러운 닫기 제스처
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  allowDragToClose = true,
  maxHeight = '90vh',
}: BottomSheetProps) {
  const dragControls = useDragControls()

  // ESC 키로 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  // 드래그 종료 시 처리
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // 100px 이상 아래로 드래그하면 닫기
    if (allowDragToClose && info.offset.y > 100) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-modal-overlay backdrop-blur-sm bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-modal flex flex-col rounded-t-3xl overflow-hidden bg-bg-surface"
            style={{ maxHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag={allowDragToClose ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Handle Bar - 드래그 영역 */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => allowDragToClose && dragControls.start(e)}
            >
              <div
                className="w-12 h-1.5 rounded-full bg-[var(--border)]"
                aria-hidden="true"
              />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 pb-4 border-b border-[var(--border)]">
                {title && (
                  <h2
                    id="bottom-sheet-title"
                    className="text-h2 heading-themed font-semibold text-text"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 rounded-full hover:bg-[var(--bg-base)] transition-colors"
                    aria-label="닫기"
                  >
                    <X size={24} strokeWidth={1.5} className="text-text-muted" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
              {children}
            </div>

            {/* Safe Area (iOS) */}
            <div className="pb-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
