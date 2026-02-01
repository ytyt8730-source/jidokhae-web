# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

지독해(Jidokhae) - A web service for a reading club in Gyeongju/Pohang, Korea. Members can join meetings, make payments, and build community through features like praise, badges, and book tracking.

**Brand Tone:** 따뜻하고 편안하면서도, 고급스럽고 진지하게 느껴지는 분위기. Apple과 Airbnb의 세련됨을 참고.

---

## Commands

All commands run from `/jidokhae` directory:

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript check (must pass with 0 errors)

# Testing
npm test             # Run vitest
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Pre-commit (REQUIRED)
npx tsc --noEmit && npm run build

# Supabase types
npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
```

---

## Tech Stack

| Category | Technology | Version/Notes |
|----------|------------|---------------|
| Framework | Next.js | 14 (App Router, NOT Pages Router) |
| UI | React | 18 (Server Components default) |
| Language | TypeScript | 5 (Strict mode) |
| Styling | Tailwind CSS | 3.4 (NOT v4) |
| Animation | Framer Motion | 12.x |
| Backend | Supabase | PostgreSQL, Auth, Realtime |
| Payment | PortOne | V2 API |
| Notifications | Solapi | Kakao Alimtalk |
| Icons | lucide-react | strokeWidth=1.5 |
| Dates | date-fns | 4.x |
| Monitoring | Sentry | Error tracking |

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
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api'

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
import { createLogger } from '@/lib/logger'
const logger = createLogger('payment')
logger.info('Payment initiated', { userId, amount })
```

**NEVER use `console.log`** - always use the logger.

---

## Design System v3.3

### No-Emoji Policy (CRITICAL)

> **All emoji usage is prohibited.** Emojis render differently across OS/browsers, breaking brand consistency.

| Forbidden | Replacement |
|-----------|-------------|
| Beans (콩) | `<KongIcon />` (custom SVG) |
| Trophy | `<Trophy />` (Lucide) |
| Calendar | `<Calendar />` (Lucide) |
| Location | `<MapPin />` (Lucide) |
| Any emoji | Lucide React icon |

### Theme System

Two switchable themes via CSS variables (`data-theme` attribute):

| Property | Electric (Default) | Warm |
|----------|-------------------|------|
| Background | `#F8FAFC` | `#F5F5F0` (Sand + Noise) |
| Primary | `#0047FF` (Cobalt) | `#0F172A` (Navy) |
| Accent | `#CCFF00` (Lime) | `#EA580C` (Orange) |
| Logo Font | Sans (Outfit) | Serif (Noto Serif KR) |

**CSS Variables** (in `globals.css`):
- `--bg-base`, `--bg-surface`, `--primary`, `--accent`
- `--text`, `--text-muted`, `--border`

**Theme Toggle Location:**
- Desktop: Sidebar bottom
- Mobile: Settings or header icon
- Storage: `localStorage('jidokhae-theme')`

### Typography

| Font | Usage |
|------|-------|
| **Pretendard / Noto Sans KR** | Body text, UI |
| **Noto Serif KR** | Quotes, book titles (Warm theme headlines) |
| **Outfit** | Electric theme headlines |

### Spacing

**8px baseline grid** - Use Tailwind: `p-2` (8px), `p-4` (16px), `gap-6` (24px)

---

## Code Rules

### MUST Follow

- Server Components by default; `'use client'` only when needed
- Page/API routes under 200 lines; split if exceeded
- Mobile-first responsive (360px baseline)
- Korean for user-facing text; English for code/comments
- All icons: `strokeWidth={1.5}`

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
| Utilities | camelCase | `payment.ts` |
| Routes | kebab-case | `my-page/` |

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

All amounts: **"콩"** (beans), not ₩. Use `<KongIcon />` + "N콩"

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

All tables have RLS policies enabled.

---

## Development Milestones

| Milestone | Focus | Status |
|-----------|-------|--------|
| M1-M7 | MVP (Auth, Payment, Notifications, Engagement, Admin) | ✅ Complete |
| M8 | Ritual Foundation (Micro-Copy, No-Emoji, Sound/Haptic) | ✅ Complete |
| M9 | Commitment Ritual (Ticket System, Animations) | ✅ Complete |
| M10-M12 | Experience Enhancement | ⏳ WP done, code pending |
| M13-M17 | Backoffice MVP | ⏳ WP done, code pending |

Current: **Beta-ready** (M1-M9 complete)

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

---

## Version

Last updated: 2026-02-01
Document version: 2.0
