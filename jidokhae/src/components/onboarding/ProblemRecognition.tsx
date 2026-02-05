'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookX, Repeat, MessageCircleOff, Users, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { PROBLEM_OPTIONS } from '@/types/onboarding'

interface ProblemRecognitionProps {
  initialSelections?: string[]
  onNext: (selections: string[]) => Promise<void>
  isLoading?: boolean
}

// 아이콘 매핑 (No-Emoji 정책 준수)
const iconMap: Record<string, React.ElementType> = {
  BookX,
  Repeat,
  MessageCircleOff,
  Users,
}

// 공감 메시지 매핑
const empathyMessages: Record<string, string> = {
  unread_books: '책장에 먼지 쌓인 책들, 마음에 걸리시죠.',
  routine_life: '매일 같은 일상, 새로운 자극이 필요하실 거예요.',
  no_deep_talk: '진지한 이야기 나눌 사람이 그리우시죠.',
  want_belonging: '어딘가에 속해 있고 싶은 마음, 잘 알아요.',
}

/**
 * 1단계: 문제 인식 화면
 * 사용자가 공감하는 문제 선택 (1~4개)
 */
export default function ProblemRecognition({
  initialSelections = [],
  onNext,
  isLoading = false,
}: ProblemRecognitionProps) {
  const [selections, setSelections] = useState<string[]>(initialSelections)

  const toggleSelection = (id: string) => {
    setSelections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleNext = async () => {
    if (selections.length > 0) {
      await onNext(selections)
    }
  }

  // 선택된 모든 항목의 공감 메시지
  const selectedMessages = selections
    .map((id) => empathyMessages[id])
    .filter(Boolean)

  return (
    <div className="flex flex-col min-h-full">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">
          혹시 이런 적 있으신가요?
        </h1>
        <p className="text-text-muted">
          공감되는 항목을 선택해주세요 (최대 4개)
        </p>
      </div>

      {/* 문제 선택 카드 */}
      <div className="flex-1 space-y-3">
        {PROBLEM_OPTIONS.map((option, index) => {
          const IconComponent = iconMap[option.icon]
          const isSelected = selections.includes(option.id)

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleSelection(option.id)}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200
                flex items-center gap-4
                ${
                  isSelected
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-bg-surface border-2 border-transparent hover:border-[var(--border)]'
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'bg-primary text-white' : 'bg-bg-base text-text-muted'}
                `}
              >
                {IconComponent && <IconComponent size={20} strokeWidth={1.5} />}
              </div>
              <span
                className={`flex-1 ${isSelected ? 'text-text font-medium' : 'text-text'}`}
              >
                {option.label}
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check size={14} strokeWidth={2} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* 공감 메시지 (복수 선택 시 모두 표시) */}
      <AnimatePresence>
        {selectedMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-accent/10 rounded-xl space-y-2"
          >
            {selectedMessages.map((message, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-text italic"
              >
                {message}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 다음 버튼 */}
      <div className="mt-8">
        <Button
          onClick={handleNext}
          disabled={selections.length === 0}
          isLoading={isLoading}
          size="lg"
          className="w-full"
        >
          다음으로
        </Button>
      </div>
    </div>
  )
}
