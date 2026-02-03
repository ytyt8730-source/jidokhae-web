# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

지독해(Jidokhae) - A web service for a reading club in Gyeongju/Pohang, Korea. Members can join meetings, make payments, and build community through features like praise, badges, and book tracking.

**Brand Concept:** "낮과 밤의 서재 (Day & Night Library)" - 사용자가 원하는 무드를 선택할 수 있는 이중 테마 시스템

| Mode | Concept | Vibe |
|------|---------|------|
| **Electric** (기본) | 힙하고 에너지 넘치는 독서 라운지 | 토스, 당근마켓 같은 현대적 느낌 |
| **Warm** | 차분하고 지적인 클래식 서재 | Kinfolk, Aesop 같은 고급스러운 느낌 |

---

## Repository Structure

```
/core              # PRD, system architecture
/docs              # ADR, design-system.md, runbook
/roadmap           # Milestones, work-packages/, scenarios/
/jidokhae          # Next.js app
  /src/app         # App Router pages
  /src/components  # React components (65+)
  /src/lib         # Utilities, Supabase clients
  /src/hooks       # Custom hooks (useFeedback, useTickets, etc.)
  /src/types       # TypeScript definitions
  /supabase        # schema-complete.sql
  /scripts         # Validation scripts
/log               # current-state.md
/scripts           # Shell scripts (status.sh, etc.)
```

---

## Commands

All commands run from `/jidokhae` directory:

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript check (alias for npx tsc --noEmit)

# Testing (Vitest)
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Single test execution
npm run test -- src/lib/utils.test.ts       # Run single file
npm run test -- --grep "payment"            # Match pattern

# Screenshots (requires: npm run screenshot:install)
npm run screenshot           # Capture all pages
npm run screenshot:mobile    # Mobile viewports only
npm run screenshot:desktop   # Desktop viewports only

# Pre-commit (REQUIRED)
npx tsc --noEmit && npm run build
```

Supabase type generation:
```bash
npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
```

Quality check scripts (from root):
```bash
./scripts/status.sh        # Quick status check
./scripts/check-all.sh     # Full project check
./scripts/quality-gate.sh  # Quality gate validation
```

---

## Tech Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | **Next.js 14** | App Router (NOT Pages Router) |
| UI | **React 18** | Server Components by default |
| Language | **TypeScript 5** | Strict mode enabled |
| Styling | **Tailwind CSS 3.4** | NOT v4, CSS Variables 기반 테마 |
| Animation | **Framer Motion** | Stagger, hover, micro-interactions |
| Icons | **Lucide React** | No-Emoji 정책, strokeWidth: 1.5 |
| Backend | **Supabase** | PostgreSQL, Auth, Realtime |
| Payment | **PortOne** | KakaoPay, TossPay (V2 API) |
| Notifications | **Solapi** | Kakao Alimtalk (No-Emoji) |
| Monitoring | **Sentry** | Error tracking, performance monitoring |
| Testing | **Vitest** | Unit/integration tests, React Testing Library |
| Dates | **date-fns 4** | Date manipulation |

---

## Architecture

### Supabase Client Usage

| Context | Import | Use Case |
|---------|--------|----------|
| Server Components | `@/lib/supabase/server` | SSR data fetching |
| API Routes | `@/lib/supabase/server` | Backend operations |
| Client Components | `@/lib/supabase/client` | Browser interactions |
| Admin operations | `createServiceClient()` | Service role (bypasses RLS) |

### API Response Pattern

```typescript
import { successResponse, withErrorHandler } from '@/lib/api'

export async function GET() {
  return withErrorHandler(async () => {
    const data = await fetchData()
    return successResponse(data)
  })
}
```

Response: `{ success: boolean, data?: T, error?: { code, message } }`

### Error Codes

| Range | Category | Examples |
|-------|----------|----------|
| 1xxx | Auth | 1001 (Unauthorized), 1002 (Token expired) |
| 2xxx | Payment | 2001 (Payment failed), 2002 (Refund failed) |
| 3xxx | External | 3001 (Alimtalk failed) |
| 4xxx | Business | 4001 (Meeting full), 4002 (Already registered) |
| 5xxx | System | 5001 (DB error) |

### Logging

```typescript
import { createLogger, paymentLogger } from '@/lib/logger'

// Create custom logger
const logger = createLogger('payment')
logger.info('Payment initiated', { userId, amount })
logger.error('Payment failed', { errorCode: err.code, message: err.message })

// Pre-defined loggers: authLogger, paymentLogger, notificationLogger,
// meetingLogger, registrationLogger, waitlistLogger, cronLogger, systemLogger

// With timer for performance
const timer = logger.startTimer()
// ... operation
timer.done('Operation complete', { recordsProcessed: 100 })

// With user context
logger.withUser(userId).info('User action', { action: 'purchase' })
```

**NEVER use `console.log`** - always use the logger.

### Component Guidelines

- Server Components are default; add `'use client'` only when needed
- Keep page components under 200 lines; split if exceeded
- Use API routes under 200 lines; extract to service layer if exceeded

### API Route Organization

```
/api
├── /admin/*           # Admin-only endpoints (requires staff role)
│   ├── /banners       # Banner management
│   ├── /gallery       # Gallery image management (About page)
│   ├── /notifications # Manual notification triggers
│   ├── /permissions   # User permission management
│   ├── /registrations # Registration management
│   ├── /templates     # Notification templates
│   └── /users         # User management
├── /cron/*            # Scheduled jobs (Vercel Cron)
├── /meetings/*        # Meeting status & operations
├── /registrations/*   # User registration flows
├── /payments/*        # Payment webhooks
├── /waitlists/*       # Waitlist management
├── /bookshelf/*       # User book tracking
├── /gallery/*         # Public gallery images
├── /praises/*         # Member-to-member praise
└── /reviews/*         # Meeting reviews
```

### Cron Jobs

| Endpoint | Purpose |
|----------|---------|
| `/api/cron/reminder` | Meeting reminders |
| `/api/cron/auto-complete` | Auto-complete past meetings |
| `/api/cron/post-meeting` | Post-meeting follow-ups |
| `/api/cron/waitlist` | Process waitlist entries |
| `/api/cron/welcome` | New member welcome |
| `/api/cron/afterglow` | Post-meeting afterglow |
| `/api/cron/eligibility-warning` | Eligibility warnings |
| `/api/cron/transfer-timeout` | Transfer timeout processing |

---

## Design System (v3.3)

> **Source of Truth:** `/docs/design-system.md`

### 핵심 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **No-Emoji** | 모든 이모지 사용 금지. Lucide React 또는 커스텀 SVG로 대체 |
| **One-Page** | 페이지 이동 최소화. Bottom Sheet 패턴 활용 |
| **3-Click Rule** | 신청 완료까지 3번의 탭 이내 |
| **Mood-Switchable** | Electric/Warm 두 가지 테마 제공 |

### Grid System

- **8px baseline grid** for all spacing and sizing
- Use Tailwind spacing: `p-2` (8px), `p-4` (16px), `gap-6` (24px)

### Colors (CSS Variables 기반 테마)

**Electric Theme (기본):**
```
--bg-base: #F8FAFC        // 페이지 배경
--bg-surface: #FFFFFF     // 카드 배경
--primary: #0047FF        // Cobalt Blue (CTA, 강조)
--accent: #CCFF00         // Acid Lime (포인트, 배경용)
--text: #0F172A           // 기본 텍스트
--text-muted: #64748B     // 보조 텍스트
```

**Warm Theme:**
```
--bg-base: #F5F5F0        // Warm Sand + Noise Texture
--bg-surface: #FAFAF7     // 카드 배경
--primary: #0F172A        // Deep Navy
--accent: #EA580C         // Burnt Orange
--text: #0F172A           // 기본 텍스트
--text-muted: #64748B     // 보조 텍스트
```

**상태 색상 (테마 무관):**
- success: `#10B981` | warning: `#F59E0B` | danger: `#EF4444` | info: `#2563EB`

**Accent 가독성 규칙:**
- Electric 라임색(`#CCFF00`)은 텍스트로 사용 금지 (가독성 불가)
- Electric에서 섹션 라벨은 Primary(Cobalt Blue) 사용
- Warm에서는 Accent(Orange) 텍스트 사용 가능

### Typography

| Font | Electric | Warm | Class |
|------|----------|------|-------|
| **헤드라인** | Outfit / Noto Sans KR (고딕) | Noto Serif KR (명조) | `font-display` / `font-serif` |
| **본문** | Noto Sans KR | Noto Sans KR | `font-sans` |

**테마 인식 헤드라인:** `heading-themed` 클래스 사용 (자동으로 테마에 맞는 폰트 적용)

### Icon System (Lucide React)

| 속성 | 권장값 |
|------|--------|
| size | 16-24px |
| strokeWidth | 1.5 (기본 2px보다 얇게) |
| color | `currentColor` |

**주요 아이콘 매핑:**
- 콩 화폐: `<KongIcon />` (커스텀 SVG) - **이모지 사용 금지**
- 트로피: `<Trophy />` | 날짜: `<Calendar />` | 장소: `<MapPin />`
- 참가자: `<Users />` | 책: `<BookOpen />` | 알림: `<Bell />`
- Electric 토글: `<Zap />` | Warm 토글: `<Coffee />`

### z-Index Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default |
| `z-card` | 10 | Cards |
| `z-sticky` | 100 | Sticky headers |
| `z-fab` | 200 | FAB buttons |
| `z-dropdown` | 300 | Dropdowns |
| `z-modal-overlay` | 1000 | Bottom Sheet overlay |
| `z-modal` | 1001 | Bottom Sheet content |
| `z-toast` | 2000 | Toast notifications |

### Shadows & Animations

Shadows: `shadow-card`, `shadow-card-hover`, `shadow-sheet`, `shadow-fab`, `shadow-modal`

Tailwind: `animate-fade-in`, `animate-fade-in-up`, `animate-slide-up`

Framer Motion variants: `/lib/animations.ts`

---

## Code Rules

### PROHIBITED

| Pattern | Alternative |
|---------|-------------|
| `as any` | Proper types or `unknown` |
| `console.log` | Logger from `@/lib/logger.ts` |
| Inline styles | Tailwind classes |
| Hardcoded values | Constants or DB config |
| Emojis | Lucide React icons |
| `warm-*` classes | CSS variables (`var(--primary)`) |

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MeetingCard.tsx` |
| Utilities/Services | camelCase | `payment.ts` |
| Route folders | kebab-case | `my-page/` |
| Types | PascalCase | `Meeting.ts` |

### Key Rules

- Server Components by default; `'use client'` only when needed
- Page/API routes under 200 lines; split if exceeded
- Mobile-first responsive (360px baseline)
- Korean for user-facing text; English for code/comments
- 가격 표기: `<KongIcon /> N콩` 형식

---

## Key Business Logic

### Refund Policies (DB-driven, NEVER hardcode)

- Regular: 100% (3+ days), 50% (2 days), 0% (1 day)
- Discussion: 100% (14+ days), 50% (7+ days), 0% (<7 days)

### Capacity Management

- Display: **"O명 참여"** (hide max capacity)
- Use `FOR UPDATE` locks for concurrent registration
- Badge: "마감임박" when ≤3 spots

### Currency

- All amounts: **"콩"** (beans), not ₩
- 1 콩 = 1 원 (internal conversion)
- 표기 형식: `<KongIcon /> 10,000콩` (커스텀 SVG 아이콘 필수)

---

## Git Workflow

### Branch & Commit

```bash
# Branch naming
feature/m[번호]-[작업명]
fix/[설명]

# Commit format
[M번호] 타입: 한글 설명

# Example
[M9] feat: 티켓 발권 애니메이션 구현
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `WIP`

### Pre-commit Required

```bash
npx tsc --noEmit && npm run build
```

### Prohibited

- Direct work on `main` branch
- Committing `.env.local`
- `git push --force`
- Merge/delete without user confirmation

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PortOne (V2 API)
PORTONE_API_KEY=
PORTONE_API_SECRET=
NEXT_PUBLIC_PORTONE_STORE_ID=

# Solapi
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

See `jidokhae/.env.example` for full list.

---

## Database Schema

Source of truth: `jidokhae/supabase/schema-complete.sql`

Key tables:
- `users` - Member profiles (synced from `auth.users` via trigger)
- `meetings` - Meeting definitions
- `registrations` - Registrations with payment status, seat_number
- `waitlists` - Waitlist entries with position
- `refund_policies` - Configurable refund rules (JSONB)
- `praises`, `badges`, `bookshelf`, `reviews` - Engagement features
- `notification_templates`, `notification_logs` - Alimtalk system
- `admin_permissions` - 7 granular admin permissions
- `banners`, `gallery_images` - Content management (Admin)

All tables have RLS policies enabled.

---

## Development Milestones

| Milestone | Focus | Status |
|-----------|-------|--------|
| M1-M7 | MVP (Auth, Payment, Notifications, Engagement, Admin) | Complete |
| M8 | Ritual Foundation (Micro-Copy, No-Emoji, Sound/Haptic) | Complete |
| M9 | Commitment Ritual (Ticket System, Animations) | Complete |
| M10-M12 | Experience Enhancement | WP done, code pending |
| M13-M17 | Backoffice MVP | WP done, code pending |

Current: **Beta-ready** (M1-M9 complete)

---

## Quick Reference

### Creating a Server Component Page

```typescript
// app/meetings/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function MeetingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', params.id)
    .single()

  return <MeetingDetail meeting={meeting} />
}
```

### Creating an API Route

```typescript
// app/api/meetings/route.ts
import { createClient } from '@/lib/supabase/server'
import { successResponse, withErrorHandler } from '@/lib/api'

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const { data } = await supabase.from('meetings').select('*')
    return successResponse(data)
  })
}
```

### Using Icons (No Emoji!)

```tsx
import { Calendar, MapPin, Users } from 'lucide-react'
import { KongIcon } from '@/components/icons/KongIcon'

<Calendar size={16} strokeWidth={1.5} />
<KongIcon size={16} />
<span>5,000콩</span>
```

### Theme-aware Component

```tsx
'use client'
import { useTheme } from '@/providers/ThemeProvider'

export function SessionCard() {
  const { theme } = useTheme()

  return (
    <article>
      {/* 테마별 헤드라인 폰트 */}
      <h2 className={theme === 'warm' ? 'font-serif' : 'font-sans'}>
        모임 제목
      </h2>
    </article>
  )
}
```

### Adding Animation

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Version

Last updated: 2026-02-03
Document version: 2.2

### 변경 이력
- v2.2: Gallery 관리 API 추가, heading-themed 클래스 문서화, DB 스키마 업데이트
- v2.1: Cron Jobs 문서화, Logger API 상세화, 단일 테스트 실행 명령 추가, 충돌 해결
- v2.0: One-Page Architecture, Bottom Sheet 패턴 추가
- v1.5: Electric/Warm 테마 시스템, No-Emoji 정책 강화
