# 지독해 디자인 시스템 v2.1

> **"고요한 숲속의 서재 (The Silent Library)"**
>
> 깊이 있는 **포레스트 그린(Deep Forest)**이 지적인 신뢰감을 주고,
> **화이트(White)** 여백이 사색의 공간을 만듭니다.
> 가볍지 않은, 밀도 있는 커뮤니티를 지향합니다.

---

**문서 버전:** 2.1  
**작성일:** 2026-01-24  
**디자인 컨셉:** Intellectual Luxury & Deep Connection  
**기반 프레임워크:** Next.js 14 + React 18 + TypeScript  
**UI 라이브러리:** shadcn/ui + Framer Motion + Lucide React  

---

## 목차

1. [디자인 철학](#1-디자인-철학)
2. [색상 시스템](#2-색상-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [간격 시스템](#4-간격-시스템)
5. [그림자 & 깊이](#5-그림자--깊이)
6. [모서리(Radius)](#6-모서리radius)
7. [컴포넌트 가이드](#7-컴포넌트-가이드)
8. [애니메이션 시스템](#8-애니메이션-시스템)
9. [아이콘 시스템](#9-아이콘-시스템)
10. [반응형 디자인](#10-반응형-디자인)
11. [구현 가이드](#11-구현-가이드)

---

## 1. 디자인 철학

### 1.1 핵심 가치 (Core Values)

| 가치 | 설명 | Design Keyword |
|------|------|----------------|
| **Intellectual** | 지적이고 깊이 있는 | Serif Font, Deep Green |
| **Timeless** | 유행을 타지 않는 클래식함 | Minimal Layout, White Space |
| **Trustworthy** | 신뢰할 수 있는 무게감 | Solid Colors, No Gradients |
| **Human** | 사람의 온기 (차가움 배제) | Soft Shadows, Rounded Corners |

### 1.2 브랜드 무드보드

> **Aesop(이솝)**의 정갈함 + **Rolex(롤렉스)**의 무게감 + **Kinfolk(킨포크)**의 여백

우리는 "예약 서비스"가 아니라 **"멤버십 클럽"**처럼 보여야 합니다.
사용자가 앱을 켜는 순간, 시끄러운 도심에서 벗어나 조용한 서재 문을 열고 들어가는 느낌을 주어야 합니다.

### 1.3 브랜드 포지셔닝

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    가벼움                                         무게감    │
│      │                                             │        │
│      │                    ★ 지독해                 │        │
│      │            (Intellectual Luxury)            │        │
│      │                                             │        │
│    일반 모임앱 ──────────────────────────── 프라이빗 클럽   │
│                                                             │
│    화려함 ─────────────────────────────────────── 절제됨    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 참조 브랜드

- **Aesop**: 정갈한 타이포그래피, 절제된 색상
- **Rolex**: 시간이 지나도 변하지 않는 클래식함
- **Kinfolk**: 여백의 미학, 고요한 분위기
- **Apple**: 디테일에 대한 집착, 일관된 경험

---

## 2. 색상 시스템

### 2.1 Primary Palette: Deep Forest Green (주조색)

가볍게 날아가는 초록이 아닙니다. **검정에 가까운 묵직한 녹색**입니다.
British Racing Green에서 영감을 받은 클래식한 색상입니다.

```typescript
// tailwind.config.ts
colors: {
  brand: {
    50:  "#F2F5F3",  // 선택 상태 배경, 호버
    100: "#E6EBE7",  // 연한 배경
    200: "#CED6D0",  // 
    300: "#B5C1B8",  // 
    400: "#849688",  // 
    500: "#4A5D50",  // 장식용 (텍스트 사용 금지 - 대비율 부족)
    600: "#355E3B",  // ★ Primary CTA - Hunter Green
    700: "#2E4A35",  // Hover 상태
    800: "#2B362F",  // ★ Logo, Heading - Forest Black
    900: "#1F291F",  // Deep Dark
  }
}
```

| 용도 | 색상명 | Hex | Tailwind | 설명 |
|------|--------|-----|----------|------|
| 로고 / 헤드라인 | Forest Black | #2B362F | `text-brand-800` | 먹색에 가까운 깊은 녹색 |
| 메인 버튼 (CTA) | Hunter Green | #355E3B | `bg-brand-600` | 영국 클래식카의 우아함 |
| 버튼 호버 | Deep Moss | #2E4A35 | `hover:bg-brand-700` | 깊어지는 밀도감 |
| 선택/호버 배경 | Mist Green | #F2F5F3 | `bg-brand-50` | 새벽 숲의 안개 |

**접근성 대비율 (WCAG):**

| 조합 | 대비율 | 판정 |
|------|--------|------|
| #355E3B (버튼) + #FFFFFF (텍스트) | 7.14:1 | ✅ AAA 통과 |
| #2B362F (헤딩) + #FFFFFF (배경) | 10.5:1 | ✅ AAA 통과 |
| #355E3B + #F2F5F3 | 5.2:1 | ✅ AA 통과 |
| #4A5D50 (Brand-500) + #FFFFFF | 4.8:1 | ⚠️ 장식용만 |

> **주의:** Brand-500(#4A5D50)은 대비율이 부족하므로 **텍스트나 중요 UI에 사용 금지**. 장식용으로만 사용.

### 2.2 Secondary Accent: Terracotta (보조색)

테라코타는 완전히 버리지 않습니다. **"긴급함(마감임박)"**이나 **"따뜻한 감정(좋아요/칭찬)"**을 표현할 때만 제한적으로 사용합니다.

```typescript
accent: {
  50:  "#FDF8F6",  // 배경
  100: "#F5EBE6",  // 호버 배경
  500: "#B85C38",  // ★ 마감임박, 좋아요, 칭찬
  600: "#9F4A29",  // 호버
}
```

| 용도 | Tailwind | 설명 |
|------|----------|------|
| 마감임박 뱃지 | `bg-accent-50 text-accent-500` | 긴급함 표현 |
| 좋아요/칭찬 | `text-accent-500` | 따뜻한 감정 |
| 경고 알림 | `border-accent-500` | 주의 필요 |

### 2.3 Base & Background

메인 배경은 **순수한 화이트**를 유지합니다. 그린 틴트 배경(brand-50)은 섹션 구분이나 호버 상태에만 제한적으로 사용합니다.

```typescript
base: {
  white: "#FFFFFF",      // 카드, 메인 콘텐츠 배경
  background: "#FAFAFA", // 전체 페이지 배경 (웜 화이트)
  surface: "#F2F5F3",    // 섹션 구분용 (brand-50)
}
```

| 용도 | 색상 | Tailwind |
|------|------|----------|
| 카드 배경 | #FFFFFF | `bg-white` |
| 페이지 배경 | #FAFAFA | `bg-background` |
| 섹션 구분 | #F2F5F3 | `bg-brand-50` |
| 입력 필드 배경 | #FAFAFA | `bg-gray-50` |

### 2.4 Gray Scale (Warm Gray)

차가운 회색 대신 **따뜻한 웜그레이**를 사용합니다.

```typescript
gray: {
  50:  "#FAFAFA",  // 배경
  100: "#F5F5F5",  // 호버
  200: "#E5E5E5",  // 구분선, 테두리
  300: "#D4D4D4",  // 비활성
  400: "#A3A3A3",  // 플레이스홀더
  500: "#737373",  // 보조 텍스트
  600: "#525252",  // 본문 보조
  700: "#404040",  // 아이콘
  800: "#262626",  // 강조
  900: "#171717",  // 본문 (brand-800 대신 사용 가능)
}
```

### 2.5 Semantic Colors

상태를 나타내는 시맨틱 컬러입니다.

```typescript
semantic: {
  success: "#059669",  // 성공, 완료, 활성
  warning: "#D97706",  // 주의
  error:   "#DC2626",  // 에러, 삭제
  info:    "#2563EB",  // 정보 (최소 사용)
}
```

| 상태 | 색상 | 용도 |
|------|------|------|
| Success | #059669 | 결제 완료, 신청 성공, 활성 상태 |
| Warning | #D97706 | 주의 필요 (마감임박은 accent 사용) |
| Error | #DC2626 | 에러 메시지, 삭제 버튼 호버 |

### 2.6 색상 사용 원칙

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ❌ 하지 말 것                                              │
│   ─────────────                                             │
│   • Brand-500을 텍스트에 사용 (대비율 부족)                  │
│   • 그라데이션 사용                                          │
│   • 테라코타를 일반 CTA에 사용                               │
│   • 순수 검정(#000000) 사용                                  │
│   • brand-50을 메인 배경으로 전체 적용                       │
│                                                             │
│   ✅ 해야 할 것                                              │
│   ─────────────                                             │
│   • 메인 배경은 White 또는 #FAFAFA                          │
│   • CTA 버튼은 Brand-600 (Hunter Green)                     │
│   • 헤드라인은 Brand-800 (Forest Black)                     │
│   • 테라코타는 마감임박/좋아요에만                           │
│   • brand-50은 호버/선택 상태에만                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 타이포그래피

"지적인 분위기"를 위해 **명조체(Serif)**의 비중을 높입니다.

### 3.1 폰트 패밀리

| 폰트 | 용도 | CSS Variable |
|------|------|--------------|
| **Pretendard** | UI, 정보, 본문, 버튼 (가독성 담당) | `--font-pretendard` |
| **Noto Serif KR** | 헤드라인(H1), 인용구, 책 제목 (감성 담당) | `--font-serif` |

> **핵심 원칙:** 앱의 첫인상을 결정하는 메인 카피("함께 읽고, 성장해요")는 반드시 **Serif**로 처리하여 책의 물성을 시각화합니다.

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
}
```

### 3.2 타이포그래피 스케일

```css
/* globals.css - @layer utilities */

/* Display - 히어로 섹션 메인 카피 */
.text-display {
  @apply font-serif text-[32px] font-bold text-brand-800 leading-[1.3] tracking-[-0.02em];
}

/* H1 - 페이지 제목 */
.text-h1 {
  @apply font-serif text-[24px] font-bold text-brand-800 leading-[1.4] tracking-[-0.02em];
}

/* H2 - 섹션 제목 (정보성은 Sans) */
.text-h2 {
  @apply font-sans text-[20px] font-semibold text-brand-800 leading-[1.4];
}

/* H3 - 카드 제목, 소제목 */
.text-h3 {
  @apply font-sans text-[17px] font-medium text-brand-800 leading-[1.5];
}

/* Body - 본문 */
.text-body {
  @apply font-sans text-[15px] font-normal text-gray-700 leading-[1.65];
}

/* Body Small - 보조 본문 */
.text-body-sm {
  @apply font-sans text-[14px] font-normal text-gray-600 leading-[1.6];
}

/* Caption - 메타 정보 */
.text-caption {
  @apply font-sans text-[13px] font-normal text-gray-500 leading-[1.5];
}

/* Caption Small - 뱃지, 라벨 */
.text-caption-sm {
  @apply font-sans text-[12px] font-normal text-gray-400 leading-[1.4];
}

/* Quote - 인용구, 책 소개 */
.text-quote {
  @apply font-serif text-[18px] font-normal text-brand-600 leading-[1.8] italic
         border-l-2 border-brand-200 pl-4;
}
```

| 스타일 | Font | Size | Weight | Color | 용도 |
|--------|------|------|--------|-------|------|
| Display | Serif | 32px | Bold | brand-800 | 히어로 메인 카피 |
| H1 | Serif | 24px | Bold | brand-800 | 페이지 제목 |
| H2 | Sans | 20px | Semibold | brand-800 | 섹션 제목 |
| H3 | Sans | 17px | Medium | brand-800 | 카드 제목 |
| Body | Sans | 15px | Regular | gray-700 | 본문 |
| Body-sm | Sans | 14px | Regular | gray-600 | 보조 본문 |
| Caption | Sans | 13px | Regular | gray-500 | 메타 정보 |
| Quote | Serif | 18px | Regular | brand-600 | 인용구 |

### 3.3 기본 텍스트 렌더링

```css
body {
  font-family: var(--font-pretendard), system-ui, sans-serif;
  color: #404040; /* gray-700 - 기본 본문 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.015em;
}

/* 명조체는 자간을 더 좁혀야 단단해 보임 */
.font-serif {
  letter-spacing: -0.02em;
}
```

---

## 4. 간격 시스템

"여백이 곧 럭셔리다." — 정보가 빽빽하면 '전단지' 같고, 여유로우면 '초대장' 같습니다.

### 4.1 8px 기반 스케일 (확장)

기존 8px 그리드를 유지하되, **섹션 간의 간격**을 과감하게 늘립니다.

```typescript
spacing: {
  'xs':  '4px',   // 1   (아이콘-텍스트 간격)
  'sm':  '8px',   // 2   (요소 내부 작은 간격)
  'md':  '16px',  // 4   (기본 간격)
  'lg':  '24px',  // 6   (카드 내부 패딩) ★ 기존 20px에서 확대
  'xl':  '32px',  // 8   (섹션 내 간격)
  '2xl': '48px',  // 12  (섹션 간 간격) ★ 시원한 호흡
  '3xl': '64px',  // 16  (히어로 영역)
  '4xl': '96px',  // 24  (랜딩 페이지 섹션)
}
```

| Token | Value | Tailwind | 용도 |
|-------|-------|----------|------|
| xs | 4px | `gap-1`, `p-1` | 아이콘-텍스트, 뱃지 내부 |
| sm | 8px | `gap-2`, `p-2` | 요소 간 작은 간격 |
| md | 16px | `gap-4`, `p-4` | 기본 간격 |
| lg | 24px | `gap-6`, `p-6` | **카드 내부 패딩** ★ |
| xl | 32px | `gap-8`, `p-8` | 섹션 내 간격 |
| 2xl | 48px | `gap-12`, `py-12` | **섹션 간 간격** ★ |
| 3xl | 64px | `gap-16`, `py-16` | 히어로 영역 |

### 4.2 간격 사용 가이드

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                    p-4 (16px) 좌우  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ↕ py-12 (48px) - 섹션 시작                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  카드                                   p-6 (24px)  │   │
│  │                                                     │   │
│  │  제목 (H3)                                          │   │
│  │  ↕ mb-4 (16px)                                      │   │
│  │  정보 리스트                            gap-3 (12px)│   │
│  │    📅 날짜                                          │   │
│  │    📍 장소                                          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ↕ 카드 간격: gap-4 (16px)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  다음 카드                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ↕ py-12 (48px) - 섹션 종료                                 │
├─────────────────────────────────────────────────────────────┤
│  다음 섹션                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 그림자 & 깊이

### 5.1 그림자 토큰

종이 질감을 흉내 낸 **확산형 그림자**를 사용합니다. 브랜드 그린 색조를 섞어 통일감을 줍니다.

```typescript
// tailwind.config.ts
boxShadow: {
  'none': 'none',
  'xs': '0 1px 2px rgba(43, 54, 47, 0.04)',
  'sm': '0 1px 3px rgba(43, 54, 47, 0.06), 0 1px 2px rgba(43, 54, 47, 0.04)',
  'card': '0 1px 3px rgba(43, 54, 47, 0.04), 0 4px 12px rgba(43, 54, 47, 0.06)',
  'card-hover': '0 4px 8px rgba(43, 54, 47, 0.08), 0 16px 32px rgba(43, 54, 47, 0.08)',
  'elegant': '0 2px 4px rgba(43, 54, 47, 0.02), 0 12px 24px rgba(43, 54, 47, 0.06)',
  'modal': '0 10px 40px rgba(43, 54, 47, 0.15), 0 0 0 1px rgba(43, 54, 47, 0.05)',
  'button': '0 2px 8px rgba(53, 94, 59, 0.25)',
  'button-hover': '0 4px 14px rgba(53, 94, 59, 0.35)',
}
```

| Token | 용도 | 설명 |
|-------|------|------|
| `shadow-card` | 카드 기본 | 종이가 살짝 떠있는 느낌 |
| `shadow-card-hover` | 카드 호버 | 더 높이 떠오름 |
| `shadow-elegant` | 프리미엄 카드 | 부드럽게 퍼지는 그림자 |
| `shadow-modal` | 모달/다이얼로그 | 오버레이 위 팝업 |
| `shadow-button` | CTA 버튼 | 브랜드 그린 색조 |

### 5.2 깊이 레이어 (Z-Index)

```typescript
zIndex: {
  'base': 0,
  'dropdown': 10,
  'sticky': 20,
  'header': 50,
  'overlay': 100,
  'modal': 200,
  'toast': 300,
}
```

---

## 6. 모서리(Radius)

### 6.1 Radius 토큰

```typescript
borderRadius: {
  'none': '0',
  'sm': '6px',    // 뱃지, 작은 버튼
  'md': '12px',   // 버튼, 입력 필드
  'lg': '16px',   // 카드
  'xl': '20px',   // 배너, 큰 카드
  '2xl': '24px',  // 모달
  'full': '9999px',
}
```

| Token | Value | 용도 |
|-------|-------|------|
| sm | 6px | 뱃지, 태그 |
| md | 12px | 버튼, 입력 필드 |
| lg | 16px | 카드 |
| xl | 20px | 배너, 히어로 이미지 |
| 2xl | 24px | 모달, 바텀시트 |

---

## 7. 컴포넌트 가이드

### 7.1 버튼 (Button) - The Green Stamp

버튼은 화면의 무게중심을 잡는 **인장(Stamp)** 역할을 합니다.

**Primary Button (Deep Green)**
```tsx
<button className="
  bg-brand-600 text-white 
  rounded-xl px-6 py-4 
  font-semibold 
  shadow-button
  hover:bg-brand-700 hover:shadow-button-hover hover:-translate-y-[1px]
  active:scale-[0.98] active:translate-y-0
  transition-all duration-200
  disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed
">
  신청하기
</button>
```

**Secondary Button (Outline)**
```tsx
<button className="
  bg-white text-brand-700
  border border-brand-200
  rounded-xl px-6 py-4
  font-medium
  hover:bg-brand-50 hover:border-brand-300
  active:scale-[0.98]
  transition-all duration-200
">
  자세히 보기
</button>
```

**Ghost Button**
```tsx
<button className="
  bg-transparent text-gray-600
  rounded-md px-4 py-2
  font-medium
  hover:bg-gray-100 hover:text-gray-900
  transition-all duration-150
">
  취소
</button>
```

**버튼 상태 명세:**

| 상태 | Primary | Secondary |
|------|---------|-----------|
| Default | bg-brand-600 | bg-white, border-brand-200 |
| Hover | bg-brand-700, translateY(-1px) | bg-brand-50 |
| Active | scale(0.98) | scale(0.98) |
| Disabled | bg-gray-300 | opacity-50 |

### 7.2 카드 (Card) - The Book Cover

카드는 **테두리를 없애고(borderless)**, 배경색과의 미세한 명도 차이와 그림자로만 구분합니다.

```tsx
// 기본 카드
<div className="
  bg-white rounded-2xl p-6 
  shadow-card
  transition-all duration-300
">
  {/* Card Content */}
</div>

// 호버 가능한 카드
<motion.div
  className="bg-white rounded-2xl p-6 shadow-card cursor-pointer"
  whileHover={{ y: -4, boxShadow: "0 4px 8px rgba(43,54,47,0.08), 0 16px 32px rgba(43,54,47,0.08)" }}
  whileTap={{ scale: 0.995 }}
  transition={{ duration: 0.2 }}
>
  {/* Card Content */}
</motion.div>
```

**카드 스타일 명세:**

| 속성 | 값 |
|------|-----|
| Background | white |
| Border | none (borderless) |
| Border Radius | 16px (lg) → 24px (2xl) 권장 |
| Padding | 24px (p-6) |
| Shadow | shadow-card |
| Hover Shadow | shadow-card-hover |
| Hover Transform | translateY(-4px) |

### 7.3 뱃지 (Badge) - Minimal & Functional

뱃지는 화려함을 빼고 **정보 전달에 집중**합니다.

```tsx
const badgeVariants = {
  default: "bg-brand-50 text-brand-700 border-transparent",      // 기본 (차분한 녹색)
  highlight: "bg-brand-100 text-brand-800 border-transparent",   // 강조
  urgent: "bg-accent-50 text-accent-500 border-transparent",     // 마감임박 (테라코타)
  closed: "bg-gray-100 text-gray-400 border-transparent",        // 마감
  success: "bg-green-50 text-success border-transparent",        // 성공
}

const badgeBase = "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md"
```

**뱃지 매핑:**

| 상태 | 스타일 | 색상 |
|------|--------|------|
| 모집중 | default | 차분한 녹색 (brand-50/700) |
| 이번 주 | highlight | 진한 녹색 (brand-100/800) |
| 마감임박 | urgent | 테라코타 (accent-50/500) |
| 마감 | closed | 회색 (gray-100/400) |

**뱃지 사용 규칙:**
- 카드당 **최대 2개**까지만 표시
- 테라코타는 "마감임박"에만 사용
- 일반 상태는 그린 계열로 통일

### 7.4 입력 필드 (Input)

```tsx
const inputBase = cn(
  "w-full px-4 py-3.5",
  "bg-gray-50 border border-transparent rounded-xl",
  "text-[15px] text-gray-900 placeholder:text-gray-400",
  "transition-all duration-200",
  "focus:outline-none focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
)
```

**입력 필드 상태:**

| 상태 | Background | Border | Ring |
|------|------------|--------|------|
| Default | gray-50 | transparent | none |
| Focus | white | brand-600 | brand-100 |
| Error | white | error | red-100 |
| Disabled | gray-100 | transparent | none |

### 7.5 모달 (Dialog)

```tsx
// 모달 오버레이
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// 모달 컨텐츠
const contentVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 25 }
  },
}
```

**모달 스타일 명세:**

| 속성 | 값 |
|------|-----|
| Overlay | rgba(43, 54, 47, 0.4) + backdrop-blur(4px) |
| Background | white |
| Border Radius | 24px (2xl) |
| Shadow | shadow-modal |
| Max Width | 400px |
| Padding | 24px |

---

## 8. 애니메이션 시스템

"무겁지만, 움직임은 섬세하게" — 브랜드 컬러가 어둡기 때문에, 움직임이 **고급 세단이 멈추듯** 부드러운 감속을 적용합니다.

### 8.1 Framer Motion 설정

```tsx
// lib/animations.ts

// Luxury Spring - 부드러운 감속
export const luxurySpring = {
  type: "spring",
  stiffness: 200,  // 텐션을 낮춰서 부드럽게
  damping: 25,     // 잔진동 없이 깔끔하게 멈춤
}

export const transitions = {
  fast: { duration: 0.15, ease: "easeOut" },
  normal: { duration: 0.2, ease: "easeOut" },
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  luxury: luxurySpring,
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: transitions.smooth,
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,  // 약간 느리게 (기존 0.08)
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: luxurySpring,
}
```

### 8.2 애니메이션 가이드

| 유형 | Duration | Easing | 용도 |
|------|----------|--------|------|
| Micro | 150ms | ease-out | 버튼 클릭, 토글 |
| Small | 200ms | ease-out | 호버, 포커스 |
| Medium | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | 모달, 드롭다운 |
| Luxury | spring (200/25) | spring | 카드 호버, 페이지 전환 |

### 8.3 인터랙션별 애니메이션

**카드 호버:**
```tsx
<motion.div
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.995 }}
  transition={luxurySpring}
>
```

**버튼 클릭:**
```tsx
<motion.button
  whileHover={{ y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
```

**리스트 Stagger:**
```tsx
<motion.ul variants={staggerContainer} initial="initial" animate="animate">
  {items.map((item) => (
    <motion.li key={item.id} variants={staggerItem}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

---

## 9. 아이콘 시스템

### 9.1 Lucide React 설정

**Lucide React**를 사용하되, 선 두께(Stroke Width)를 조절하여 브랜드의 무게감을 맞춥니다.

```bash
npm install lucide-react
```

### 9.2 아이콘 스타일 가이드

| 속성 | 값 | 설명 |
|------|-----|------|
| Stroke Width | 1.5px (데스크톱), 1.75px (모바일) | 기본 2px보다 얇게 |
| Color | brand-800 (#2B362F) | 순수 검정 절대 금지 |

> **주의:** 순수 검정(#000000)은 사용하지 않습니다. 항상 `brand-800` 또는 `gray-700`을 사용하세요.

### 9.3 아이콘 크기 가이드

```tsx
const iconSizes = {
  xs: 14,  // Caption과 함께
  sm: 16,  // Body-sm과 함께
  md: 18,  // Body와 함께
  lg: 20,  // H3와 함께
  xl: 24,  // H2, H1과 함께
  '2xl': 32, // Display와 함께
}
```

### 9.4 주요 아이콘 매핑

| 용도 | Lucide 아이콘 | 크기 |
|------|---------------|------|
| 날짜/일정 | `<Calendar />` | 18px |
| 장소 | `<MapPin />` | 18px |
| 참가자 | `<Users />` | 18px |
| 메뉴 | `<Menu />` | 24px |
| 닫기 | `<X />` | 20px |
| 뒤로가기 | `<ArrowLeft />` | 20px |
| 수정 | `<Pencil />` | 16px |
| 삭제 | `<Trash2 />` | 16px |
| 설정 | `<Settings />` | 20px |
| 알림 | `<Bell />` | 20px |
| 책 | `<BookOpen />` | 20px |
| 배지/트로피 | `<Award />` | 20px |

### 9.5 아이콘 사용 예시

```tsx
import { Calendar, MapPin, Users } from 'lucide-react'

function MeetingInfo() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-gray-600">
        <Calendar className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span className="text-body">1월 25일 (일) 14:00</span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <MapPin className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span className="text-body">경주시 황성동 스타벅스 2층</span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Users className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span className="text-body">0명 참여</span>
      </div>
    </div>
  )
}
```

---

## 10. 반응형 디자인

### 10.1 브레이크포인트

모바일 퍼스트 접근. 지독해는 **모바일 중심** 서비스입니다.

```typescript
screens: {
  'sm': '480px',   // 모바일 (기본)
  'md': '768px',   // 태블릿
  'lg': '1024px',  // 데스크톱
}
```

### 10.2 레터박스 UI (데스크톱)

데스크톱에서는 모바일 레이아웃을 유지하며 중앙 정렬합니다.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100">
        <div className="mx-auto max-w-[480px] min-h-screen bg-white shadow-[0_0_40px_rgba(43,54,47,0.08)]">
          {children}
        </div>
      </body>
    </html>
  )
}
```

### 10.3 터치 타겟

모바일 접근성을 위한 최소 터치 영역:

| 요소 | 최소 크기 |
|------|----------|
| 버튼 | 44px × 44px |
| 리스트 아이템 | 높이 48px 이상 |
| 아이콘 버튼 | 40px × 40px |
| 체크박스/라디오 | 24px × 24px (터치 영역 40px) |

---

## 11. 구현 가이드

### 11.1 tailwind.config.ts 전체

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Palette (Deep Forest Green)
        brand: {
          50:  "#F2F5F3",
          100: "#E6EBE7",
          200: "#CED6D0",
          300: "#B5C1B8",
          400: "#849688",
          500: "#4A5D50",  // 장식용만 (텍스트 금지)
          600: "#355E3B",  // ★ Primary CTA
          700: "#2E4A35",  // Hover
          800: "#2B362F",  // ★ Logo, Heading
          900: "#1F291F",
        },
        // Accent (Terracotta - 제한적 사용)
        accent: {
          50:  "#FDF8F6",
          100: "#F5EBE6",
          500: "#B85C38",  // 마감임박, 좋아요
          600: "#9F4A29",
        },
        // Base
        white: "#FFFFFF",
        background: "#FAFAFA",
        // Gray (Warm)
        gray: {
          50:  "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Semantic
        success: "#059669",
        warning: "#D97706",
        error: "#DC2626",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(43, 54, 47, 0.04)',
        'sm': '0 1px 3px rgba(43, 54, 47, 0.06), 0 1px 2px rgba(43, 54, 47, 0.04)',
        'card': '0 1px 3px rgba(43, 54, 47, 0.04), 0 4px 12px rgba(43, 54, 47, 0.06)',
        'card-hover': '0 4px 8px rgba(43, 54, 47, 0.08), 0 16px 32px rgba(43, 54, 47, 0.08)',
        'elegant': '0 2px 4px rgba(43, 54, 47, 0.02), 0 12px 24px rgba(43, 54, 47, 0.06)',
        'modal': '0 10px 40px rgba(43, 54, 47, 0.15), 0 0 0 1px rgba(43, 54, 47, 0.05)',
        'button': '0 2px 8px rgba(53, 94, 59, 0.25)',
        'button-hover': '0 4px 14px rgba(53, 94, 59, 0.35)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### 11.2 globals.css 전체

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== CSS Variables ===== */
:root {
  --background: #FAFAFA;
  --foreground: #404040;
  
  --font-pretendard: 'Pretendard', system-ui, sans-serif;
  --font-noto-serif: 'Noto Serif KR', Georgia, serif;
}

/* ===== Base Styles ===== */
body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-pretendard);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.015em;
}

/* ===== Typography Utilities ===== */
@layer utilities {
  .text-display {
    @apply font-serif text-[32px] font-bold text-brand-800 leading-[1.3] tracking-[-0.02em];
  }
  .text-h1 {
    @apply font-serif text-[24px] font-bold text-brand-800 leading-[1.4] tracking-[-0.02em];
  }
  .text-h2 {
    @apply font-sans text-[20px] font-semibold text-brand-800 leading-[1.4];
  }
  .text-h3 {
    @apply font-sans text-[17px] font-medium text-brand-800 leading-[1.5];
  }
  .text-body {
    @apply font-sans text-[15px] font-normal text-gray-700 leading-[1.65];
  }
  .text-body-sm {
    @apply font-sans text-[14px] font-normal text-gray-600 leading-[1.6];
  }
  .text-caption {
    @apply font-sans text-[13px] font-normal text-gray-500 leading-[1.5];
  }
  .text-caption-sm {
    @apply font-sans text-[12px] font-normal text-gray-400 leading-[1.4];
  }
  .text-quote {
    @apply font-serif text-[18px] font-normal text-brand-600 leading-[1.8] italic
           border-l-2 border-brand-200 pl-4;
  }
}

/* ===== Component Base Styles ===== */
@layer components {
  /* Card */
  .card-base {
    @apply bg-white rounded-2xl p-6 shadow-card transition-all duration-300;
  }
  .card-hoverable {
    @apply card-base hover:-translate-y-1 hover:shadow-card-hover cursor-pointer active:scale-[0.995];
  }
  
  /* Button */
  .btn-primary {
    @apply bg-brand-600 text-white font-semibold rounded-xl px-6 py-4
    shadow-button
    hover:bg-brand-700 hover:shadow-button-hover hover:-translate-y-[1px]
    active:scale-[0.98] active:translate-y-0 transition-all duration-200
    disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-white text-brand-700 font-medium rounded-xl px-6 py-4
    border border-brand-200
    hover:bg-brand-50 hover:border-brand-300
    active:scale-[0.98] transition-all duration-200;
  }
  .btn-ghost {
    @apply bg-transparent text-gray-600 font-medium rounded-md px-4 py-2
    hover:bg-gray-100 hover:text-gray-900
    transition-all duration-150;
  }
  .btn-link {
    @apply bg-transparent text-brand-600 font-medium p-0
    hover:text-brand-700 hover:underline transition-all duration-150;
  }
  
  /* Badge */
  .badge {
    @apply inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md
    bg-brand-50 text-brand-700;
  }
  .badge-highlight {
    @apply badge bg-brand-100 text-brand-800;
  }
  .badge-urgent {
    @apply badge bg-accent-50 text-accent-500;
  }
  .badge-closed {
    @apply badge bg-gray-100 text-gray-400;
  }
  .badge-success {
    @apply badge bg-green-50 text-success;
  }
  
  /* Input */
  .input-base {
    @apply w-full px-4 py-3.5 text-[15px] text-gray-900
    bg-gray-50 border border-transparent rounded-xl
    placeholder:text-gray-400
    transition-all duration-200
    focus:outline-none focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100
    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed;
  }
  .input-error {
    @apply input-base bg-white border-error focus:ring-red-100;
  }
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #CED6D0;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #B5C1B8;
}
```

### 11.3 shadcn/ui 설치 및 커스터마이징

```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 필요한 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
```

설치 후 `components/ui/` 폴더의 파일들을 디자인 시스템에 맞게 커스터마이징합니다.

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-24 | 2.0 | 디자인 시스템 v2.0 - White & Terracotta |
| 2026-01-24 | 2.1 | **Deep Forest Green 리브랜딩** |
| | | - 브랜드 컬러: Terracotta → Deep Forest Green (#355E3B) |
| | | - 헤드라인 컬러: Forest Black (#2B362F) |
| | | - Serif 폰트 비중 확대 (헤드라인에 Noto Serif KR) |
| | | - 테라코타는 마감임박/좋아요에만 제한적 사용 |
| | | - 카드 패딩 확대 (p-5 → p-6) |
| | | - 섹션 간격 확대 (gap-8 → gap-12) |
| | | - 그림자에 브랜드 그린 색조 적용 |
| | | - 애니메이션 Luxury Spring 추가 |
| | | - 아이콘 Stroke Width 1.5px로 조정 |

---

## 부록: 리디자인 체크리스트

### v2.1 적용 시 확인 사항

**색상:**
- [ ] 모든 CTA 버튼이 Brand-600 (#355E3B)으로 변경되었는가?
- [ ] 헤드라인이 Brand-800 (#2B362F)으로 변경되었는가?
- [ ] 테라코타가 마감임박/좋아요에만 사용되었는가?
- [ ] Brand-500은 텍스트에 사용되지 않았는가?
- [ ] 순수 검정(#000000)이 사용되지 않았는가?

**타이포그래피:**
- [ ] 메인 카피/페이지 제목에 Noto Serif KR이 적용되었는가?
- [ ] 명조체에 letter-spacing: -0.02em이 적용되었는가?

**레이아웃:**
- [ ] 카드 패딩이 p-6 (24px)으로 변경되었는가?
- [ ] 섹션 간격이 gap-12 (48px)로 변경되었는가?

**컴포넌트:**
- [ ] 카드가 borderless + shadow-card 스타일인가?
- [ ] 뱃지가 2개 이하로 제한되었는가?
- [ ] 입력 필드 포커스 시 brand-600 테두리가 적용되는가?

**아이콘:**
- [ ] Lucide 아이콘 strokeWidth가 1.5px인가?
- [ ] 아이콘 색상이 brand-800 또는 gray-700인가?

---

*이 문서는 지독해 웹서비스의 디자인 표준을 정의합니다. 모든 UI 개발은 이 문서를 기준으로 진행해주세요.*
