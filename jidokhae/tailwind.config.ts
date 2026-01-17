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
        // 브랜드 컬러 - 따뜻하고 편안하면서도 고급스러운 느낌
        brand: {
          50: '#fdf8f6',
          100: '#f8ebe6',
          200: '#f0d5cc',
          300: '#e5b8a8',
          400: '#d69478',
          500: '#c77654', // 주요 브랜드 색상
          600: '#b55f3e',
          700: '#974c33',
          800: '#7c402e',
          900: '#673829',
          950: '#381b14',
        },
        // 중립 색상 - 따뜻한 그레이
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
        // 상태 색상
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Noto Serif KR', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
export default config;
