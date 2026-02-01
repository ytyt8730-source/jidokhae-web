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
        // Design System v3.3 - Dual Theme System
        // ========================================

        // CSS Variable 기반 테마 색상
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
        },
        primary: "var(--primary)",
        accent: "var(--accent)",
        "accent-readable": "var(--accent-readable)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
        overlay: "var(--overlay)",

        // 상태 색상 (CSS Variable 기반 - Semantic Colors)
        success: {
          DEFAULT: "var(--success)",
          fg: "var(--success-fg)",
          bg: "var(--success-bg)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          fg: "var(--warning-fg)",
          bg: "var(--warning-bg)",
        },
        error: {
          DEFAULT: "var(--error)",
          fg: "var(--error-fg)",
          bg: "var(--error-bg)",
        },
        info: {
          DEFAULT: "var(--info)",
          fg: "var(--info-fg)",
          bg: "var(--info-bg)",
        },
        // 하위 호환성 (danger → error)
        danger: "var(--error)",

        // 기존 호환성 유지
        brand: {
          50: '#F2F5F3',
          100: '#E6EBE7',
          200: '#CED6D0',
          300: '#B5C1B8',
          400: '#849688',
          500: '#4A5D50',
          600: '#355E3B',
          700: '#2E4A35',
          800: '#2B362F',
          900: '#1F291F',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },

      fontFamily: {
        display: ['var(--font-outfit)', 'var(--font-noto-sans)', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-noto-sans)', 'var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },

      zIndex: {
        'base': '0',
        'card': '10',
        'sticky': '100',
        'fab': '200',
        'dropdown': '300',
        'modal-overlay': '1000',
        'modal': '1001',
        'toast': '2000',
        'noise': '9999',
      },

      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },

      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'sheet': '0 -4px 32px rgba(0, 0, 0, 0.15)',
        'fab': '0 4px 14px rgba(0, 0, 0, 0.15)',
        'button': '0 2px 8px rgba(0, 71, 255, 0.25)',
        'button-hover': '0 4px 14px rgba(0, 71, 255, 0.35)',
        'modal': '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
