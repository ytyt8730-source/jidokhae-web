'use client'

import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import NumberCards from './NumberCards'
import ReviewSlider from './ReviewSlider'

// 임시 후기 데이터 (추후 API로 대체)
const SAMPLE_REVIEWS = [
  {
    id: '1',
    content:
      '혼자 읽으면 포기했을 책도, 함께 읽으니 끝까지 읽게 되더라고요. 다양한 시각으로 이야기 나눌 수 있어서 좋았어요.',
    author: '민지',
    meetingTitle: '사피엔스 함께 읽기',
  },
  {
    id: '2',
    content:
      '경주에서 이런 모임 찾기 어려웠는데, 정말 감사해요. 매주 기다려지는 시간이 생겼어요.',
    author: '준혁',
    meetingTitle: '철학책 읽기 모임',
  },
  {
    id: '3',
    content: '처음엔 어색했는데, 지금은 서로 응원해주는 사이가 됐어요. 책 덕분에 좋은 사람들 만났습니다.',
    author: '서연',
    meetingTitle: '에세이 모임',
  },
]

interface TrustBuildingProps {
  onNext: () => Promise<void>
  isLoading?: boolean
  reviews?: typeof SAMPLE_REVIEWS
}

/**
 * 2단계: 신뢰 확보 화면
 * 창업자 스토리, 숫자 카드, 회원 후기로 신뢰 구축
 */
export default function TrustBuilding({
  onNext,
  isLoading = false,
  reviews = SAMPLE_REVIEWS,
}: TrustBuildingProps) {
  return (
    <div className="flex flex-col min-h-full">
      {/* 창업자 스토리 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text mb-4">
          경주/포항에서 책 읽는 사람들
        </h1>
        <p className="text-text-muted leading-relaxed">
          2021년, 책 읽을 사람 4명이 모여 시작했어요.
          <br />
          지금은 250명 넘는 멤버가 함께 책을 읽고, 이야기를 나누고 있습니다.
        </p>
      </motion.div>

      {/* 숫자 카드 */}
      <div className="mb-8">
        <NumberCards />
      </div>

      {/* 회원 후기 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1"
      >
        <h2 className="text-lg font-semibold text-text mb-4">멤버들의 이야기</h2>
        <ReviewSlider reviews={reviews} />
      </motion.div>

      {/* 다음 버튼 */}
      <div className="mt-8">
        <Button
          onClick={onNext}
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
