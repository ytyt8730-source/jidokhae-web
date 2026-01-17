# ADR-005: 파일 구조 컨벤션

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- Next.js 14 App Router 사용
- AI 에이전트가 쉽게 파일 위치 파악 필요
- MVP에서 과도한 구조화는 오버엔지니어링

## 고려한 대안

### 대안 1: Feature-based (기능별)
```
src/features/
├── auth/
├── meetings/
├── payments/
└── notifications/
```
- 장점: 기능별 독립성
- 단점: 공통 컴포넌트 위치 애매

### 대안 2: Layer-based (계층별) - 선택
```
src/
├── app/           # 라우트/페이지
├── components/    # 재사용 컴포넌트
├── lib/           # 유틸리티/서비스
└── types/         # 타입 정의
```
- 장점: Next.js 표준, 단순함
- 단점: 기능 간 경계 덜 명확

## 결정

**Layer-based 구조 + 명확한 네이밍 규칙**

### 폴더 구조

```
jidokhae/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # 비로그인 접근 가능
│   │   │   ├── page.tsx          # 홈
│   │   │   └── meetings/
│   │   ├── (auth)/               # 인증 관련
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── signup/
│   │   ├── (protected)/          # 로그인 필요
│   │   │   ├── mypage/
│   │   │   └── apply/
│   │   ├── admin/                # 운영자 전용
│   │   │   ├── meetings/
│   │   │   └── dashboard/
│   │   └── api/                  # API 라우트
│   │       └── v1/
│   │
│   ├── components/               # 재사용 컴포넌트
│   │   ├── ui/                   # 기본 UI (Button, Input 등)
│   │   ├── layout/               # 레이아웃 (Header, Footer)
│   │   ├── meeting/              # 모임 관련 컴포넌트
│   │   ├── auth/                 # 인증 관련 컴포넌트
│   │   └── admin/                # 관리자 컴포넌트
│   │
│   ├── lib/                      # 유틸리티/서비스
│   │   ├── supabase/             # Supabase 클라이언트
│   │   ├── services/             # 비즈니스 로직
│   │   │   ├── payment.ts
│   │   │   ├── notification.ts
│   │   │   └── refund.ts
│   │   ├── errors.ts             # 에러 정의
│   │   ├── api.ts                # API 헬퍼
│   │   ├── logger.ts             # 로깅
│   │   └── utils.ts              # 공통 유틸
│   │
│   ├── types/                    # TypeScript 타입
│   │   ├── database.ts           # Supabase 생성 타입
│   │   ├── api.ts                # API 응답 타입
│   │   └── index.ts              # 공용 타입
│   │
│   └── middleware.ts             # Next.js 미들웨어
│
├── supabase/
│   ├── schema.sql                # 마스터 스키마
│   └── migrations/               # 프로덕션 마이그레이션
│
├── public/                       # 정적 파일
└── tests/                        # 테스트 (추후)
    ├── unit/
    └── e2e/
```

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `MeetingCard.tsx` |
| 유틸/서비스 | camelCase | `payment.ts` |
| 타입 파일 | camelCase | `database.ts` |
| 라우트 폴더 | kebab-case | `my-page/` |
| 상수 | SCREAMING_SNAKE | `MAX_CAPACITY` |

### 컴포넌트 파일 규칙

```tsx
// 한 파일에 하나의 export
// MeetingCard.tsx
export function MeetingCard({ ... }) { ... }

// 관련 타입은 같은 파일 또는 types/
interface MeetingCardProps { ... }
```

## 결과

### 긍정적 영향
- AI 에이전트가 파일 위치 예측 용이
- Next.js 표준 패턴 준수
- 확장 시 폴더 추가로 대응

### 주의사항
- `lib/services/`에 비즈니스 로직 집중
- 컴포넌트는 프레젠테이션 위주로 유지

---

## 관련 파일
- `/src/` 전체 구조

