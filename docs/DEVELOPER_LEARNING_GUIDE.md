# 비전공자를 위한 개발 학습 가이드

> **페르소나: Sarah Chen** - 구글 시니어 소프트웨어 엔지니어, 10년차
> "좋은 코드는 읽기 쉬운 코드입니다. 복잡함을 숨기고 단순함을 드러내세요."

이 문서는 지독해(Jidokhae) 프로젝트를 통해 실제 프로덕션 수준의 웹 개발을 배우고자 하는 비전공자를 위한 가이드입니다.

---

## 목차

1. [들어가기 전에](#1-들어가기-전에)
2. [필수 개념 30선](#2-필수-개념-30선)
3. [프로젝트 구조 이해하기](#3-프로젝트-구조-이해하기)
4. [기술 스택 해부](#4-기술-스택-해부)
5. [코드 패턴 마스터하기](#5-코드-패턴-마스터하기)
6. [단계별 학습 로드맵](#6-단계별-학습-로드맵)
7. [실전 예제 분석](#7-실전-예제-분석)
8. [노하우와 팁](#8-노하우와-팁)

---

## 1. 들어가기 전에

### 개발자의 마인드셋

```
"완벽한 코드는 없다. 오늘보다 나은 코드가 있을 뿐이다."
```

**비전공자가 가져야 할 3가지 태도:**

1. **호기심** - "왜 이렇게 작성했을까?"라고 끊임없이 질문하세요
2. **인내심** - 처음엔 모든 것이 암호처럼 보입니다. 정상입니다
3. **실험 정신** - 직접 수정하고 부숴보세요. 그게 최고의 학습입니다

### 이 프로젝트로 배울 수 있는 것

| 영역 | 배우는 것 |
|-----|----------|
| **프론트엔드** | React, Next.js, TypeScript, Tailwind CSS |
| **백엔드** | API 설계, 데이터베이스, 인증 |
| **인프라** | 배포, 모니터링, 보안 |
| **실무** | 코드 패턴, 에러 처리, 로깅 |

---

## 2. 필수 개념 30선

### A. 프로그래밍 기초 (10개)

#### 1. 변수 (Variable)
```typescript
// 데이터를 저장하는 이름표가 붙은 상자
const name = "홍길동"      // 변경 불가 (상수)
let age = 25               // 변경 가능
```

#### 2. 함수 (Function)
```typescript
// 재사용 가능한 코드 묶음
function greet(name: string): string {
  return `안녕하세요, ${name}님!`
}

// 화살표 함수 (같은 기능, 더 짧은 문법)
const greet = (name: string) => `안녕하세요, ${name}님!`
```

#### 3. 객체 (Object)
```typescript
// 관련된 데이터를 하나로 묶은 것
const user = {
  id: "user_123",
  name: "홍길동",
  email: "hong@example.com"
}

// 접근: user.name → "홍길동"
```

#### 4. 배열 (Array)
```typescript
// 순서가 있는 데이터 목록
const meetings = ["독서모임", "토론모임", "특별모임"]

// 접근: meetings[0] → "독서모임"
// 길이: meetings.length → 3
```

#### 5. 타입 (Type)
```typescript
// TypeScript: 데이터의 형태를 미리 정의
type User = {
  id: string
  name: string
  age: number
  isActive: boolean
}

// 이제 User 타입을 사용하면 자동완성 + 오류 검출
const user: User = { id: "1", name: "홍길동", age: 25, isActive: true }
```

#### 6. 조건문 (Conditional)
```typescript
// 상황에 따라 다른 코드 실행
if (user.isActive) {
  console.log("활성 사용자입니다")
} else {
  console.log("비활성 사용자입니다")
}

// 삼항 연산자 (같은 기능, 한 줄로)
const message = user.isActive ? "활성" : "비활성"
```

#### 7. 반복문 (Loop)
```typescript
// 배열의 각 항목에 대해 작업
const meetings = [{ title: "A" }, { title: "B" }]

// for 문
for (const meeting of meetings) {
  console.log(meeting.title)
}

// map (가장 많이 사용) - 새 배열 반환
const titles = meetings.map(m => m.title)  // ["A", "B"]

// filter - 조건에 맞는 것만
const active = meetings.filter(m => m.isActive)

// find - 첫 번째로 찾은 것
const first = meetings.find(m => m.id === "123")
```

#### 8. 비동기 (Async/Await)
```typescript
// 시간이 걸리는 작업 (API 호출, DB 조회)
async function fetchUser(id: string) {
  // await: "이 작업이 끝날 때까지 기다려"
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user
}

// 사용
const user = await fetchUser("123")
```

#### 9. 에러 처리 (Try/Catch)
```typescript
// 실패할 수 있는 작업을 안전하게 처리
try {
  const user = await fetchUser("123")
  console.log("성공:", user)
} catch (error) {
  console.log("실패:", error.message)
}
```

#### 10. 모듈 (Import/Export)
```typescript
// utils.ts - 내보내기
export function formatDate(date: Date) { ... }
export const APP_NAME = "지독해"

// page.tsx - 가져오기
import { formatDate, APP_NAME } from '@/lib/utils'
```

---

### B. React 핵심 (10개)

#### 11. 컴포넌트 (Component)
```tsx
// UI의 독립적인 조각
function MeetingCard({ title, date }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{date}</p>
    </div>
  )
}

// 사용
<MeetingCard title="독서모임" date="2026-02-10" />
```

#### 12. Props
```tsx
// 부모 → 자식으로 데이터 전달
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean  // ?는 선택적(optional)
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// 부모에서 사용
<Button label="신청하기" onClick={handleSubmit} />
```

#### 13. State (상태)
```tsx
'use client'

import { useState } from 'react'

function Counter() {
  // [현재값, 변경함수] = useState(초기값)
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>클릭 수: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  )
}
```

#### 14. useEffect (부수효과)
```tsx
'use client'

import { useState, useEffect } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  // 컴포넌트가 마운트되거나 userId가 변경될 때 실행
  useEffect(() => {
    async function loadUser() {
      const data = await fetchUser(userId)
      setUser(data)
    }
    loadUser()
  }, [userId])  // 의존성 배열: 이 값이 바뀌면 다시 실행

  return <div>{user?.name}</div>
}
```

#### 15. 조건부 렌더링
```tsx
function UserGreeting({ user }) {
  // 방법 1: && 연산자
  {user && <p>환영합니다, {user.name}님!</p>}

  // 방법 2: 삼항 연산자
  {user ? <LogoutButton /> : <LoginButton />}

  // 방법 3: 조기 반환
  if (!user) return <LoginPrompt />
  return <Dashboard user={user} />
}
```

#### 16. 리스트 렌더링
```tsx
function MeetingList({ meetings }) {
  return (
    <ul>
      {meetings.map((meeting) => (
        // key는 React가 항목을 구분하는 데 필수
        <li key={meeting.id}>
          {meeting.title}
        </li>
      ))}
    </ul>
  )
}
```

#### 17. 이벤트 처리
```tsx
function Form() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()  // 기본 동작(페이지 새로고침) 방지
    console.log('제출:', email)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">제출</button>
    </form>
  )
}
```

#### 18. Context (전역 상태)
```tsx
// ThemeContext.tsx
import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// 어디서든 사용
function Header() {
  const { theme, setTheme } = useTheme()
  return <button onClick={() => setTheme('dark')}>다크 모드</button>
}
```

#### 19. Custom Hook
```tsx
// 재사용 가능한 로직 추출
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// 사용
const [theme, setTheme] = useLocalStorage('theme', 'light')
```

#### 20. Server vs Client Component
```tsx
// Server Component (기본) - 서버에서 실행
// src/app/page.tsx
export default async function Page() {
  const data = await db.query('SELECT * FROM users')  // DB 직접 접근 가능
  return <UserList users={data} />
}

// Client Component - 브라우저에서 실행
// src/components/Counter.tsx
'use client'  // 이 지시어가 필요!

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)  // 상태 사용 가능
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

---

### C. Next.js & 프로젝트 특화 (10개)

#### 21. 라우팅 (App Router)
```
src/app/
├── page.tsx              → /
├── about/page.tsx        → /about
├── meetings/
│   ├── page.tsx          → /meetings
│   └── [id]/
│       └── page.tsx      → /meetings/123 (동적 라우트)
└── api/
    └── users/route.ts    → /api/users (API 엔드포인트)
```

#### 22. API Route
```typescript
// src/app/api/users/route.ts
import { NextRequest } from 'next/server'

// GET /api/users
export async function GET(request: NextRequest) {
  const users = await db.query('SELECT * FROM users')
  return Response.json({ success: true, data: users })
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await db.insert('users', body)
  return Response.json({ success: true, data: user })
}
```

#### 23. 환경 변수
```bash
# .env.local (비밀, git에 올리지 않음)
DATABASE_URL="postgresql://..."
PORTONE_SECRET_KEY="sk_..."

# 클라이언트에서 사용하려면 NEXT_PUBLIC_ 접두사 필요
NEXT_PUBLIC_SITE_URL="https://jidokhae.com"
```

```typescript
// 사용
const dbUrl = process.env.DATABASE_URL  // 서버에서만
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL  // 어디서든
```

#### 24. Supabase 클라이언트
```typescript
// Server Component에서
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('meetings').select('*')
}

// Client Component에서
import { createClient } from '@/lib/supabase/client'

function ClientComponent() {
  const supabase = createClient()
  // ...
}
```

#### 25. 타입 정의 (database.ts)
```typescript
// src/types/database.ts
export interface User {
  id: string
  email: string
  name: string
  role: 'member' | 'admin' | 'super_admin'
  created_at: string
}

export interface Meeting {
  id: string
  title: string
  datetime: string
  capacity: number
  current_participants: number
  fee: number
  status: 'open' | 'closed' | 'completed'
}
```

#### 26. 에러 코드 시스템
```typescript
// src/lib/errors.ts
export const ErrorCode = {
  // 1xxx: 인증
  AUTH_UNAUTHORIZED: 1001,
  AUTH_INVALID_TOKEN: 1002,

  // 2xxx: 결제
  PAYMENT_FAILED: 2001,
  PAYMENT_CANCELLED: 2002,

  // 4xxx: 비즈니스 로직
  MEETING_NOT_FOUND: 4001,
  CAPACITY_EXCEEDED: 4002,
}
```

#### 27. API 응답 패턴
```typescript
// src/lib/api.ts
import { ErrorCode } from '@/lib/errors'

// 성공 응답
export function successResponse<T>(data: T) {
  return Response.json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() }
  })
}

// 에러 응답
export function errorResponse(code: number, details?: object) {
  return Response.json({
    success: false,
    error: { code, ...details }
  }, { status: 400 })
}
```

#### 28. 로깅 시스템
```typescript
// src/lib/logger.ts
import { createLogger } from '@/lib/logger'

const logger = createLogger('payment')

// 정보 로그
logger.info('결제 시작', { userId: '123', amount: 10000 })

// 에러 로그 (자동으로 Sentry에 전송)
logger.error('결제 실패', { errorCode: 2001 })

// 성능 측정
const timer = logger.startTimer()
await processPayment()
timer.done('결제 처리 완료')  // 자동으로 소요 시간 기록
```

#### 29. Rate Limiting
```typescript
// 짧은 시간에 너무 많은 요청 차단
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const result = checkRateLimit(request, rateLimiters.payment)

  if (!result.success) {
    return Response.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
      { status: 429 }
    )
  }

  // 정상 처리...
}
```

#### 30. 검증 헬퍼
```typescript
// src/lib/api.ts
import { validateRequired, requireAuth, requireAdmin } from '@/lib/api'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // 필수 필드 확인 (없으면 에러 던짐)
  validateRequired(body, ['meetingId', 'amount'])

  // 인증 확인 (없으면 에러 던짐)
  const user = await getUser()
  requireAuth(user?.id)

  // 관리자 확인
  requireAdmin(user.role)
}
```

---

## 3. 프로젝트 구조 이해하기

### 전체 구조

```
c:\Cursor\jidokhae-web\
│
├── /core                    # 기획 문서
│   ├── PRD.md               # 제품 요구사항 정의서
│   └── service-overview.md  # 서비스 개요
│
├── /docs                    # 기술 문서
│   ├── design-system.md     # 디자인 시스템 (색상, 폰트, 컴포넌트)
│   └── owner-tasks.md       # 운영자 작업 가이드
│
├── /roadmap                 # 개발 계획
│   ├── milestones.md        # 마일스톤 정의
│   └── work-packages/       # 작업 패키지 (WP)
│
├── /log                     # 작업 기록
│   └── current-state.md     # 현재 개발 상태
│
├── /jidokhae                # ⭐ Next.js 앱 (실제 코드)
│   ├── /src
│   │   ├── /app             # 페이지 & API
│   │   ├── /components      # UI 컴포넌트
│   │   ├── /lib             # 유틸리티 & 서비스
│   │   ├── /hooks           # 커스텀 훅
│   │   ├── /types           # TypeScript 타입
│   │   └── /providers       # Context Provider
│   ├── package.json         # 의존성 목록
│   └── tailwind.config.ts   # Tailwind 설정
│
└── CLAUDE.md                # AI 에이전트 가이드
```

### src/app 구조 (페이지 & API)

```
src/app/
├── layout.tsx               # 전체 레이아웃 (헤더, 사이드바)
├── page.tsx                 # 홈 페이지 (/)
├── globals.css              # 전역 스타일
│
├── /auth                    # 인증 관련 페이지
│   ├── /login/page.tsx      # 로그인
│   ├── /signup/page.tsx     # 회원가입
│   └── /callback/route.ts   # OAuth 콜백
│
├── /meetings                # 모임 관련 페이지
│   ├── page.tsx             # 모임 목록 (/meetings)
│   └── /[id]                # 동적 라우트
│       ├── page.tsx         # 모임 상세 (/meetings/123)
│       ├── /payment-complete/page.tsx
│       └── /praise/page.tsx
│
├── /mypage                  # 마이페이지
│   ├── page.tsx             # 내 정보
│   ├── /tickets/page.tsx    # 내 티켓
│   └── /bookshelf/page.tsx  # 내 책장
│
├── /onboarding              # 온보딩
│   └── page.tsx             # 5단계 온보딩 플로우
│
└── /api                     # ⭐ API 엔드포인트
    ├── /registrations       # 신청 API
    │   ├── /prepare/route.ts
    │   ├── /complete/route.ts
    │   └── /transfer/route.ts
    ├── /waitlists           # 대기 API
    ├── /praises             # 칭찬 API
    └── /cron                # 예약 작업
        ├── /reminder/route.ts
        └── /auto-complete/route.ts
```

### src/components 구조 (UI 컴포넌트)

```
src/components/
├── /ui                      # 기본 UI 컴포넌트
│   ├── Button.tsx           # 버튼
│   ├── Badge.tsx            # 뱃지
│   ├── Toast.tsx            # 토스트 알림
│   └── Input.tsx            # 입력 필드
│
├── /layout                  # 레이아웃 컴포넌트
│   ├── Header.tsx           # 모바일 헤더
│   ├── Sidebar.tsx          # 데스크톱 사이드바
│   └── Footer.tsx           # 푸터
│
├── /onboarding              # 온보딩 전용 컴포넌트
│   ├── ProblemRecognition.tsx
│   ├── ValueProposition.tsx
│   └── GoalSetting.tsx
│
├── MeetingCard.tsx          # 모임 카드
├── PaymentButton.tsx        # 결제 버튼
├── TicketCard.tsx           # 티켓 카드
└── IneligibilityModal.tsx   # 자격 부족 모달
```

### src/lib 구조 (유틸리티 & 서비스)

```
src/lib/
├── /supabase                # Supabase 클라이언트
│   ├── server.ts            # 서버용 (Server Component)
│   └── client.ts            # 클라이언트용 (Client Component)
│
├── api.ts                   # API 응답 헬퍼
├── errors.ts                # 에러 코드 정의
├── logger.ts                # 로깅 시스템
├── utils.ts                 # 공통 유틸리티
├── payment.ts               # 결제 관련 로직
├── eligibility.ts           # 자격 검증 로직
├── badges.ts                # 배지 시스템
├── rate-limit.ts            # Rate Limiting
├── animations.ts            # 애니메이션 프리셋
└── sound.ts                 # 사운드 매니저
```

---

## 4. 기술 스택 해부

### 왜 이 기술을 선택했나?

| 기술 | 선택 이유 | 대안 |
|-----|---------|------|
| **Next.js 14** | 서버/클라이언트 컴포넌트 분리, 풀스택, 뛰어난 DX | Remix, Nuxt |
| **TypeScript** | 타입 안정성, 자동완성, 리팩토링 용이 | JavaScript |
| **Tailwind CSS** | 빠른 개발, 일관된 디자인, CSS Variables | Styled-components |
| **Supabase** | PostgreSQL + 인증 + Realtime 올인원, 무료 티어 | Firebase, PlanetScale |
| **Framer Motion** | 선언적 애니메이션, 제스처 지원 | React Spring |
| **Vercel** | Next.js 최적화, 간편한 배포, 엣지 함수 | AWS, Netlify |

### 의존성 설명 (package.json)

```json
{
  "dependencies": {
    // 프레임워크
    "next": "14.2.x",           // React 기반 풀스택 프레임워크
    "react": "18.x",            // UI 라이브러리

    // 백엔드
    "@supabase/supabase-js": "2.x",  // Supabase 클라이언트
    "@supabase/ssr": "0.5.x",        // Next.js용 Supabase

    // 스타일링
    "tailwindcss": "3.4.x",     // 유틸리티 CSS
    "clsx": "2.x",              // 조건부 클래스
    "tailwind-merge": "2.x",    // Tailwind 클래스 병합

    // 애니메이션
    "framer-motion": "12.x",    // 애니메이션 라이브러리

    // 아이콘
    "lucide-react": "0.56x",    // SVG 아이콘

    // 유틸리티
    "date-fns": "4.x",          // 날짜 처리
    "canvas-confetti": "1.x",   // 축하 효과
    "html-to-image": "1.x",     // 이미지 내보내기

    // 모니터링
    "@sentry/nextjs": "10.x"    // 에러 추적
  },
  "devDependencies": {
    // 타입
    "typescript": "5.x",
    "@types/react": "18.x",

    // 테스트
    "vitest": "3.x",            // 단위 테스트
    "@playwright/test": "1.x",  // E2E 테스트

    // 코드 품질
    "eslint": "9.x"
  }
}
```

---

## 5. 코드 패턴 마스터하기

### 패턴 1: 표준 API 응답

```typescript
// ❌ 잘못된 예
export async function GET() {
  const data = await db.query('...')
  return new Response(JSON.stringify(data))  // 일관성 없음
}

// ✅ 올바른 예
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const data = await db.query('...')
    return successResponse(data)  // { success: true, data: ... }
  } catch (error) {
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
```

### 패턴 2: 조건부 스타일링

```tsx
// ❌ 잘못된 예
<button style={{ backgroundColor: isActive ? 'blue' : 'gray' }}>

// ✅ 올바른 예
import { cn } from '@/lib/utils'

<button className={cn(
  'px-4 py-2 rounded-lg',           // 기본 스타일
  isActive && 'bg-primary',          // 조건부 스타일
  disabled && 'opacity-50'           // 또 다른 조건
)}>
```

### 패턴 3: Server/Client 분리

```tsx
// ❌ 잘못된 예 - Server Component에서 상태 사용
export default async function Page() {
  const [count, setCount] = useState(0)  // 에러!
}

// ✅ 올바른 예 - 분리
// page.tsx (Server)
export default async function Page() {
  const data = await fetchData()
  return <ClientCounter initialData={data} />
}

// ClientCounter.tsx (Client)
'use client'
export function ClientCounter({ initialData }) {
  const [count, setCount] = useState(initialData)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### 패턴 4: 에러 처리 계층

```typescript
// 레벨 1: API 라우트
export async function POST(request) {
  try {
    // 비즈니스 로직...
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.code, { message: error.message })
    }
    logger.error('Unexpected error', { error })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}

// 레벨 2: 클라이언트
const handleSubmit = async () => {
  try {
    const res = await fetch('/api/...')
    const data = await res.json()

    if (!data.success) {
      setError(data.error.message)
      return
    }

    // 성공 처리...
  } catch (error) {
    setError('네트워크 오류가 발생했습니다')
  }
}
```

### 패턴 5: 데이터 Fetch 패턴

```typescript
// Server Component에서 (권장)
export default async function MeetingsPage() {
  const supabase = await createClient()

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'open')
    .order('datetime', { ascending: true })

  if (error) {
    return <ErrorMessage message="모임을 불러올 수 없습니다" />
  }

  return <MeetingList meetings={meetings} />
}

// Client Component에서 (상태 필요 시)
'use client'

function MeetingList() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/meetings')
      const data = await res.json()
      setMeetings(data.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Skeleton />
  return meetings.map(m => <MeetingCard key={m.id} meeting={m} />)
}
```

---

## 6. 단계별 학습 로드맵

### Week 1-2: 기초 다지기

**목표:** HTML, CSS, JavaScript 기초

| 일자 | 학습 내용 | 실습 |
|-----|---------|------|
| 1-2일 | HTML 태그 (`div`, `p`, `a`, `button`) | 간단한 페이지 만들기 |
| 3-4일 | CSS 기초 (선택자, 박스모델, Flexbox) | 카드 레이아웃 만들기 |
| 5-7일 | JavaScript 기초 (변수, 함수, 배열) | 간단한 계산기 |
| 8-10일 | JavaScript DOM (이벤트, 요소 조작) | Todo 리스트 |
| 11-14일 | JavaScript 비동기 (Promise, async/await) | API 호출 연습 |

**추천 자료:**
- [MDN Web Docs](https://developer.mozilla.org/ko/)
- [JavaScript.info](https://ko.javascript.info/)

### Week 3-4: React 입문

**목표:** React 핵심 개념 이해

| 일자 | 학습 내용 | 실습 |
|-----|---------|------|
| 1-2일 | 컴포넌트, JSX | 버튼 컴포넌트 만들기 |
| 3-4일 | Props | 재사용 가능한 카드 만들기 |
| 5-6일 | useState | 카운터, 토글 버튼 |
| 7-8일 | useEffect | 데이터 fetch |
| 9-10일 | 리스트 렌더링 | 모임 목록 표시 |
| 11-14일 | 폼 처리 | 회원가입 폼 |

**프로젝트 파일로 학습:**
- `src/components/ui/Button.tsx` - 기본 컴포넌트
- `src/components/MeetingCard.tsx` - Props 활용

### Week 5-6: Next.js & TypeScript

**목표:** 풀스택 개발 이해

| 일자 | 학습 내용 | 프로젝트 파일 참고 |
|-----|---------|------------------|
| 1-3일 | TypeScript 기초 | `src/types/database.ts` |
| 4-5일 | Next.js 라우팅 | `src/app/meetings/[id]/page.tsx` |
| 6-7일 | Server Component | `src/app/page.tsx` |
| 8-9일 | Client Component | `src/components/PaymentButton.tsx` |
| 10-12일 | API Routes | `src/app/api/registrations/prepare/route.ts` |
| 13-14일 | 데이터베이스 연동 | `src/lib/supabase/server.ts` |

### Week 7-8: 실전 프로젝트

**목표:** 프로젝트 기여

1. **이슈 해결:** GitHub Issues에서 `good first issue` 찾기
2. **기능 추가:** 간단한 기능 직접 구현
3. **코드 리뷰:** 다른 사람의 PR 읽기
4. **문서화:** README 개선

---

## 7. 실전 예제 분석

### 예제 1: 버튼 컴포넌트 (초급)

**파일:** `src/components/ui/Button.tsx`

```tsx
'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// Props 인터페이스 정의
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

// forwardRef: 부모가 버튼에 직접 ref 접근 가능하게
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    className,
    children,
    ...props
  }, ref) => {
    // 스타일 맵
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-11 px-8',
    }

    return (
      <button
        ref={ref}
        className={cn(
          // 기본 스타일
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:opacity-50 disabled:pointer-events-none',
          // 동적 스타일
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
```

**배우는 것:**
- TypeScript 인터페이스
- `forwardRef` 사용법
- 조건부 스타일링 (`cn` 함수)
- 로딩 상태 처리
- `...props` 스프레드

---

### 예제 2: API 라우트 (중급)

**파일:** `src/app/api/registrations/prepare/route.ts`

```typescript
/**
 * 결제 준비 API
 * POST /api/registrations/prepare
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, validateRequired, requireAuth } from '@/lib/api'
import { ErrorCode } from '@/lib/errors'
import { checkMeetingQualification } from '@/lib/payment'
import { registrationLogger } from '@/lib/logger'
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // [1] 보안: Rate Limiting
  const rateLimitResult = checkRateLimit(request, rateLimiters.payment)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    // [2] 요청 파싱 & 검증
    const body = await request.json()
    validateRequired(body, ['meetingId'])

    const { meetingId } = body

    // [3] 인증 확인
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    requireAuth(authUser?.id)

    // [4] 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // [5] 모임 정보 조회
    const { data: meeting } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single()

    if (!meeting) {
      return errorResponse(ErrorCode.NOT_FOUND, { message: '모임을 찾을 수 없습니다' })
    }

    // [6] 모임 상태 확인
    if (meeting.status !== 'open') {
      return successResponse({ success: false, message: '마감된 모임입니다' })
    }

    // [7] 과거 모임 확인
    if (new Date(meeting.datetime) < new Date()) {
      return successResponse({ success: false, message: '이미 종료된 모임입니다' })
    }

    // [8] 자격 검증 (토론모임 등)
    const qualification = checkMeetingQualification(user, meeting)
    if (!qualification.eligible) {
      return successResponse({
        success: false,
        message: qualification.reason || '자격이 필요합니다',
      })
    }

    // [9] 정원 체크 & 예약 (동시성 제어)
    const { data: reserveResult } = await supabase
      .rpc('check_and_reserve_capacity', {
        p_meeting_id: meetingId,
        p_user_id: authUser.id,
      })

    const result = reserveResult?.[0]
    if (!result?.success) {
      // 에러 유형별 메시지
      const messages = {
        'ALREADY_REGISTERED': '이미 신청한 모임입니다',
        'CAPACITY_EXCEEDED': '마감되었습니다. 대기 신청하시겠습니까?',
        'MEETING_CLOSED': '마감된 모임입니다',
      }
      return successResponse({
        success: false,
        message: messages[result?.message] || '신청 처리 중 오류가 발생했습니다',
      })
    }

    // [10] 생성된 신청 정보 조회
    const { data: registration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('meeting_id', meetingId)
      .eq('status', 'pending')
      .single()

    // [11] 성공 응답
    return successResponse({
      success: true,
      registrationId: registration.id,
      amount: meeting.fee,
      meetingTitle: meeting.title,
    })

  } catch (error) {
    registrationLogger.error('prepare_error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return errorResponse(ErrorCode.INTERNAL_ERROR)
  }
}
```

**배우는 것:**
- API 라우트 전체 구조
- Rate Limiting (보안)
- 입력 검증 (`validateRequired`)
- 인증 체크 (`requireAuth`)
- DB 조회 및 비즈니스 로직
- 동시성 제어 (DB 함수 호출)
- 에러 유형별 처리
- 구조화된 로깅

---

### 예제 3: Custom Hook (고급)

**파일:** `src/hooks/useTickets.ts`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TicketData } from '@/types/database'

interface UseTicketsReturn {
  upcoming: TicketData[]        // 예정된 모임
  past: TicketData[]            // 지난 모임
  loading: boolean
  error: string | null
  refetch: () => Promise<void>  // 수동 새로고침
}

export function useTickets(userId: string): UseTicketsReturn {
  const [upcoming, setUpcoming] = useState<TicketData[]>([])
  const [past, setPast] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데이터 fetch 함수 (메모이제이션)
  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 확정된 신청 내역 조회
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          seat_number,
          payment_amount,
          created_at,
          meetings (
            id,
            title,
            datetime,
            location,
            meeting_type
          ),
          users (
            id,
            name,
            profile_image_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // 티켓 데이터 변환
      const tickets = (data || []).map(reg => ({
        id: reg.id,
        seatNumber: reg.seat_number,
        status: reg.status,
        paymentAmount: reg.payment_amount,
        meeting: reg.meetings,
        user: reg.users,
        createdAt: reg.created_at,
      }))

      // 예정/지난 모임으로 분류
      const now = new Date()
      setUpcoming(tickets.filter(t => new Date(t.meeting.datetime) > now))
      setPast(tickets.filter(t => new Date(t.meeting.datetime) <= now))

    } catch (err) {
      setError(err instanceof Error ? err.message : '티켓을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // 마운트 시 & userId 변경 시 fetch
  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return { upcoming, past, loading, error, refetch: fetchTickets }
}

// 사용 예시:
// function TicketPage() {
//   const { upcoming, past, loading, refetch } = useTickets(userId)
//
//   if (loading) return <Skeleton />
//
//   return (
//     <div>
//       {upcoming.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
//       <button onClick={refetch}>새로고침</button>
//     </div>
//   )
// }
```

**배우는 것:**
- Custom Hook 패턴
- `useCallback`으로 함수 최적화
- 의존성 배열 관리
- 로딩/에러 상태 관리
- 데이터 변환 및 분류
- TypeScript 반환 타입 정의

---

## 8. 노하우와 팁

### 코드 작성 원칙

#### 1. DRY (Don't Repeat Yourself)
```tsx
// ❌ 반복
<button className="px-4 py-2 bg-blue-500 text-white rounded">저장</button>
<button className="px-4 py-2 bg-blue-500 text-white rounded">취소</button>

// ✅ 컴포넌트화
<Button>저장</Button>
<Button>취소</Button>
```

#### 2. KISS (Keep It Simple, Stupid)
```tsx
// ❌ 복잡하게
const isEligible = user && user.isActive && user.lastMeeting &&
  new Date(user.lastMeeting) > sixMonthsAgo ? true : false

// ✅ 단순하게
function checkEligibility(user) {
  if (!user?.isActive) return false
  if (!user.lastMeeting) return false
  return new Date(user.lastMeeting) > sixMonthsAgo
}
```

#### 3. 명확한 이름 짓기
```tsx
// ❌ 불명확
const d = new Date()
const u = getU(id)
const handleClick = () => { ... }

// ✅ 명확
const currentDate = new Date()
const user = getUserById(id)
const handlePaymentSubmit = () => { ... }
```

### 디버깅 팁

#### 1. console.log 대신 구조화된 로깅
```typescript
// ❌ 프로덕션에서 문제
console.log('user:', user)

// ✅ 구조화된 로깅
import { createLogger } from '@/lib/logger'
const logger = createLogger('myFeature')
logger.info('User loaded', { userId: user.id, role: user.role })
```

#### 2. React DevTools 활용
- 컴포넌트 트리 확인
- Props/State 실시간 확인
- 리렌더링 원인 추적

#### 3. Network 탭 확인
- API 요청/응답 확인
- 에러 상태 코드 확인
- 요청 순서 및 타이밍 분석

### 성능 최적화 팁

#### 1. 불필요한 리렌더링 방지
```tsx
// ❌ 매번 새 함수 생성
<Button onClick={() => handleClick(id)} />

// ✅ useCallback으로 메모이제이션
const handleButtonClick = useCallback(() => handleClick(id), [id])
<Button onClick={handleButtonClick} />
```

#### 2. 조건부 렌더링 최적화
```tsx
// ❌ 항상 둘 다 렌더링
{showModal && <Modal />}
{!showModal && <Content />}

// ✅ 하나만 렌더링
{showModal ? <Modal /> : <Content />}
```

#### 3. 이미지 최적화
```tsx
// ❌ 일반 img
<img src="/large-image.jpg" />

// ✅ Next.js Image (자동 최적화)
import Image from 'next/image'
<Image src="/large-image.jpg" width={400} height={300} alt="설명" />
```

### Git 워크플로우

```bash
# 1. 브랜치 생성
git checkout -b feature/my-feature

# 2. 작업 후 커밋
git add .
git commit -m "feat: 새 기능 추가"

# 3. 푸시 & PR
git push origin feature/my-feature

# 커밋 메시지 규칙
# feat: 새 기능
# fix: 버그 수정
# docs: 문서 변경
# refactor: 리팩토링
# test: 테스트 추가
```

---

## 마무리

### 핵심 요약

1. **구조 이해**: `src/app`(페이지), `src/components`(UI), `src/lib`(로직)
2. **패턴 습득**: 표준 응답, 에러 처리, 상태 관리
3. **단계적 학습**: 기초 → React → Next.js → 실전
4. **실습 중심**: 코드 읽기 + 직접 수정 + 피드백

### 다음 단계

1. **이 문서의 예제 따라하기**
2. **프로젝트 코드 탐색하기**
3. **작은 이슈 해결하기**
4. **새 기능 추가해보기**

---

*"1000줄의 코드를 읽는 것이 10줄의 코드를 쓰는 것보다 중요합니다."*
*— Sarah Chen*

---

**최종 업데이트:** 2026-02-06
**작성자:** Claude Opus 4.5 + 프로젝트 분석
