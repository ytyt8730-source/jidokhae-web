# 디자인 시스템

## 브랜드 톤

> 따뜻하고 편안하면서도, 고급스럽고 진지하게 느껴지는 분위기.
> 가볍게 소비되는 모임이 아니라, 가치 있는 시간을 함께하는 커뮤니티라는 인상.

---

## 컬러 팔레트

### 메인 컬러 (Warm Palette)

```css
/* tailwind.config.ts에 정의됨 */
--color-warm-50: #fdfcfa;   /* 배경 - 가장 밝은 톤 */
--color-warm-100: #f9f6f1;  /* 카드 배경 */
--color-warm-200: #f0e8db;  /* 구분선, 비활성 */
--color-warm-300: #e3d5c1;  /* 보조 UI */
--color-warm-400: #c9b698;  /* 아이콘, 플레이스홀더 */
--color-warm-500: #a69070;  /* 중간 강조 */
--color-warm-600: #8b7355;  /* 주요 텍스트 (보조) */
--color-warm-700: #6f5a42;  /* 본문 텍스트 */
--color-warm-800: #574733;  /* 제목 텍스트 */
--color-warm-900: #3d3224;  /* 강조 텍스트 */
```

### 브랜드 컬러 (Accent)

```css
--color-brand-500: #4a6741;  /* 메인 브랜드 컬러 - 숲/자연 */
--color-brand-600: #3d5636;  /* 브랜드 호버 */
--color-brand-700: #31452b;  /* 브랜드 액티브 */
```

### 상태 컬러

```css
/* 성공 */
--color-success: #22c55e;
--color-success-bg: #f0fdf4;

/* 경고 */
--color-warning: #eab308;
--color-warning-bg: #fefce8;

/* 에러 */
--color-error: #ef4444;
--color-error-bg: #fef2f2;

/* 정보 */
--color-info: #3b82f6;
--color-info-bg: #eff6ff;
```

---

## 타이포그래피

### 폰트 스택

```css
--font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

### 텍스트 사이즈

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `text-xs` | 12px | 캡션, 메타 정보 |
| `text-sm` | 14px | 보조 텍스트 |
| `text-base` | 16px | 본문 |
| `text-lg` | 18px | 강조 본문 |
| `text-xl` | 20px | 소제목 |
| `text-2xl` | 24px | 제목 |
| `text-3xl` | 30px | 페이지 제목 |

### 폰트 두께

| 클래스 | 두께 | 용도 |
|--------|------|------|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 강조 |
| `font-semibold` | 600 | 소제목 |
| `font-bold` | 700 | 제목 |

---

## 컴포넌트

### 버튼

```tsx
// Primary (메인 액션)
<Button variant="primary">결제하기</Button>
// bg-brand-600 hover:bg-brand-700 text-white

// Secondary (보조 액션)
<Button variant="secondary">취소</Button>
// bg-warm-100 hover:bg-warm-200 text-warm-700

// Outline
<Button variant="outline">더보기</Button>
// border border-warm-300 hover:bg-warm-50

// Ghost
<Button variant="ghost">로그인</Button>
// hover:bg-warm-100
```

### 카드

```tsx
<div className="card">
  {/* 둥근 모서리, 그림자, 배경 */}
</div>
// bg-white rounded-2xl shadow-sm border border-warm-100
```

### 뱃지

```tsx
<Badge status="open">모집중</Badge>    // 녹색
<Badge status="soon">마감임박</Badge>  // 주황색  
<Badge status="closed">마감</Badge>    // 회색
<Badge status="wait">대기가능</Badge>  // 파란색
```

---

## 간격 & 레이아웃

### 간격 스케일

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `space-y-2` | 8px | 밀접한 요소 간 |
| `space-y-4` | 16px | 기본 요소 간 |
| `space-y-6` | 24px | 섹션 내 그룹 간 |
| `space-y-8` | 32px | 섹션 간 |
| `space-y-12` | 48px | 주요 섹션 간 |

### 반응형 브레이크포인트

```css
/* 모바일 우선 */
sm: 640px   /* 작은 태블릿 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 큰 데스크톱 */
```

### 컨테이너

```tsx
// 기본 컨테이너
<div className="container mx-auto px-4">

// 좁은 컨테이너 (폼, 카드)
<div className="max-w-md mx-auto px-4">

// 넓은 컨테이너 (대시보드)
<div className="max-w-6xl mx-auto px-4">
```

---

## 애니메이션

### 기본 트랜지션

```css
/* 모든 인터랙티브 요소 */
transition: all 0.2s ease-in-out;
```

### 호버 효과

```tsx
// 카드 호버
<div className="card hover:shadow-md transition-shadow">

// 버튼 호버
<button className="hover:scale-[1.02] transition-transform">

// 링크 호버
<a className="hover:text-brand-600 transition-colors">
```

### 로딩 애니메이션

```tsx
// 스피너
<div className="animate-spin h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full" />

// 펄스
<div className="animate-pulse bg-warm-200 h-4 rounded" />
```

---

## 아이콘

### 아이콘 라이브러리

```tsx
import { Calendar, Users, MapPin, Clock } from 'lucide-react'
```

### 아이콘 크기

| 용도 | 크기 | 클래스 |
|------|------|--------|
| 인라인 텍스트 | 16px | `size={16}` |
| 버튼/UI | 18-20px | `size={18}` |
| 카드 아이콘 | 24px | `size={24}` |
| 히어로 | 32-48px | `size={32}` |

---

## 폼 요소

### Input

```tsx
<Input
  placeholder="이메일"
  className="w-full"
/>
// 둥근 모서리, 포커스 시 브랜드 컬러 테두리
```

### 에러 상태

```tsx
<Input className="border-red-500 focus:ring-red-500" />
<p className="text-sm text-red-600 mt-1">필수 입력 항목입니다.</p>
```

---

## 다크모드 (추후)

현재 MVP에서는 라이트 모드만 지원.
추후 다크모드 추가 시 `dark:` 프리픽스 사용.

```tsx
<div className="bg-white dark:bg-gray-900">
```

