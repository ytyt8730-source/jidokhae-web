/**
 * 후기 완료 페이지
 * M4 소속감 - Phase 2
 */

import Link from 'next/link'
import { PenLine, Home, User, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ReviewCompletePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="card p-8">
        {/* 성공 아이콘 */}
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-6">
          <PenLine size={32} strokeWidth={1.5} className="text-blue-600" />
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl font-bold heading-themed text-brand-800 mb-2">
          소중한 후기 감사합니다
        </h1>
        <p className="text-gray-600 mb-8 flex items-center justify-center gap-2">
          다음 모임에서 또 만나요 <BookOpen size={18} strokeWidth={1.5} className="text-brand-600" />
        </p>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/meetings">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Home size={16} strokeWidth={1.5} className="mr-2" />
              모임 둘러보기
            </Button>
          </Link>
          <Link href="/mypage">
            <Button className="w-full sm:w-auto">
              <User size={16} strokeWidth={1.5} className="mr-2" />
              마이페이지
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
