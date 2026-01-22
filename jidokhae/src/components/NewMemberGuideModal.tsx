'use client'

/**
 * @deprecated M7-003에서 인라인 미리보기(AtmospherePreview)로 대체됨
 * 모임 상세 페이지에서 신규회원에게 직접 분위기를 보여주는 방식으로 변경
 * 이 컴포넌트는 더 이상 사용되지 않지만 롤백을 위해 유지
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, Home, FileText } from 'lucide-react'
import { overlayAnimation, modalAnimation } from '@/lib/animations'

const DONT_SHOW_AGAIN_KEY = 'jidokhae_new_member_guide_hidden'

// M7-003: 팝업 비활성화 - 인라인 미리보기로 대체
const POPUP_DISABLED = true

interface NewMemberGuideModalProps {
  isOpen: boolean
  onClose: () => void
  meetingId: string
  isNewMember: boolean
}

export default function NewMemberGuideModal({
  isOpen,
  onClose,
  meetingId,
  isNewMember,
}: NewMemberGuideModalProps) {
  const router = useRouter()
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // M7-003: 팝업 비활성화
    if (POPUP_DISABLED) {
      setShouldShow(false)
      return
    }
    
    // 로컬스토리지에서 "다시 보지 않기" 설정 확인
    const hidden = localStorage.getItem(DONT_SHOW_AGAIN_KEY)
    setShouldShow(isNewMember && !hidden)
  }, [isNewMember])

  // 신규 회원이 아니거나 "다시 보지 않기" 설정된 경우 모달 표시 안함
  if (!shouldShow || !isOpen) {
    return null
  }

  const handleLearnMore = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_AGAIN_KEY, 'true')
    }
    router.push('/about')
    onClose()
  }

  const handleProceed = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_AGAIN_KEY, 'true')
    }
    router.push(`/meetings/${meetingId}`)
    onClose()
  }

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_AGAIN_KEY, 'true')
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && shouldShow && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {/* 닫기 버튼 */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-warm-400 hover:text-warm-600 transition-colors"
                aria-label="닫기"
              >
                <X size={20} />
              </button>

              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h2 className="text-2xl font-bold text-warm-900 mb-2">
                  처음이시네요!
                </h2>
                <p className="text-warm-600 leading-relaxed">
                  지독해가 어떤 곳인지
                  <br />
                  먼저 둘러보시는 걸 추천해요.
                </p>
              </div>

              {/* 선택지 */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleLearnMore}
                  className="w-full p-4 bg-brand-50 hover:bg-brand-100 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 group-hover:bg-brand-200 rounded-lg flex items-center justify-center transition-colors">
                      <Home className="text-brand-600" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-warm-900">지독해 알아보기</p>
                      <p className="text-sm text-warm-500">분위기와 회원 후기를 먼저</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleProceed}
                  className="w-full p-4 bg-warm-50 hover:bg-warm-100 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warm-100 group-hover:bg-warm-200 rounded-lg flex items-center justify-center transition-colors">
                      <FileText className="text-warm-600" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-warm-900">바로 신청하기</p>
                      <p className="text-sm text-warm-500">이미 알고 있어요!</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* 다시 보지 않기 체크박스 */}
              <label className="flex items-center gap-2 text-sm text-warm-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-300 text-brand-500 focus:ring-brand-500"
                />
                <span>다시 보지 않기</span>
              </label>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * 신규 회원 가이드 모달을 트리거하는 훅
 * MeetingCard 클릭 시 사용
 */
export function useNewMemberGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [targetMeetingId, setTargetMeetingId] = useState<string | null>(null)

  const openGuide = (meetingId: string) => {
    setTargetMeetingId(meetingId)
    setIsOpen(true)
  }

  const closeGuide = () => {
    setIsOpen(false)
    setTargetMeetingId(null)
  }

  return {
    isOpen,
    targetMeetingId,
    openGuide,
    closeGuide,
  }
}
