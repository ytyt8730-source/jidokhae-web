# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

지독해(Jidokhae) - A web service for a reading club in Gyeongju/Pohang, Korea. Members can join meetings, make payments, and build community through features like praise, badges, and book tracking.

**Brand Tone:** 따뜻하고 편안하면서도, 고급스럽고 진지하게 느껴지는 분위기. Apple과 Airbnb의 세련됨을 참고.

---

## Repository Structure

```
/core                  # Core documentation (PRD, system architecture, tech stack)
/docs                  # Technical docs (ADR, runbook, testing, code quality)
/roadmap               # Development milestones and work packages
  /work-packages       # WP-M1, WP-M2, etc.
  /scenarios           # SC-M1, SC-M2, etc.
/jidokhae              # Next.js application (main codebase)
  /src
    /app               # Next.js App Router pages
    /components        # React components
    /lib               # Utilities, Supabase clients, API helpers
    /types             # TypeScript type definitions
  /supabase            # Database schema (schema.sql)
/log                   # Development logs and current state
```

---

## Commands

All commands run from `/jidokhae` directory:

```bash
npm run dev      # Start development server (default: localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npx tsc --noEmit # TypeScript type check (must pass with 0 errors)
```

Supabase type generation:
```bash
npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
```

---

## Tech Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | **Next.js 14** | App Router (NOT Pages Router) |
| UI | **React 18** | Server Components by default |
| Language | **TypeScript 5** | Strict mode enabled |
| Styling | **Tailwind CSS 3.4** | NOT v4 (different config format) |
| Animation | **Framer Motion** | Stagger, hover, micro-interactions |
| Backend | **Supabase** | PostgreSQL, Auth, Realtime |
| Payment | **PortOne** | KakaoPay, TossPay integration |
| Notifications | **Solapi** | Kakao Alimtalk |
| Icons | **lucide-react** | Consistent icon set |
| Dates | **date-fns 4** | Date manipulation |

---

## Architecture

### Supabase Client Usage

| Context | Import | Use Case |
|---------|--------|----------|
| Server Components | `@/lib/supabase/server` | SSR data fetching |
| API Routes | `@/lib/supabase/server` | Backend operations |
| Client Components | `@/lib/supabase/client` | Browser interactions |
| Admin operations | `createServiceClient()` | Service role access (bypasses RLS) |

### API Response Pattern

Use standardized helpers from `@/lib/api.ts`:

```typescript
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api'

export async function GET() {
  return withErrorHandler(async () => {
    const data = await fetchData()
    return successResponse(data)
  })
}
```

Response format: `{ success: boolean, data?: T, error?: { code, message }, meta?: object }`

### Error Handling

Use error codes from `@/lib/errors.ts`:

| Range | Category | Examples |
|-------|----------|----------|
| 1xxx | Authentication | 1001 (Unauthorized), 1002 (Token expired) |
| 2xxx | Payment | 2001 (Payment failed), 2002 (Refund failed) |
| 3xxx | External services | 3001 (Alimtalk failed) |
| 4xxx | Business logic | 4001 (Meeting full), 4002 (Already registered) |
| 5xxx | System errors | 5001 (DB error), 5002 (Unknown) |

### Logging

Use structured logger from `@/lib/logger.ts`:

```typescript
import { createLogger } from '@/lib/logger'
const logger = createLogger('payment')

logger.info('Payment initiated', { userId, amount })
logger.error('Payment failed', { error, context })
```

**NEVER use `console.log`** - always use the logger.

### Component Guidelines

- Server Components are default; add `'use client'` only when needed
- Keep page components under 200 lines; split if exceeded
- Use API routes under 200 lines; extract to service layer if exceeded

---

## Design System

### Grid System

- **8px baseline grid** for all spacing and sizing
- Use Tailwind spacing: `p-2` (8px), `p-4` (16px), `gap-6` (24px)
- All dimensions should be multiples of 8px

### Colors

Defined in `tailwind.config.ts`:

```
Warm Neutrals (Primary):
  warm-50 to warm-900  (cream/beige tones for backgrounds, text)

Brand Accent:
  brand-500: #c77654   (terracotta - main brand color)
  brand-600: #b55f3e   (hover state)
  brand-700: #974c33   (active state)

Status Colors:
  success: #059669     (green)
  warning: #d97706     (orange)
  error: #dc2626       (red)
  info: #2563eb        (blue)
```

Use Tailwind classes: `bg-warm-100`, `text-brand-600`, `border-warm-200`

### Typography

| Font | Usage | CSS Variable |
|------|-------|--------------|
| **Pretendard** | Body text, UI | `--font-pretendard` |
| **Noto Serif KR** | Quotes, book titles, emphasis | `--font-serif` |

Load via `next/font/google` in `app/layout.tsx`.

### Animations (Framer Motion)

| Effect | Usage | Timing |
|--------|-------|--------|
| **Stagger** | Card lists, item reveals | 0.1s delay between items |
| **Hover** | Cards, buttons | scale(1.02), shadow increase |
| **Click** | Buttons, interactive | scale(0.98) feedback |
| **Pulse** | Urgent badges | Continuous subtle animation |
| **Confetti** | Badge earned, achievements | On trigger event |
| **Spring** | Modal open/close | physics-based motion |

Common animation variants should be defined in `/lib/animations.ts`.

---

## Code Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MeetingCard.tsx` |
| Utilities/Services | camelCase | `payment.ts` |
| Route folders | kebab-case | `my-page/` |
| Types | PascalCase | `Meeting.ts` |

### Key Rules

- ❌ No `as any` - use proper types or `unknown`
- ❌ No hardcoded values - use constants or DB config
- ❌ No `console.log` - use logger from `@/lib/logger.ts`
- ❌ No inline styles - use Tailwind classes
- ✅ Mobile-first responsive design (360px baseline)
- ✅ Korean language for user-facing text
- ✅ English for code, comments, and technical docs

### Git Commit Format

```
[WP-M1] feat: 회원가입 폼 UI 구현
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`, `chore`

Branch naming: `feature/wp-m1-auth`, `fix/login-error`

---

## Key Business Logic

### Refund Policies

- **NEVER hardcode** - stored in DB (`refund_policies` table)
- Regular meetings: 100% (3+ days before), 50% (2 days), 0% (1 day or less)
- Discussion meetings: 100% (2+ weeks before), 50% (7+ days), 0% (less than 7 days)

### Capacity Management

- Display format: **"O명 참여"** (hide max capacity)
- Use database transactions with `FOR UPDATE` locks for concurrent registration
- Show "마감임박" badge when ≤3 spots remaining

### Member Eligibility

- `is_new_member` flag for first-time members
- 6-month regular meeting participation required for eligibility
- Track via `last_regular_meeting_at` field

### Currency

- All amounts displayed as **"콩"** (beans), not ₩
- 1 콩 = 1 원 (internal conversion)

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payment (M2)
PORTONE_API_KEY=
PORTONE_API_SECRET=

# Notifications (M3)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
```

See `jidokhae/ENV_TEMPLATE.md` for full list with descriptions.

---

## Development Milestones

| Milestone | Focus | Status |
|-----------|-------|--------|
| **M1** | Infrastructure, auth, basic UI | ✅ Functional |
| **M1.5** | Design System (Framer Motion, fonts, 8px grid) | 🔄 Pending |
| **M2** | Payment (PortOne), refunds, waitlist | ⏳ Next |
| **M3** | Notifications (Solapi alimtalk) | ⏳ Planned |
| **M4** | Engagement (praise, badges, bookshelf) | ⏳ Planned |
| **M5** | Admin tools (dashboard, permissions) | ⏳ Planned |
| **M6** | Landing page, launch prep | ⏳ Planned |

See `/roadmap/milestones.md` for detailed breakdown.

---

## Database Schema

Single source of truth: `jidokhae/supabase/schema.sql`

Key tables:
- `users` - Member profiles (synced from `auth.users` via trigger)
- `meetings` - Meeting definitions
- `registrations` - Meeting registrations with payment status
- `waitlist` - Waitlist entries
- `refund_policies` - Configurable refund rules
- `praises` - Member-to-member praise
- `badges` - Achievement badges

All tables have RLS (Row Level Security) policies enabled.

---

## Testing Strategy

| Phase | Type | Scope |
|-------|------|-------|
| Development | Manual + Browser tools | Feature verification |
| M1 Complete | Alpha | Operators + 3-5 members |
| M3 Complete | Beta | 20-30 active members |
| M5 Complete | Production | All members |

---

## Quick Reference

### Creating a new page

```typescript
// app/meetings/[id]/page.tsx (Server Component)
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

### Creating an API route

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

### Adding animation

```typescript
// With Framer Motion
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

## 컨텍스트 로딩 프로토콜

> **핵심**: 파일을 직접 열지 말고, 에이전트나 스크립트를 사용하라.

### 프로젝트 파악 요청 시
```bash
# 비효율적 (토큰 낭비)
cat CLAUDE.md
ls -la jidokhae/src/
find . -name "*.tsx"

# 효율적
@agent-컨텍스트 전체 파악해줘
@agent-컨텍스트 최근 변경분만
```

### 컨텍스트 로딩 우선순위

| 상황 | 사용할 것 | 토큰 |
|------|----------|------|
| 새 대화 시작 | `@agent-컨텍스트 전체 파악해줘` | ~30K |
| 이어서 작업 | `@agent-컨텍스트 최근 변경분만` | ~5K |
| 빠른 확인 | `bash scripts/status.sh` | ~1K |

### 에이전트 vs 내장 기능

| 용도 | 사용할 것 |
|------|----------|
| 프로젝트 현황 파악 | `@agent-컨텍스트` |
| 코드 검색/탐색 | 내장 `Explore` (자동) |
| 계획 수립 | 내장 `Plan` (자동) |
| 코드 구현 | `@agent-코딩` |

---

## Git Workflow (필수 준수)

> 📋 **상세 규칙**: [/docs/git-workflow.md](/docs/git-workflow.md)

### 핵심 규칙 요약

| 상황 | 필수 행동 |
|------|----------|
| 세션 시작 | `git fetch && git pull` |
| 새 작업 | `git checkout -b feature/m[번호]-[작업명]` |
| 커밋 전 | `npx tsc --noEmit && npm run build` |
| 커밋 메시지 | `[M번호] 타입: 한글 설명` |
| 머지 | **사용자 확인 후에만** |

### 절대 금지

```
❌ .env.local 커밋
❌ git push --force
❌ main 브랜치에서 직접 작업
❌ 사용자 확인 없이 머지/삭제
```

---

## Version

Last updated: 2026-01-22
Document version: 1.3
