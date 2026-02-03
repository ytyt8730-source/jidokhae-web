'use client'

/**
 * 한 문장 카드 이미지 생성기
 * M7-020: 바이럴 장치 - 인스타그램 스토리 감성 이미지 카드
 * 
 * 설치 필요: npm install html-to-image
 */

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Loader2 } from 'lucide-react'
import { useBrandText } from '@/components/ui/BrandLogo'

interface QuoteCardGeneratorProps {
  quote: string
  bookTitle: string
  author?: string | null
}

// 배경 그라데이션 옵션
const GRADIENTS = [
  'from-gray-100 to-gray-200',
  'from-brand-50 to-brand-100',
  'from-amber-50 to-orange-100',
  'from-rose-50 to-pink-100',
  'from-sky-50 to-blue-100',
]

export default function QuoteCardGenerator({ quote, bookTitle, author }: QuoteCardGeneratorProps) {
  const brandText = useBrandText()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [gradient] = useState(() => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsGenerating(true)

    try {
      // html-to-image로 PNG 생성
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      })

      // 다운로드
      const link = document.createElement('a')
      link.download = `jidokhae-quote-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('이미지 생성 실패:', error)
      alert('이미지 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mt-4">
      {/* 카드 프리뷰 (작은 크기) */}
      <div className="aspect-[9/16] max-w-[180px] mx-auto mb-3 rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <div
          ref={cardRef}
          className={`w-[1080px] h-[1920px] bg-gradient-to-b ${gradient} p-16 flex flex-col justify-center items-center text-center relative`}
          style={{
            transform: 'scale(0.167)',
            transformOrigin: 'top left',
            fontFamily: '"Noto Serif KR", serif',
          }}
        >
          {/* 상단 장식 */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2">
            <div className="text-6xl text-gray-300">&ldquo;</div>
          </div>

          {/* 인용문 */}
          <p className="text-5xl text-brand-800 leading-relaxed mb-12 px-8 font-medium">
            {quote}
          </p>

          {/* 책 정보 */}
          <div className="text-2xl text-gray-600">
            <p className="font-medium">『{bookTitle}』</p>
            {author && <p className="mt-2 text-gray-500">{author}</p>}
          </div>

          {/* 하단 로고 */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="w-16 h-[2px] bg-gray-300" />
            <p className="text-xl text-gray-400 tracking-widest">
              {brandText}
            </p>
          </div>
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full py-2.5 bg-brand-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Download size={16} strokeWidth={1.5} />
            이미지로 저장
          </>
        )}
      </button>
    </div>
  )
}
