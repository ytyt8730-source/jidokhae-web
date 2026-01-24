import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // Design System v2.1 - Deep Forest Green
        // ========================================

        // 브랜드 컬러 - Deep Forest Green (지적이고 고급스러운 느낌)
        brand: {
          50: '#F2F5F3',   // Mist Green - 호버/선택 배경
          100: '#E6EBE7',
          200: '#CED6D0',
          300: '#B5C1B8',
          400: '#849688',
          500: '#4A5D50',   // 장식용만 (텍스트 금지 - 대비율 부족)
          600: '#355E3B',   // ★ Primary CTA - Hunter Green
          700: '#2E4A35',   // Hover 상태
          800: '#2B362F',   // ★ Logo, Heading - Forest Black
          900: '#1F291F',   // Deep Dark
        },

        // 보조 컬러 - Terracotta (마감임박, 좋아요에만 제한 사용)
        accent: {
          50: '#FDF8F6',
          100: '#F5EBE6',
          200: '#EBD5CA',
          300: '#DFB9A8',
          400: '#D19578',
          500: '#B85C38',   // ★ 마감임박, 좋아요
          600: '#9F4A29',   // Hover
          700: '#7C3B21',
          800: '#5E2D1A',
          900: '#401F13',
        },

        // 중립 색상 - Warm Gray (기존 호환성 유지)
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },

        // Gray Scale - Neutral (새로운 표준)
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',   // 기본 본문 텍스트
          800: '#262626',
          900: '#171717',
        },

        // 상태 색상
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',

        // 배경/전경
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Noto Serif KR', 'Georgia', 'serif'],
      },

      borderRadius: {
        'sm': '6px',    // 뱃지, 태그
        'md': '12px',   // 버튼, 입력 필드
        'lg': '16px',   // 카드
        'xl': '20px',   // 배너, 큰 카드
        '2xl': '24px',  // 모달
      },

      boxShadow: {
        // 기본 그림자 - 브랜드 그린 색조
        'xs': '0 1px 2px rgba(43, 54, 47, 0.04)',
        'sm': '0 1px 3px rgba(43, 54, 47, 0.06), 0 1px 2px rgba(43, 54, 47, 0.04)',

        // 카드 그림자
        'card': '0 1px 3px rgba(43, 54, 47, 0.04), 0 4px 12px rgba(43, 54, 47, 0.06)',
        'card-hover': '0 4px 8px rgba(43, 54, 47, 0.08), 0 16px 32px rgba(43, 54, 47, 0.08)',

        // 특수 그림자
        'elegant': '0 2px 4px rgba(43, 54, 47, 0.02), 0 12px 24px rgba(43, 54, 47, 0.06)',
        'modal': '0 10px 40px rgba(43, 54, 47, 0.15), 0 0 0 1px rgba(43, 54, 47, 0.05)',

        // 버튼 그림자 - Brand-600 색조
        'button': '0 2px 8px rgba(53, 94, 59, 0.25)',
        'button-hover': '0 4px 14px rgba(53, 94, 59, 0.35)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
