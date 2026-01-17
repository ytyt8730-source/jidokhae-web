/**
 * 참여 완료 확인 페이지
 * M4 소속감 - Phase 1
 */

import Link from 'next/link'
import { CheckCircle, Home, User } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function FeedbackCompletePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="card p-8">
        {/* 성공 아이콘 */}
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl font-bold text-warm-900 mb-2">
          참여 완료!
        </h1>
        <p className="text-warm-600 mb-8">
          다음 모임에서 또 만나요 📚
        </p>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/meetings">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Home size={16} className="mr-2" />
              모임 둘러보기
            </Button>
          </Link>
          <Link href="/mypage">
            <Button className="w-full sm:w-auto">
              <User size={16} className="mr-2" />
              마이페이지
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
