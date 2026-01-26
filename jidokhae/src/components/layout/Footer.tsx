import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-bg-base border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 브랜드 */}
          <div className="flex items-center gap-2">
            <BookOpen size={20} strokeWidth={1.5} className="text-primary" />
            <span className="font-semibold text-text">지독해</span>
            <span className="text-sm text-text-muted">경주·포항 독서모임</span>
          </div>

          {/* 링크 */}
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/about" className="hover:text-text transition-colors">
              소개
            </Link>
            {/* TODO: 실제 카카오 오픈채팅 링크로 교체 필요 */}
            <a
              href="https://open.kakao.com/o/gXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-text-muted opacity-60 text-center md:text-left">
            © {currentYear} 지독해. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

