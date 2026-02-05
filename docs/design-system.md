# 지독해 디자인 시스템 v3.5

> **"낮과 밤의 서재 (Day & Night Library)"**
>
> 사용자가 원하는 무드를 선택할 수 있습니다.
> **Electric Mode** — 힙하고 에너지 넘치는 독서 라운지
> **Warm Mode** — 차분하고 지적인 클래식 서재

---

**문서 버전:** 3.5
**작성일:** 2026-02-05
**업데이트 내용:** 문서 간 교차 검토 — 내부 불일치 해소 (noise opacity 통일, borderRadius DEFAULT 추가)
**디자인 컨셉:** Mood-Switchable Reading Club
**기반 프레임워크:** Next.js 14 + React 18 + TypeScript
**UI 라이브러리:** shadcn/ui + Framer Motion + Lucide React  

---

## 목차

1. [No-Emoji 정책](#1-no-emoji-정책)
2. [디자인 철학](#2-디자인-철학)
3. [테마 시스템 (구현 최적화)](#3-테마-시스템-구현-최적화)
4. [색상 시스템 (시인성 강화)](#4-색상-시스템-시인성-강화)
5. [아이콘 시스템 (정밀 보정)](#5-아이콘-시스템-정밀-보정)
6. [콩(Kong) 화폐 시스템](#6-콩kong-화폐-시스템)
7. [타이포그래피 (디테일)](#7-타이포그래피-디테일)
8. [컴포넌트 가이드](#8-컴포넌트-가이드)
9. [레이아웃 & UX Flow](#9-레이아웃--ux-flow)
10. [구현 가이드 (성능 최적화)](#10-구현-가이드-성능-최적화)

---

## 1. No-Emoji 정책

> **최우선 규칙: 모든 이모지 사용을 금지합니다.**

이모지는 OS, 브라우저, 기기별로 렌더링이 달라 브랜드 일관성을 해칩니다.
모든 아이콘은 **Lucide React** 또는 **커스텀 SVG**로 구현합니다.

### 1.1 금지 목록

```
┌─────────────────────────────────────────────────────────────┐
│  사용 금지 (모든 이모지)                                    │
│  ─────────────────────                                      │
│  콩: 🫘 ❌                                                   │
│  트로피: 🏆 ❌                                               │
│  날짜: 📅 ❌                                                 │
│  장소: 📍 ❌                                                 │
│  사람: 👥 ❌                                                 │
│  불꽃: 🔥 ❌                                                 │
│  번개: ⚡️ ❌                                                 │
│  커피: ☕️ ❌                                                 │
│  알림: 🔔 ❌                                                 │
│  기타 모든 이모지 ❌                                         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 대체 방안

| 용도 | 금지 | 대체 |
|------|------|------|
| 콩 화폐 | 🫘 | `<KongIcon />` (커스텀 SVG) |
| 트로피 | 🏆 | `<Trophy />` (Lucide) |
| 날짜 | 📅 | `<Calendar />` (Lucide) |
| 장소 | 📍 | `<MapPin />` (Lucide) |
| 참가자 | 👥 | `<Users />` (Lucide) |
| 불꽃 | 🔥 | `<Flame />` (Lucide) |
| 번개/Electric | ⚡️ | `<Zap />` (Lucide) |
| 커피/Warm | ☕️ | `<Coffee />` (Lucide) |
| 알림 | 🔔 | `<Bell />` (Lucide) |
| 시간 | 🕖 | `<Clock />` (Lucide) |
| 책 | 📚 | `<BookOpen />` (Lucide) |
| 검색 | 🔍 | `<Search />` (Lucide) |

---

## 2. 디자인 철학

### 2.1 핵심 가치

| 가치 | 설명 |
|------|------|
| **Switchable** | 사용자가 원하는 무드를 직접 선택 (초기 온보딩 시 경험 유도) |
| **Frictionless** | 3-Click으로 모임 신청 완료 (One-Page Flow) |
| **Atmospheric** | 공간감을 주는 UI (Blur, Noise, Glow) |
| **Trust** | 투명한 화폐 가치 전달 (1콩 = 1원) |

### 2.2 두 가지 무드

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Electric Mode (Default)                                   │
│   ───────────────────────                                   │
│   • 힙하고 에너지 넘치는 독서 라운지                         │
│   • Cobalt Blue + Acid Lime                                 │
│   • 경주/포항 2030의 "인스타 감성"                          │
│   • 토스, 디스코드, 애플 같은 현대적 느낌                          │
│                                                             │
│   Warm Mode                                                 │
│   ─────────                                                 │
│   • 차분하고 지적인 클래식 서재                             │
│   • Warm Sand + Deep Navy + Burnt Orange                   │
│   • 종이 질감의 은은한 노이즈                               │
│   • Kinfolk, Aesop 같은 고급스러운 느낌                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 테마 시스템 (구현 최적화)

### 3.1 테마 전환 위치 및 UX

> **중요:** 테마 토글은 **데모용 상단 패널에 두지 않습니다.**

**접근성 강화 전략:**
- **온보딩:** 신규 가입 시 강제로 두 테마를 스위칭해보는 인터랙션 제공 ("어떤 분위기에서 책을 읽고 싶으신가요?")
- **Desktop:** 사이드바 맨 아래 유지
- **Mobile:** 접근성을 높이기 위해 **마이페이지 최상단** 또는 **헤더 우측**에 배치 (설정 깊숙이 숨기기 금지)
- **저장:** `localStorage('jidokhae-theme')`에 사용자 선호 테마 저장

**금지 사항:**
```
❌ 플로팅 버튼으로 두지 마세요 (fixed bottom-4 left-4 등)
❌ 상단 데모 패널에 두지 마세요
❌ 페이지 중앙에 두드러지게 두지 마세요
❌ 설정 메뉴 깊숙이 숨기지 마세요 (접근성 저하)

✅ Desktop: 사이드바 맨 아래
✅ Mobile: 마이페이지 최상단 또는 헤더 우측 아이콘
```

```tsx
// 테마 토글 버튼 예시 (Lucide 아이콘 사용!)
import { Zap, Coffee } from 'lucide-react'

<button onClick={toggleTheme} className="theme-switch-btn">
  {theme === 'electric' ? <Coffee size={16} /> : <Zap size={16} />}
  <span>{theme === 'electric' ? 'Warm Mode' : 'Electric Mode'}</span>
</button>
```

### 3.2 FOUC (깜빡임) 방지 전략

> **문제:** Next.js SSR 시 서버(Electric)와 클라이언트(Warm) 설정 불일치로 인한 화면 깜빡임.
> **해결:** Blocking Script 주입.

```tsx
// app/layout.tsx (head 태그 내부)
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var localTheme = localStorage.getItem('jidokhae-theme');
            var theme = localTheme || 'electric';
            document.documentElement.setAttribute('data-theme', theme);
          } catch (e) {}
        })();
      `,
    }}
  />
</head>
```

### 3.3 CSS Variables 구조

```css
/* globals.css */
:root {
  /* Electric Theme (Default) */
  --bg-base: #F8FAFC;
  --bg-surface: #FFFFFF;
  --primary: #0047FF;
  --accent: #CCFF00;
  --accent-readable: #0F172A;  /* 라임 배경 위 텍스트 */
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E2E8F0;
}

[data-theme="warm"] {
  --bg-base: #F5F5F0;
  --bg-surface: #FAFAF7;
  --primary: #0F172A;
  --accent: #EA580C;
  --accent-readable: #FFFFFF;  /* 오렌지 배경 위 텍스트 */
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E7E5E4;
}
```

### 3.4 테마별 핵심 차이

| 요소 | Electric | Warm |
|------|----------|------|
| 배경 | `#F8FAFC` Light Gray | `#F5F5F0` Sand + Noise |
| Primary | `#0047FF` Cobalt | `#0F172A` Navy |
| Accent | `#CCFF00` Lime | `#EA580C` Orange |
| 로고 색상 | `#0F172A` Navy | `#0F172A` Navy |
| 폰트 (로고) | Outfit (Sans) | Noto Serif KR |
| Noise Texture | 없음 | opacity: 0.06 |

---

## 4. 색상 시스템 (시인성 강화)

### 4.1 Electric Theme Accent 규칙 (Strict)

> **피드백 반영:** 라임색(`#CCFF00`)은 흰 배경에서 시인성이 매우 낮습니다.

**규칙 1: 텍스트 사용 절대 금지**
- 흰 배경 위에서 `text-accent` 사용 금지
- 반드시 `text-primary` (Cobalt Blue) 또는 `text-accent-readable` (Dark Navy) 사용

**규칙 2: 아이콘 사용 시 보정**
- 흰 배경에 라임색 아이콘을 써야 한다면 반드시 Inner Stroke나 Drop Shadow를 적용해야 합니다.

```css
/* 흰 배경 위 라임 아이콘 보정 */
.icon-lime-on-white {
  color: var(--accent);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15)); /* 미세한 그림자로 윤곽 확보 */
}
```

### 4.2 Electric Theme 팔레트

```typescript
electric: {
  bg: {
    base: "#F8FAFC",      // 페이지 배경
    surface: "#FFFFFF",    // 카드 배경
  },
  primary: "#0047FF",      // Cobalt Blue - CTA, 강조
  accent: "#CCFF00",       // Acid Lime - 포인트
  text: {
    default: "#0F172A",    // 기본 텍스트
    muted: "#64748B",      // 보조 텍스트
    light: "#94A3B8",      // 메타 정보
    onPrimary: "#FFFFFF",  // Primary 배경 위
    onAccent: "#0F172A",   // Accent(라임) 배경 위 텍스트
  },
  border: "#E2E8F0",
}
```

### 4.3 Warm Theme 팔레트

```typescript
warm: {
  bg: {
    base: "#F5F5F0",       // Warm Sand
    surface: "#FAFAF7",    // 카드 배경
  },
  primary: "#0F172A",      // Deep Navy
  accent: "#EA580C",       // Burnt Orange
  text: {
    default: "#0F172A",
    muted: "#64748B",
    light: "#94A3B8",
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",   // Accent(오렌지) 배경 위 텍스트
  },
  border: "#E7E5E4",
}
```

### 4.4 Accent 색상 가독성 규칙

> **문제:** 라임색(`#CCFF00`)은 밝은 배경에서 텍스트로 사용하면 가독성이 매우 떨어집니다.

| 상황 | Electric | Warm |
|------|----------|------|
| **Accent 배경 + 텍스트** | 라임 배경 + **다크 텍스트** | 오렌지 배경 + **흰색 텍스트** |
| **밝은 배경 + Accent 텍스트** | **사용 금지** → Primary 사용 | 오렌지 텍스트 OK |
| **섹션 라벨** | `text-primary` (#0047FF) | `text-accent` (#EA580C) |

```tsx
// Electric에서 잘못된 사용
<span className="text-accent">CURATED LIST</span>  // 라임색 텍스트 - 안 보임!

// Electric에서 올바른 사용
<span className="text-primary">CURATED LIST</span>  // Cobalt Blue - 가독성 OK

// Electric에서 라임은 배경으로만
<span className="bg-accent text-accent-readable px-2 py-0.5 rounded">
  Lv.2 열정멤버
</span>
```

---

## 5. 아이콘 시스템 (정밀 보정)

### 5.1 KongIcon 정밀 규격

> **피드백 반영:** Lucide 아이콘과 이질감이 없어야 합니다.

- **Stroke Width:** `1.5px` (Lucide 기본값과 수학적으로 일치 필수)
- **Size:** 텍스트와 함께 쓰일 때 시각적 크기 보정 필요
- **Baseline:** 숫자 폰트(Outfit)와 나란히 놓일 때 `translateY` 보정

```tsx
// components/icons/KongIcon.tsx
export function KongIcon({ className = '', size = 16 }: KongIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      style={{ transform: 'translateY(-1px)' }} /* 텍스트 베이스라인 보정 */
      strokeWidth="1.5" /* Lucide와 일치 */
    >
      {/* 콩 몸통 */}
      <ellipse cx="12" cy="13" rx="7" ry="9" />
      {/* 콩 하이라이트 */}
      <ellipse cx="10" cy="9" rx="2" ry="3" opacity="0.3" />
      {/* 콩 라인 */}
      <path
        d="M8 8 Q12 12 8 18"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}
```

### 5.2 Lucide React 설정

```bash
npm install lucide-react
```

### 5.3 아이콘 스타일 가이드

| 속성 | 값 | 설명 |
|------|-----|------|
| size | 16-24px | 용도에 따라 조절 |
| strokeWidth | 1.5 | 기본 2px보다 얇게 |
| color | `currentColor` | 부모 요소의 text 색상 상속 |

### 5.4 아이콘 매핑 테이블

| 용도 | Lucide 컴포넌트 | 권장 크기 |
|------|----------------|----------|
| 날짜/일정 | `<Calendar />` | 16-18px |
| 시간 | `<Clock />` | 16-18px |
| 장소 | `<MapPin />` | 16-18px |
| 참가자 | `<Users />` | 16-18px |
| 트로피/배지 | `<Trophy />` | 20-24px |
| 번개/Electric | `<Zap />` | 16-20px |
| 커피/Warm | `<Coffee />` | 16-20px |
| 불꽃/열정 | `<Flame />` | 16-18px |
| 알림 | `<Bell />` | 20px |
| 검색 | `<Search />` | 20px |
| 설정 | `<Settings />` | 20px |
| 닫기 | `<X />` | 20-24px |
| 책 | `<BookOpen />` | 20px |
| 화살표 | `<ChevronRight />` | 16px |

### 5.5 사용 예시

```tsx
import { Calendar, MapPin, Users, Trophy, Flame } from 'lucide-react'

// 세션 정보
<div className="flex items-center gap-1.5 text-[var(--text-muted)]">
  <Calendar size={16} strokeWidth={1.5} />
  <span>1월 25일 (토)</span>
</div>

// 트로피 아이콘 (다크 배경에서 glow 효과)
<Trophy 
  className="text-[var(--accent)]"
  size={24}
  strokeWidth={1.5}
  style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
/>
```

---

## 6. 콩(Kong) 화폐 시스템

> **중요:** 가격 단위는 "P"가 아니라 **"콩"**입니다.
> **No-Emoji:** 🫘 이모지 사용 금지. 반드시 SVG 아이콘 사용.

### 6.1 인지 부조화 해소

> **문제:** "10,000콩"이 얼마인지 직관적이지 않음.
> **해결:** 결제 버튼 근처나 가격 표시부 주변에 가이드 제공.

**가이드 문구:**
- `(1콩 = 1원)` 툴팁 또는 보조 텍스트 제공
- 최초 결제 시퀀스 진입 시 1회 안내

### 6.2 버튼 텍스트 규칙

> **피드백 반영:** "결제"라는 단어를 직접적으로 사용하여 심리적 저항감을 높이지 않습니다.
> 대신 아이콘과 명확한 금액 표기로 맥락을 전달합니다.

| 상태 | 예시 | 평가 |
|------|------|------|
| Bad | `[KongIcon] 10,000콩 결제 및 신청` | 너무 딱딱함 |
| Bad | `신청하기` | 얼마인지 모름 |
| **Good** | `[KongIcon] 10,000콩으로 신청하기` | 명확함 + 부드러움 |

### 6.3 가격 표시 컴포넌트

```tsx
// components/ui/Price.tsx
import { KongIcon } from '@/components/icons/KongIcon'

interface PriceProps {
  amount: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Price({ amount, size = 'md', className = '' }: PriceProps) {
  const config = {
    sm: { text: 'text-xs', icon: 12 },
    md: { text: 'text-sm', icon: 16 },
    lg: { text: 'text-base', icon: 20 },
  }
  
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${config[size].text} ${className}`}>
      <KongIcon size={config[size].icon} />
      <span>{amount.toLocaleString()}콩</span>
    </span>
  )
}
```

### 6.4 사용 예시

```tsx
import { MapPin } from 'lucide-react'
import { Price } from '@/components/ui/Price'

// 세션 카드 메타 정보
<div className="session-meta flex items-center justify-between">
  <span className="flex items-center gap-1 text-[var(--text-muted)]">
    <MapPin size={14} strokeWidth={1.5} />
    경주 황리단길
  </span>
  <Price amount={5000} />
</div>

// Bottom Sheet CTA
<button className="btn-primary w-full flex items-center justify-center gap-2">
  <Price amount={10000} size="lg" className="text-white" />
  <span>으로 신청하기</span>
</button>
```

---

## 7. 타이포그래피 (디테일)

### 7.1 숫자/영문 폰트 분리 (Electric Mode)

> **피드백 반영:** 힙한 느낌을 위해 숫자는 Outfit, 한글은 Noto Sans를 엄격히 구분합니다.

```typescript
// tailwind.config.ts
fontFamily: {
  // 숫자와 영문은 Outfit 우선 적용
  sans: ['var(--font-outfit)', 'var(--font-noto-sans)', 'sans-serif'],
  serif: ['var(--font-noto-serif)', 'serif'],
}
```

**Line-height 보정:**
- Outfit 숫자가 Noto Sans 한글보다 큼직하게 보일 수 있으므로, `leading-tight` 등을 적절히 섞어 텍스트 라인을 맞춥니다.

### 7.2 폰트 패밀리

| 폰트 | Electric | Warm |
|------|----------|------|
| **로고** | Outfit (Bold) | Noto Serif KR |
| **헤드라인/제목** | **고딕체** (Outfit / Noto Sans KR) | **명조체** (Noto Serif KR) |
| **본문** | Noto Sans KR | Noto Sans KR |

> **중요:** Electric 모드에서는 모든 헤드라인/제목이 **고딕체**여야 합니다. 명조체는 Warm 모드 전용입니다.

```typescript
fontFamily: {
  display: ['Outfit', 'Noto Sans KR', 'sans-serif'],  // Electric 헤드라인
  serif: ['Noto Serif KR', 'Georgia', 'serif'],       // Warm 헤드라인
  sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],  // 본문 (공통)
}
```

### 7.3 헤드라인 폰트 규칙 (필수!)

> **문제:** Electric 모드인데 헤드라인에 명조체가 적용되면 브랜드 일관성이 깨집니다.

| 테마 | 헤드라인 폰트 | Tailwind 클래스 |
|------|-----------------|------------------|
| **Electric (기본)** | 고딕체 (Sans) | `font-sans` 또는 `font-display` |
| **Warm** | 명조체 (Serif) | `font-serif` |

**코드 예시:**

```tsx
// components/HeroSection.tsx
'use client'

import { useTheme } from '@/providers/ThemeProvider'

export function HeroSection() {
  const { theme } = useTheme()
  
  return (
    <section>
      {/* 헤드라인 - 테마별 폰트 분기 */}
      <h1 className={`text-4xl font-bold leading-tight ${
        theme === 'warm' ? 'font-serif' : 'font-sans'
      }`}>
        깊은 사유,<br/>새로운 관점
      </h1>
      <p className="text-lg text-text-muted font-sans mt-4">
        경주와 포항에서 매주 열리는 프라이빗 독서 클럽.
      </p>
    </section>
  )
}
```

**잘못된 예:**
```tsx
// ❌ Electric 모드에서 명조체 사용
<h1 className="font-serif text-4xl">깊은 사유</h1>
```

**올바른 예:**
```tsx
// ✅ 테마에 따라 폰트 분기
<h1 className={theme === 'warm' ? 'font-serif' : 'font-sans'}>
  깊은 사유
</h1>
```

### 7.4 로고 스타일

```tsx
// Electric
<div className="font-display text-lg font-extrabold text-[var(--text)]">
  ZIDOKHAE<span className="w-2 h-2 bg-[var(--accent)] rounded-full inline-block ml-1" />
</div>

// Warm
<div className="font-serif text-xl font-bold text-[var(--text)]">
  지독해.<span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Intellectual Ritual</span>
</div>
```

---

## 8. 컴포넌트 가이드

### 8.1 MY GROWTH 카드

> **문제:** 트로피 아이콘이 다크 배경에 묻혀서 안 보임
> **해결:** Lucide Trophy + Accent 색상 + Glow 효과

```tsx
// components/cards/GrowthCard.tsx
import { Trophy, Flame } from 'lucide-react'

export function GrowthCard() {
  return (
    <div className="relative rounded-2xl p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
      {/* 트로피 아이콘 - Lucide + Accent + Glow */}
      <Trophy 
        className="absolute top-5 right-5 text-[var(--accent)]"
        size={24}
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
      />
      
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-3">
        MY GROWTH
      </div>
      
      <h3 className="text-lg font-bold leading-snug mb-4">
        열정 배지<span className="text-slate-400">까지</span><br/>
        <span className="inline-flex items-center gap-1">
          2번 남았어요!
          <Flame size={16} className="text-orange-400" strokeWidth={1.5} />
        </span>
      </h3>
      
      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-slate-400">Progress</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: '60%' }} />
        </div>
        <span className="text-sm font-bold">60%</span>
      </div>
      
      <p className="text-[10px] text-slate-500">다음 달성 시: 멤버십 포인트 +500</p>
    </div>
  )
}
```

**스타일 명세:**

| 요소 | 값 |
|------|-----|
| 배경 | `linear-gradient(145deg, #1E293B, #0F172A)` |
| 트로피 아이콘 | Lucide `<Trophy />` + `text-accent` + `drop-shadow` |
| 불꽃 아이콘 | Lucide `<Flame />` |
| 라벨 | `text-accent` |
| Progress Bar | `bg-accent` |

### 8.2 D-3 카드 (Next Ritual)

> **문제:** Electric에서 라임 배경 + 라임 테두리 = 안 보임
> **해결:** 테마별 스타일 분리

```tsx
// components/cards/NextRitualCard.tsx
'use client'

import { useTheme } from '@/providers/ThemeProvider'

export function NextRitualCard() {
  const { theme } = useTheme()
  
  // Electric: 흰 배경 + 라임 테두리
  // Warm: 오렌지 배경
  const cardClass = theme === 'electric'
    ? 'bg-[var(--bg-surface)] border-2 border-[var(--accent)]'
    : 'bg-[var(--accent)]'
    
  const textClass = theme === 'electric'
    ? 'text-[var(--text)]'
    : 'text-white'
    
  const labelClass = theme === 'electric'
    ? 'text-[var(--primary)]'  // Cobalt, NOT Lime!
    : 'text-white/70'
  
  return (
    <div className={`rounded-2xl p-5 flex flex-col items-center justify-center text-center ${cardClass}`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${labelClass}`}>
        NEXT
      </div>
      <div className={`text-5xl font-black leading-none mb-2 ${textClass}`}>
        D-3
      </div>
      <p className={`text-xs ${theme === 'electric' ? 'text-[var(--text-muted)]' : 'text-white/80'}`}>
        1월 4주차 정기모임
      </p>
      <a href="#" className={`text-[11px] mt-3 underline ${textClass}`}>
        준비물 확인하기
      </a>
    </div>
  )
}
```

### 8.3 Session Card (Atmospheric)

```tsx
// components/cards/SessionCard.tsx
import { MapPin } from 'lucide-react'
import { Price } from '@/components/ui/Price'

export function SessionCard({ session }: { session: Session }) {
  return (
    <article 
      className="session-card cursor-pointer"
      onClick={() => openBottomSheet(session.id)}
    >
      {/* Atmospheric Cover */}
      <div className="session-cover relative h-32 rounded-xl overflow-hidden">
        <div 
          className="absolute inset-[-20px] bg-cover bg-center blur-[25px] saturate-[1.3] opacity-60"
          style={{ backgroundImage: `url(${session.bookCover})` }}
        />
        <img 
          src={session.bookCover} 
          className="relative z-10 h-28 mx-auto shadow-lg rounded"
        />
      </div>
      
      {/* Info */}
      <div className="session-info mt-3">
        <h3 className="font-bold text-[var(--text)]">{session.title}</h3>
        <p className="text-sm text-[var(--text-muted)]">{session.author}</p>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="flex items-center gap-1 text-[var(--text-muted)]">
            <MapPin size={14} strokeWidth={1.5} />
            {session.location}
          </span>
          <Price amount={session.price} />
        </div>
      </div>
    </article>
  )
}
```

### 8.4 Bottom Sheet

```tsx
// components/ui/BottomSheet.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react'
import { Price } from './Price'

export function BottomSheet({ isOpen, onClose, session }: BottomSheetProps) {
  if (!session) return null
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-[var(--overlay)] z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-[var(--bg-surface)] rounded-t-3xl z-[1001] max-h-[85vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-9 h-1 bg-[var(--border)] rounded-full mx-auto mt-3 mb-4" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--border)]"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Atmospheric Cover */}
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <div 
                  className="absolute inset-[-20px] bg-cover bg-center blur-[30px] saturate-[1.3] opacity-60"
                  style={{ backgroundImage: `url(${session.bookCover})` }}
                />
                <img 
                  src={session.bookCover} 
                  className="relative z-10 h-40 mx-auto shadow-xl rounded"
                />
              </div>
              
              <h2 className="text-xl font-bold text-[var(--text)] mb-1">{session.title}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{session.author}</p>
              
              {/* Details - Lucide 아이콘! */}
              <div className="flex flex-wrap gap-4 mb-5 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Calendar size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">{session.date}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Clock size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">{session.time}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <MapPin size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">{session.location}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Users size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">{session.participants}/{session.maxParticipants}명</strong>
                </span>
              </div>
              
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {session.description}
              </p>
            </div>
            
            {/* Sticky CTA */}
            <div className="p-6 border-t border-[var(--border)]">
              <button className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2">
                <Price amount={session.price} className="text-white" size="lg" />
                <span>으로 신청하기</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### 8.5 Sidebar (테마 토글 위치)

```tsx
// components/layout/Sidebar.tsx
'use client'

import { Zap, Calendar, Coffee, TrendingUp } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <aside className="w-[200px] h-screen sticky top-0 bg-[var(--bg-surface)] border-r border-[var(--border)] p-5 flex flex-col">
      {/* Logo */}
      <div className={`mb-8 ${theme === 'electric' ? 'font-display font-extrabold' : 'font-serif font-bold'}`}>
        {theme === 'electric' ? (
          <>ZIDOKHAE<span className="w-2 h-2 bg-[var(--accent)] rounded-full inline-block ml-1" /></>
        ) : (
          <>지독해.<span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-widest">Intellectual Ritual</span></>
        )}
      </div>
      
      {/* Navigation - Lucide 아이콘! */}
      <nav className="flex-1 space-y-1">
        <button className="nav-item flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-[var(--bg-base)]">
          <TrendingUp size={16} strokeWidth={1.5} />
          TRENDING
        </button>
        <button className="nav-item active flex items-center gap-2 w-full text-left p-2 rounded-lg bg-[var(--bg-base)]">
          <Calendar size={16} strokeWidth={1.5} />
          SESSIONS
        </button>
      </nav>
      
      {/* Theme Toggle - 사이드바 하단! Lucide 아이콘! */}
      <div className="pt-4 border-t border-[var(--border)]">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-sm font-semibold"
        >
          {theme === 'electric' ? (
            <>
              <Coffee size={16} strokeWidth={1.5} />
              <span>Warm Mode</span>
            </>
          ) : (
            <>
              <Zap size={16} strokeWidth={1.5} />
              <span>Electric Mode</span>
            </>
          )}
        </button>
      </div>
      
      {/* User */}
      <div className="mt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
          D
        </div>
        <div>
          <div className="text-sm font-bold">Danmuji</div>
          <div className="user-level text-[10px]">Lv.2 열정 멤버</div>
        </div>
      </div>
    </aside>
  )
}
```

### 8.6 환불/취소 Bottom Sheet (손실 회피)

> **피드백 반영:** 단순 취소 확인이 아닌, '놓치게 되는 가치'를 강조합니다.

**Copywriting:**
- **Title:** "정말 취소하시겠어요?"
- **Subtitle:** "지금 취소하시면 **[대기자 5명]**이 있어 다시 신청하기 어려울 수 있어요."
- **Actions:** `[그대로 유지하기(Primary)]` / `[취소하기(Ghost)]`

```tsx
// components/sheets/CancelSheet.tsx
export function CancelSheet({ waitlistCount }: { waitlistCount: number }) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-lg font-bold mb-2">정말 취소하시겠어요?</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        지금 취소하시면 <strong>대기자 {waitlistCount}명</strong>이 있어
        다시 신청하기 어려울 수 있어요.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-[var(--primary)] text-white rounded-xl font-semibold">
          그대로 유지하기
        </button>
        <button className="flex-1 py-3 border border-[var(--border)] rounded-xl text-[var(--text-muted)]">
          취소하기
        </button>
      </div>
    </div>
  )
}
```

### 8.7 테마 토글 버튼 (Mobile)

**위치:** 마이페이지(내 정보) 최상단 프로필 카드 우측
**형태:** 아이콘 + 텍스트 (직관적 인지)

```tsx
// 마이페이지 프로필 영역
import { Zap, Coffee } from 'lucide-react'

<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">My Profile</h1>
  <button
    onClick={toggleTheme}
    className="flex items-center gap-2 bg-bg-base px-3 py-1.5 rounded-full border border-border"
  >
    {theme === 'electric' ? (
      <Zap size={14} className="text-primary" />
    ) : (
      <Coffee size={14} className="text-accent" />
    )}
    <span className="text-xs font-semibold">
      {theme === 'electric' ? 'Electric' : 'Warm'}
    </span>
  </button>
</div>
```

---

## 9. 레이아웃 & UX Flow

### 9.1 One-Page Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Main Page (/)                                              │
│  ├── Bento Grid (Dashboard)                                 │
│  │   ├── Weekly Curator                                     │
│  │   ├── MY GROWTH                                          │
│  │   ├── LAST CALL                                          │
│  │   └── NEXT RITUAL (D-3)                                  │
│  │                                                          │
│  ├── Session List                                           │
│  │   ├── Tabs (정기/토론/번개)                               │
│  │   └── Session Cards → [Click] → Bottom Sheet            │
│  │                                                          │
│  └── FAB (MY PASS)                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Bottom Sheet (Overlay)                              │   │
│  │  ├── Session Detail                                  │   │
│  │  └── CTA: "[콩아이콘] 10,000콩으로 신청하기"          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Deep Link Strategy

```tsx
// app/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const searchParams = useSearchParams()
  const [sheetSession, setSheetSession] = useState<Session | null>(null)
  
  // Deep Link 감지
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      fetchSession(sessionId).then(setSheetSession)
    }
  }, [searchParams])
  
  return (
    <main>
      <BentoGrid />
      <SessionList onSessionClick={setSheetSession} />
      <FAB />
      <BottomSheet 
        isOpen={!!sheetSession} 
        onClose={() => setSheetSession(null)}
        session={sheetSession}
      />
    </main>
  )
}
```

### 9.3 3-Click Payment Flow

```
1. 카드 탭 → Bottom Sheet 오픈
2. 내용 확인
3. "[콩아이콘] 10,000콩으로 신청하기" 클릭 → Portone 결제창
```

---

## 10. 구현 가이드 (성능 최적화)

### 10.1 Warm Mode Noise 최적화

> **피드백 반영:** SVG 필터는 모바일 성능 저하(Jank)의 원인입니다.
> PNG 패턴으로 교체하고 Z-Index 안전하게 처리합니다.

**변경 전:** SVG Filter (`filter: url(#noise)`)
**변경 후:** 최적화된 PNG/WebP 패턴 이미지

```css
/* globals.css */
[data-theme="warm"] body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1; /* 콘텐츠 뒤로 보냄 (안전) - 터치 방해 금지 */
  background-image: url('/images/noise-pattern.png'); /* 100x100px 반복 패턴 */
  opacity: 0.06;
  pointer-events: none;
}
```

> **참고:** 현재 SVG 인라인 노이즈가 적용된 경우, 모바일에서 성능 이슈가 발생하면 이 방식으로 교체하세요.

### 10.2 폰트 로딩 최적화

> **피드백 반영:** 불필요한 폰트 로딩 방지.

- **Subset:** 한글 폰트는 반드시 `subsets: ['latin']` 외에 필요한 경우 로컬 폰트로 경량화된 버전 사용 고려
- **Warm Font 지연 로딩:** Noto Serif KR은 용량이 크므로, Warm 모드가 아닐 때는 로딩 우선순위를 낮추거나 Dynamic Import를 고려합니다. (Next.js의 기본 최적화 옵션 활용)

```tsx
// app/layout.tsx
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'], // 필요한 경우 preload false
  variable: '--font-noto-sans',
  display: 'swap',
})
```

### 10.3 폰트 로딩 전략 (Next.js Optimization)

> **중요:** `next/font`를 사용하여 폰트를 최적화하고 CSS Variable로 노출합니다.

```tsx
// app/layout.tsx
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/providers/ThemeProvider'
import './globals.css'

// Outfit - Electric 테마 로고/헤드라인용
// 방법 1: 로컬 폰트 (권장 - 성능 최적화)
const outfit = localFont({
  src: '../public/fonts/Outfit-Variable.woff2',
  variable: '--font-outfit',
  display: 'swap',
})

// 방법 2: Google Fonts (간편)
// import { Outfit } from 'next/font/google'
// const outfit = Outfit({
//   subsets: ['latin'],
//   variable: '--font-outfit',
//   display: 'swap',
// })

// Noto Sans KR - 본문용
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
})

// Noto Serif KR - Warm 테마 로고/헤드라인용
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="ko" 
      className={`${outfit.variable} ${notoSansKR.variable} ${notoSerifKR.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 10.4 Tailwind 설정 (Dark Mode 충돌 방지)

> **주의:** Warm 테마는 '어두운 테마(Dark Mode)'가 **아닙니다**. 미색 기반 라이트 테마입니다.
> Tailwind의 `darkMode` 옵션을 사용하면 `dark:` 클래스가 의도치 않게 작동할 수 있습니다.
> **해결:** `darkMode` 옵션을 제거하고, 철저히 CSS Variable로만 테마를 제어합니다.

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  // darkMode 옵션 사용 금지!
  // darkMode: ["class", '[data-theme="warm"]'],  // 이렇게 하지 마세요
  
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // 폰트 - CSS Variable 참조
      fontFamily: {
        display: ['var(--font-outfit)', 'var(--font-noto-sans)', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
      },
      
      // 색상 - CSS Variable 참조 (테마 전환용)
      colors: {
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
        
        // 시맨틱 컬러 (테마 무관, 고정값)
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      
      // Z-Index 계층 구조
      zIndex: {
        'base': '0',
        'card': '10',
        'sticky': '100',          // Sticky Header
        'fab': '200',             // Floating Action Button
        'dropdown': '300',        // Dropdown Menu
        'modal-overlay': '1000',  // Bottom Sheet Overlay
        'modal': '1001',          // Bottom Sheet Content
        'toast': '2000',          // Toast Notification
        'noise': '9999',          // Warm 테마 Noise Texture
      },
      
      // 그림자
      boxShadow: {
        'card': "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        'card-hover': "0 8px 24px rgba(0,0,0,0.1)",
        'sheet': "0 -4px 32px rgba(0,0,0,0.15)",
        'fab': "0 4px 14px rgba(0,0,0,0.15)",
      },
      
      // 모서리
      borderRadius: {
        DEFAULT: '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### 10.5 Z-Index 계층 구조

> **문제:** Bottom Sheet, FAB, Sticky Header 간 겹침 발생 가능
> **해결:** 명확한 계층 구조 정의

```
┌─────────────────────────────────────────────────────────────┐
│  Z-Index 계층 (낮음 → 높음)                                 │
├─────────────────────────────────────────────────────────────┤
│  z-base (0)         │ 일반 콘텐츠                           │
│  z-card (10)        │ 카드, Bento Grid                     │
│  z-sticky (100)     │ Sticky Header, Sidebar               │
│  z-fab (200)        │ MY PASS 플로팅 버튼                   │
│  z-dropdown (300)   │ 드롭다운 메뉴                         │
│  z-modal-overlay    │ Bottom Sheet 오버레이 (1000)         │
│  z-modal (1001)     │ Bottom Sheet 콘텐츠                  │
│  z-toast (2000)     │ Toast 알림                           │
│  z-noise (9999)     │ Warm 테마 노이즈 (pointer-events: none) │
└─────────────────────────────────────────────────────────────┘
```

**컴포넌트별 적용:**

```tsx
// Sticky Header
<header className="sticky top-0 z-sticky bg-bg-surface border-b border-border">

// FAB (MY PASS)
<button className="fixed bottom-6 right-6 z-fab rounded-full shadow-fab">

// Bottom Sheet Overlay
<motion.div className="fixed inset-0 z-modal-overlay bg-overlay">

// Bottom Sheet Content
<motion.div className="fixed bottom-0 z-modal bg-bg-surface">

// Toast
<div className="fixed top-4 right-4 z-toast">
```

### 10.6 ThemeProvider

```tsx
// providers/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'electric' | 'warm'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: 'electric', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('electric')
  
  useEffect(() => {
    const saved = localStorage.getItem('jidokhae-theme') as Theme
    if (saved) setTheme(saved)
  }, [])
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('jidokhae-theme', theme)
  }, [theme])
  
  const toggleTheme = () => setTheme(prev => prev === 'electric' ? 'warm' : 'electric')
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

### 10.7 globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base: #F8FAFC;
  --bg-surface: #FFFFFF;
  --primary: #0047FF;
  --accent: #CCFF00;
  --accent-readable: #0F172A;
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E2E8F0;
  --overlay: rgba(0, 0, 0, 0.5);
}

[data-theme="warm"] {
  --bg-base: #F5F5F0;
  --bg-surface: #FAFAF7;
  --primary: #0F172A;
  --accent: #EA580C;
  --accent-readable: #FFFFFF;
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E7E5E4;
  --overlay: rgba(15, 23, 42, 0.6);
}

/* Warm 테마 Noise Texture */
[data-theme="warm"] body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

body {
  background: var(--bg-base);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-24 | 2.1 | Deep Forest Green 단일 테마 |
| 2026-01-25 | 3.0 | Mood Switch 테마 시스템 도입 |
| 2026-01-25 | 3.1 | **No-Emoji 정책 적용** |
| | | - 모든 이모지 사용 금지 |
| | | - 콩: KongIcon (커스텀 SVG) |
| | | - 트로피: Lucide Trophy |
| | | - 기타: Lucide React 아이콘 |
| | | - 아이콘 시스템 섹션 추가 |
| | | - 테마 기본값: Electric |
| 2026-01-25 | 3.2 | **기술적 보완** |
| | | - next/font 폰트 로딩 전략 추가 |
| | | - Tailwind darkMode 충돌 방지 |
| | | - Z-Index 계층 구조 명확화 |
| 2026-01-25 | 3.3 | **규칙 명확화** |
| | | - 헤드라인 폰트 규칙 추가 (Electric=고딕, Warm=명조) |
| | | - 테마 토글 플로팅 버튼 금지 명시 |
| | | - 체크리스트 항목 보강 |
| 2026-02-01 | 3.4 | **전문가(BX, Tech, UX) 검토 반영** |
| | | - 핵심 가치: Atmospheric, Trust 추가 |
| | | - FOUC(깜빡임) 방지 Blocking Script 추가 |
| | | - Electric Accent 시인성 규칙 추가 (라임색 텍스트 금지) |
| | | - KongIcon 정밀 규격 (strokeWidth 1.5, baseline 보정) |
| | | - 콩 화폐 인지 부조화 해소 가이드 추가 |
| | | - 숫자/영문 폰트 분리 규칙 추가 |
| | | - 환불/취소 손실 회피 UX 추가 |
| | | - Noise 성능 최적화 (SVG → PNG 패턴) |
| | | - 체크리스트 3개 카테고리로 재구성 |
| 2026-02-05 | 3.5 | **문서 간 교차 검토 — 내부 불일치 해소** |
| | | - 10.1절 Noise opacity 0.05 → 0.06으로 통일 (3.4절·globals.css와 일치) |
| | | - borderRadius에 DEFAULT: '12px' 추가 (기술 스택 문서와 통일) |

---

## 체크리스트 (v3.4 업데이트)

### 시인성 & 디테일
- [ ] Electric 모드: 흰 배경 위 라임색 아이콘에 그림자/테두리가 있는가?
- [ ] KongIcon: Stroke Width가 1.5px로 Lucide와 동일한가?
- [ ] KongIcon: 텍스트 옆에서 수직 정렬(Baseline)이 어긋나지 않는가?
- [ ] 모든 UI 아이콘이 Lucide React인가? (이모지 없음)
- [ ] Electric 모드에서 헤드라인이 **고딕체**인가?
- [ ] Warm 모드에서 헤드라인이 **명조체**인가?

### UX & 심리
- [ ] 콩 화폐 가이드 (1콩=1원)가 최초 1회 또는 가격표 주변에 있는가?
- [ ] 결제 버튼 텍스트가 `...신청하기`로 유지되면서 금액이 명확한가?
- [ ] 취소 화면에 "놓치게 되는 가치(손실 회피)" 문구가 있는가?
- [ ] 테마 토글이 모바일 마이페이지 상단 등 찾기 쉬운 곳에 있는가?
- [ ] 테마 토글이 Desktop 사이드바 **맨 아래**에 있는가?
- [ ] **플로팅 토글 버튼이 없는가?** (좌측 하단 등)

### 성능 & 구현
- [ ] FOUC 방지 스크립트가 적용되었는가?
- [ ] Warm 모드 노이즈가 SVG 필터 대신 이미지 패턴인가? (또는 성능 문제 없음)
- [ ] 노이즈 레이어의 z-index가 -1 또는 pointer-events: none인가? (터치 방해 금지)
- [ ] 폰트 로딩 시 subset 설정이 되어 있는가?
- [ ] next/font로 폰트가 로드되는가?
- [ ] Tailwind에 darkMode 옵션이 없는가?
- [ ] Z-Index 계층이 올바른가? (FAB < Sheet)

---

*이 문서는 지독해 웹서비스의 디자인 표준 v3.4입니다.*