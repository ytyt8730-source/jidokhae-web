'use client'

/**
 * BrandLogo - 테마 인식 브랜드 로고 컴포넌트
 *
 * Design System v3.4 Section 7.4 준수
 * - Electric: "JIDOKHAE" (font-display) + lime dot
 * - Warm: "지독해." (font-serif)
 *
 * @example
 * <BrandLogo variant="full" />      // 헤더용 (서브타이틀 포함)
 * <BrandLogo variant="simple" />    // 푸터, 일반용
 * <BrandLogo variant="mini" />      // 티켓, 카드용
 */

import { useTheme } from '@/providers/ThemeProvider'

export type BrandLogoVariant = 'full' | 'simple' | 'mini'

interface BrandLogoProps {
  /** 로고 변형 타입 */
  variant?: BrandLogoVariant
  /** 추가 클래스명 */
  className?: string
  /** 텍스트 색상 클래스 (기본: text-text) */
  textColor?: string
  /** Accent dot 색상 클래스 (기본: bg-accent) */
  dotColor?: string
}

export function BrandLogo({
  variant = 'simple',
  className = '',
  textColor = 'text-text',
  dotColor = 'bg-accent',
}: BrandLogoProps) {
  const { theme } = useTheme()
  const isElectric = theme === 'electric'

  // 변형별 스타일 설정
  const styles = {
    full: {
      fontSize: 'text-xl',
      dotSize: 'w-1.5 h-1.5',
      showSubtitle: true,
    },
    simple: {
      fontSize: 'text-base',
      dotSize: 'w-1.5 h-1.5',
      showSubtitle: false,
    },
    mini: {
      fontSize: 'text-xs',
      dotSize: 'w-1 h-1',
      showSubtitle: false,
    },
  }

  const style = styles[variant]

  if (isElectric) {
    return (
      <div className={`flex items-center ${className}`}>
        <span className={`font-display font-extrabold ${style.fontSize} ${textColor}`}>
          JIDOKHAE
        </span>
        <span className={`${style.dotSize} ${dotColor} rounded-full ml-0.5`} />
      </div>
    )
  }

  // Warm theme
  return (
    <div className={className}>
      <span className={`font-serif font-bold ${style.fontSize} ${textColor}`}>
        지독해.
      </span>
      {style.showSubtitle && (
        <span className="block text-[8px] text-text-muted uppercase tracking-widest">
          Intellectual Ritual
        </span>
      )}
    </div>
  )
}

/**
 * 브랜드 텍스트만 반환 (저작권 표시 등에 사용)
 */
export function useBrandText() {
  const { theme } = useTheme()
  return theme === 'electric' ? 'JIDOKHAE' : '지독해'
}

export default BrandLogo
