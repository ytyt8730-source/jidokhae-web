'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import { overlayAnimation, modalAnimation } from '@/lib/animations'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface IneligibilityModalProps {
  isOpen: boolean
  onClose: () => void
  lastRegularMeetingAt: string | null
  daysRemaining: number | null
}

export default function IneligibilityModal({
  isOpen,
  onClose,
  lastRegularMeetingAt,
  daysRemaining,
}: IneligibilityModalProps) {
  const router = useRouter()

  const handleGoToRegularMeetings = () => {
    router.push('/meetings?type=regular')
    onClose()
  }

  // 날짜 포맷팅
  const formattedLastMeeting = lastRegularMeetingAt
    ? format(new Date(lastRegularMeetingAt), 'yyyy년 M월 d일', { locale: ko })
    : '기록 없음'

  const isExpired = daysRemaining !== null && daysRemaining <= 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-modal-overlay"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-modal w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ineligibility-modal-title"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <X size={20} strokeWidth={1.5} />
              </button>

              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
                  <AlertTriangle className="text-warning" size={32} strokeWidth={1.5} />
                </div>
                <h2 id="ineligibility-modal-title" className="text-xl font-bold text-brand-800 mb-2">
                  정기모임 참여가 필요해요
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm">
                  토론모임에 참여하려면
                  <br />
                  6개월 이내 정기모임 참여 기록이 필요합니다.
                </p>
              </div>

              {/* 자격 상태 정보 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">마지막 정기모임</span>
                  <span className="text-gray-700 font-medium">{formattedLastMeeting}</span>
                </div>
                {isExpired ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">상태</span>
                    <span className="text-error font-medium">자격이 만료되었어요</span>
                  </div>
                ) : daysRemaining !== null ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">남은 기간</span>
                    <span className="text-warning font-medium">{daysRemaining}일 남음</span>
                  </div>
                ) : null}
              </div>

              {/* 안내 메시지 */}
              <p className="text-center text-gray-600 mb-6 text-sm">
                먼저 정기모임에 참여해주세요!
              </p>

              {/* 버튼 */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoToRegularMeetings}
                  className="w-full"
                  size="lg"
                >
                  <Calendar size={18} strokeWidth={1.5} className="mr-2" />
                  정기모임 보러가기
                </Button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
