---
name: design-system
description: 지독해 Design System v2.1 (Deep Forest Green) 규칙
disable-model-invocation: true
---

# 지독해 Design System v2.1

> 이 스킬은 디자인 시스템 규칙을 제공합니다.

## 색상 팔레트

### Brand (Primary)
| Token | Hex | 용도 |
|-------|-----|------|
| brand-50 | #F2F5F3 | 배경 (Mist Green) |
| brand-100 | #E6EBE7 | 카드 hover 배경 |
| brand-200 | #CED6D0 | 보더 |
| brand-600 | **#355E3B** | **Primary CTA** (Hunter Green) |
| brand-700 | #2E4A35 | CTA hover |
| brand-800 | **#2B362F** | **Heading, 로고** |

### Accent (Secondary)
| Token | Hex | 용도 |
|-------|-----|------|
| accent-50 | #FDF8F6 | 마감임박 배경 |
| accent-100 | #F5EBE6 | 경고 배경 |
| accent-500 | **#B85C38** | 마감임박, 좋아요 |
| accent-600 | #9F4A29 | hover |

## 타이포그래피

### 폰트 규칙
- **Heading (H1, H2)**: `font-serif text-brand-800` (Noto Serif KR)
- **Body**: `font-sans` (Pretendard)
- **로고**: `font-serif font-bold text-brand-800`

### 유틸리티 클래스
```css
.text-display { @apply font-serif text-[32px] font-bold text-brand-800; }
.text-h1 { @apply font-serif text-[24px] font-bold text-brand-800; }
.text-h2 { @apply font-sans text-[20px] font-semibold text-brand-800; }
.text-h3 { @apply font-sans text-[17px] font-medium text-brand-800; }
```

## 컴포넌트 스타일

### 버튼
```tsx
// Primary (CTA)
className="bg-brand-600 text-white shadow-button
           hover:bg-brand-700 hover:shadow-button-hover hover:-translate-y-[1px]
           active:scale-[0.98]"

// Secondary
className="bg-brand-50 text-brand-800 border border-brand-200
           hover:bg-brand-100"

// Ghost
className="text-brand-700 hover:bg-brand-50"
```

### 카드
```tsx
className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all"
```

### 뱃지
| Variant | 클래스 |
|---------|--------|
| default | `bg-brand-50 text-brand-700` |
| success | `bg-green-50 text-success` |
| warning | `bg-accent-100 text-accent-700` |
| urgent | `bg-accent-50 text-accent-500` |
| closed | `bg-gray-100 text-gray-400` |

## 그림자
```ts
boxShadow: {
  'card': '0 1px 3px rgba(43,54,47,0.04), 0 4px 12px rgba(43,54,47,0.06)',
  'card-hover': '0 4px 8px rgba(43,54,47,0.08), 0 16px 32px rgba(43,54,47,0.08)',
  'button': '0 2px 8px rgba(53,94,59,0.25)',
  'button-hover': '0 4px 14px rgba(53,94,59,0.35)',
}
```

## 아이콘
- **라이브러리**: lucide-react
- **두께**: `strokeWidth={1.5}`
- **크기**: 16px (sm), 20px (default), 24px (lg)

## 간격
- **8px 베이스라인 그리드** 사용
- 카드 패딩: `p-6` (24px)
- 요소 간격: `gap-4` (16px), `gap-6` (24px)

## 절대 금지
- ❌ brand-500 텍스트 사용 (대비율 부족)
- ❌ warm 팔레트 신규 사용 (deprecated)
- ❌ 테라코타를 Primary CTA로 사용
