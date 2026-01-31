'use client'

import { ReactNode } from 'react'

interface MobileStickyCTAProps {
  children: ReactNode
  show?: boolean
}

/**
 * MobileStickyCTA - 모바일 하단 고정 CTA 영역
 *
 * UX Note (Sarah Chen):
 * - 모바일에서 CTA가 항상 접근 가능하여 전환율 향상
 * - 스크롤해도 결제 버튼이 항상 보임
 *
 * Tech Note (Yuki Tanaka):
 * - backdrop-blur로 콘텐츠와 분리감
 * - safe-area-inset-bottom으로 노치 대응
 */
export default function MobileStickyCTA({
  children,
  show = true,
}: MobileStickyCTAProps) {
  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-base)]/90 backdrop-blur-lg border-t border-[var(--border)] md:hidden z-40 safe-area-inset-bottom">
      <div className="max-w-md mx-auto">
        {children}
      </div>
    </div>
  )
}
