'use client'

/**
 * 첫 방문 뱃지 넛지 배너
 * M7-002: 손실 회피 심리 활용하여 전환율 향상
 * 
 * 신규회원에게만 표시, 결제 직전 "웰컴 배지" 보상 예고
 */

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

interface WelcomeBadgeNudgeProps {
  isNewMember: boolean
  alreadyRegistered: boolean
  isClosed: boolean
}

export default function WelcomeBadgeNudge({
  isNewMember,
  alreadyRegistered,
  isClosed,
}: WelcomeBadgeNudgeProps) {
  // 조건: 신규회원 + 미등록 + 마감 아님
  if (!isNewMember || alreadyRegistered || isClosed) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 p-3 bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl border border-brand-100"
    >
      <div className="flex items-center gap-3">
        {/* 배지 아이콘 */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-10 h-10 bg-gradient-to-br from-brand-100 to-amber-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Award size={20} className="text-brand-600" />
        </motion.div>
        
        {/* 텍스트 */}
        <div>
          <p className="font-medium text-warm-800 text-sm">
            첫 모임 신청 시 <span className="text-brand-600 font-bold">웰컴 멤버</span> 배지가 지급됩니다!
          </p>
          <p className="text-xs text-warm-500 mt-0.5">
            지독해와 함께하는 첫 발걸음을 기념해요 ✨
          </p>
        </div>
      </div>
    </motion.div>
  )
}
