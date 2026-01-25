# 지독해 디자인 시스템 v3.2

> **"낮과 밤의 서재 (Day & Night Library)"**
>
> 사용자가 원하는 무드를 선택할 수 있습니다.
> **Electric Mode** — 힙하고 에너지 넘치는 독서 라운지
> **Warm Mode** — 차분하고 지적인 클래식 서재

---

**문서 버전:** 3.2  
**작성일:** 2026-01-25  
**디자인 컨셉:** Mood-Switchable Reading Club  
**기반 프레임워크:** Next.js 14 + React 18 + TypeScript  
**UI 라이브러리:** shadcn/ui + Framer Motion + Lucide React  

---

## 목차

1. [No-Emoji 정책](#1-no-emoji-정책)
2. [디자인 철학](#2-디자인-철학)
3. [테마 시스템](#3-테마-시스템)
4. [색상 시스템](#4-색상-시스템)
5. [아이콘 시스템](#5-아이콘-시스템)
6. [콩(Kong) 화폐 시스템](#6-콩kong-화폐-시스템)
7. [타이포그래피](#7-타이포그래피)
8. [컴포넌트 가이드](#8-컴포넌트-가이드)
9. [레이아웃 & UX Flow](#9-레이아웃--ux-flow)
10. [구현 가이드](#10-구현-가이드)

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
| **Switchable** | 사용자가 원하는 무드를 직접 선택 |
| **Frictionless** | 3-Click으로 모임 신청 완료 |
| **Instagrammable** | 경주/포항 2030이 공유하고 싶은 디자인 |
| **One-Page** | 페이지 이동 없이 Bottom Sheet로 해결 |

### 2.2 두 가지 무드

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Electric Mode (Default)                                   │
│   ───────────────────────                                   │
│   • 힙하고 에너지 넘치는 독서 라운지                         │
│   • Cobalt Blue + Acid Lime                                 │
│   • 경주/포항 2030의 "인스타 감성"                          │
│   • 토스, 당근마켓 같은 현대적 느낌                          │
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

## 3. 테마 시스템

### 3.1 테마 전환 위치

> **중요:** 테마 토글은 **데모용 상단 패널에 두지 않습니다.**

**실제 구현 위치:**
- **Desktop:** 사이드바 하단 (Theme Switch 버튼)
- **Mobile:** MY 탭 > 설정 섹션 또는 헤더 우측 아이콘
- **저장:** `localStorage`에 사용자 선호 테마 저장

```tsx
// 테마 토글 버튼 예시 (Lucide 아이콘 사용!)
import { Zap, Coffee } from 'lucide-react'

<button onClick={toggleTheme} className="theme-switch-btn">
  {theme === 'electric' ? <Coffee size={16} /> : <Zap size={16} />}
  <span>{theme === 'electric' ? 'Warm Mode' : 'Electric Mode'}</span>
</button>
```

### 3.2 CSS Variables 구조

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

### 3.3 테마별 핵심 차이

| 요소 | Electric | Warm |
|------|----------|------|
| 배경 | `#F8FAFC` Light Gray | `#F5F5F0` Sand + Noise |
| Primary | `#0047FF` Cobalt | `#0F172A` Navy |
| Accent | `#CCFF00` Lime | `#EA580C` Orange |
| 로고 색상 | `#0F172A` Navy | `#0F172A` Navy |
| 폰트 (로고) | Outfit (Sans) | Noto Serif KR |
| Noise Texture | 없음 | opacity: 0.06 |

---

## 4. 색상 시스템

### 4.1 Electric Theme 팔레트

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

### 4.2 Warm Theme 팔레트

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

### 4.3 Accent 색상 가독성 규칙

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

## 5. 아이콘 시스템

### 5.1 Lucide React 설정

```bash
npm install lucide-react
```

### 5.2 아이콘 스타일 가이드

| 속성 | 값 | 설명 |
|------|-----|------|
| size | 16-24px | 용도에 따라 조절 |
| strokeWidth | 1.5 | 기본 2px보다 얇게 |
| color | `currentColor` | 부모 요소의 text 색상 상속 |

### 5.3 아이콘 매핑 테이블

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

### 5.4 사용 예시

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

### 6.1 콩 아이콘 (커스텀 SVG)

```tsx
// components/icons/KongIcon.tsx
interface KongIconProps {
  className?: string
  size?: number
}

export function KongIcon({ className = '', size = 16 }: KongIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      width={size}
      height={size}
      fill="currentColor"
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

### 6.2 가격 표시 컴포넌트

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

### 6.3 사용 예시

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

## 7. 타이포그래피

### 7.1 폰트 패밀리

| 폰트 | Electric | Warm |
|------|----------|------|
| **로고** | Outfit (Bold) | Noto Serif KR |
| **제목** | Outfit / Noto Sans KR | Noto Serif KR |
| **본문** | Noto Sans KR | Noto Sans KR |

```typescript
fontFamily: {
  display: ['Outfit', 'Noto Sans KR', 'sans-serif'],
  serif: ['Noto Serif KR', 'Georgia', 'serif'],
  sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],
}
```

### 7.2 로고 스타일

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

## 10. 구현 가이드

### 10.1 폰트 로딩 전략 (Next.js Optimization)

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

### 10.2 Tailwind 설정 (Dark Mode 충돌 방지)

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

### 10.3 Z-Index 계층 구조

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

### 10.5 ThemeProvider

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

### 10.6 globals.css

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

---

## 체크리스트

### No-Emoji
- [ ] 코드 전체에 이모지가 없는가?
- [ ] 콩 아이콘이 KongIcon SVG인가?
- [ ] 트로피 아이콘이 Lucide Trophy인가?
- [ ] 모든 UI 아이콘이 Lucide React인가?

### 테마
- [ ] 기본 테마가 Electric인가?
- [ ] 테마 토글이 사이드바 하단에 있는가?
- [ ] 테마 토글 아이콘이 Lucide (Zap/Coffee)인가?

### 기술적 설정
- [ ] next/font로 폰트가 로드되는가?
- [ ] Tailwind에 darkMode 옵션이 없는가?
- [ ] Z-Index 계층이 올바른가? (FAB < Sheet)

### Electric 테마
- [ ] 로고 색상이 Navy(#0F172A)인가?
- [ ] D-3 카드가 흰 배경 + 라임 테두리인가?
- [ ] 섹션 라벨이 Cobalt Blue인가?

### MY GROWTH 카드
- [ ] 트로피가 Lucide Trophy인가?
- [ ] drop-shadow glow가 적용되었는가?

### 콩 화폐
- [ ] 모든 가격이 "[콩SVG] N콩" 형식인가?
- [ ] "P" 단위가 없는가?

---

*이 문서는 지독해 웹서비스의 디자인 표준 v3.2입니다.*
