'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, BookOpen, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ActionGuideProps {
  onComplete: () => Promise<void>
  isLoading?: boolean
}

const steps = [
  {
    icon: Search,
    title: '모임 고르기',
    description: '관심 있는 책과 일정을 확인해요',
  },
  {
    icon: CreditCard,
    title: '신청하기',
    description: '콩으로 간편하게 신청해요',
  },
  {
    icon: BookOpen,
    title: '참여하기',
    description: '책 읽고, 이야기 나눠요',
  },
]

/**
 * 3단계: 행동 안내 화면
 * 모임 참여 프로세스와 환불 정책 안내
 */
export default function ActionGuide({ onComplete, isLoading = false }: ActionGuideProps) {
  return (
    <div className="flex flex-col min-h-full">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text mb-2">
          함께 읽어볼까요?
        </h1>
        <p className="text-text-muted">아주 간단해요. 세 단계면 충분합니다.</p>
      </motion.div>

      {/* 3단계 프로세스 */}
      <div className="flex-1 space-y-4 mb-8">
        {steps.map((step, index) => {
          const IconComponent = step.icon
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="flex items-start gap-4"
            >
              {/* 번호 + 아이콘 */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent size={24} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
              </div>

              {/* 텍스트 */}
              <div className="pt-2">
                <h3 className="font-semibold text-text">{step.title}</h3>
                <p className="text-sm text-text-muted mt-0.5">{step.description}</p>
              </div>

              {/* 연결선 (마지막 제외) */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-14 w-0.5 h-8 bg-bg-surface" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 환불 안내 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-bg-surface rounded-xl p-4 mb-8"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} strokeWidth={1.5} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-text mb-1">안심하고 신청하세요</h4>
            <p className="text-sm text-text-muted">
              모임 3일 전까지 100% 환불, 부담 없이 시작해보세요.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA 버튼 */}
      <div>
        <Button
          onClick={onComplete}
          isLoading={isLoading}
          size="lg"
          className="w-full"
        >
          모임 둘러보기
        </Button>
      </div>
    </div>
  )
}
