'use client'

import Link from 'next/link'
import { useTheme } from '@/providers/ThemeProvider'

export function HeroSection() {
  const { theme } = useTheme()

  // Electric: 고딕체 (font-sans), Warm: 명조체 (font-serif)
  const headingFont = theme === 'warm' ? 'font-serif' : 'font-sans'

  return (
    <section className="bg-bg-surface border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <h1 className={`${headingFont} text-4xl lg:text-5xl font-bold text-text leading-tight tracking-tight`}>
            깊은 사유,
            <br />
            새로운 관점
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-text-muted leading-relaxed max-w-2xl">
            경주와 포항에서 매주 열리는 프라이빗 독서 클럽.
            <br className="hidden sm:block" />
            책을 통해 인사이트를 나누고, 사유를 확장합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/meetings" className="btn-primary">
              모임 일정 보기
            </Link>
            <Link href="/about" className="btn-secondary">
              멤버십 안내
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
