# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

지독해(Jidokhae) - A web service for a reading club in Gyeongju/Pohang, Korea. Members join meetings, make payments, and build community through praise, badges, and book tracking.

**Brand:** "낮과 밤의 서재" - Dual theme system (Electric: modern/energetic, Warm: calm/classic)

---

## Commands

All commands run from `jidokhae/` subdirectory (the Next.js app root):

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript check

# Testing (Vitest) - Coverage threshold: 60%
npm run test             # Watch mode
npm run test:run         # Run once
npm run test:ui          # Interactive UI mode
npm run test -- src/lib/utils.test.ts           # Single file
npm run test -- --grep "payment"                # Pattern match
npm run test:coverage    # With coverage report

# Screenshots (Playwright)
npm run screenshot              # All pages, mobile & desktop
npm run screenshot:mobile       # Mobile only (360px)
npm run screenshot:desktop      # Desktop only (1280px)

# Pre-commit (REQUIRED before every commit)
npx tsc --noEmit && npm run build

# Supabase types
npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
```

---

## Tech Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | **Next.js 14** | App Router only (NOT Pages Router) |
| Language | **TypeScript 5** | Strict mode |
| Styling | **Tailwind CSS 3.4** | CSS Variables for theming |
| Animation | **Framer Motion** | Micro-interactions |
| Icons | **Lucide React** | strokeWidth: 1.5, No emojis |
| Backend | **Supabase** | PostgreSQL, Auth, Realtime, RLS enabled |
| Payment | **PortOne V2** | KakaoPay, TossPay |
| Notifications | **Solapi** | Kakao Alimtalk |

---

## Architecture

### Supabase Client Usage

```typescript
// Server Components & API Routes
import { createClient } from '@/lib/supabase/server'

// Client Components
import { createClient } from '@/lib/supabase/client'

// Admin operations (bypasses RLS)
import { createServiceClient } from '@/lib/supabase/server'
```

### API Response Pattern

```typescript
import { successResponse, withErrorHandler } from '@/lib/api'

export async function GET() {
  return withErrorHandler(async () => {
    const data = await fetchData()
    return successResponse(data)
  })
}
// Response: { success: boolean, data?: T, error?: { code, message } }
```

### Error Codes

| Range | Category | Range | Category |
|-------|----------|-------|----------|
| 1xxx | Auth | 4xxx | Business logic |
| 2xxx | Payment | 5xxx | System |
| 3xxx | External APIs | | |

### Logging (NEVER use console.log)

```typescript
import { createLogger, paymentLogger } from '@/lib/logger'

const logger = createLogger('payment')
logger.info('Payment initiated', { userId, amount })
logger.error('Payment failed', { errorCode, message })

// Pre-defined: authLogger, paymentLogger, notificationLogger,
// meetingLogger, registrationLogger, waitlistLogger, cronLogger, systemLogger
```

### Key Lib Modules

| Module | Purpose |
|--------|---------|
| `@/lib/eligibility` | Meeting join eligibility checks |
| `@/lib/permissions` | Role-based access control |
| `@/lib/badges` | Badge system (server) |
| `@/lib/badges-client` | Badge system (client) |
| `@/lib/notification/` | Solapi Alimtalk integration |
| `@/lib/payment` | PortOne V2 payment processing |
| `@/lib/ticket` | Digital ticket generation |
| `@/lib/praise` | Member praise system |
| `@/lib/onboarding/reminder` | Signup/first-meeting reminder targeting |
| `@/lib/rate-limit` | API rate limiting (auth, payment, standard presets) |
| `@/lib/sound` | Sound effects (SoundManager singleton) |
| `@/lib/animations` | Framer Motion animation presets |

### Key Hooks

| Hook | Purpose |
|------|---------|
| `@/hooks/useFeedback` | Unified sound + haptic feedback |
| `@/hooks/useTypewriter` | Typewriter text animation |
| `@/hooks/useTickets` | Ticket list management |
| `@/hooks/useTearGesture` | Ticket tear drag gesture |
| `@/hooks/useOnboardingRedirect` | Auto-redirect new members to onboarding |

### API Validation Helpers

```typescript
import { validateRequired, requireAuth, requireAdmin } from '@/lib/api'

validateRequired(body, ['userId', 'amount'])  // Throws if missing
requireAuth(userId)    // Asserts userId is string
requireAdmin(role)     // Throws if not admin/super_admin
```

---

## Code Rules

### PROHIBITED

| Pattern | Use Instead |
|---------|-------------|
| `as any` | Proper types or `unknown` |
| `console.log` | Logger from `@/lib/logger` |
| Inline styles | Tailwind classes |
| Emojis | Lucide React icons |
| Hardcoded values | Constants or DB config |

### Conventions

- Server Components by default; `'use client'` only when needed
- Mobile-first (360px baseline)
- Korean for UI text; English for code/comments
- PascalCase components, camelCase utils, kebab-case routes

### File Size Limits

| Type | Max Lines |
|------|:---------:|
| Page/API Route | 200 |
| Utility | 100 |
| Service Class | 300 |

---

## Design System

> **Full details:** `/docs/design-system.md`

### Core Principles

| Principle | Description |
|-----------|-------------|
| **No-Emoji** | All icons via Lucide React or custom SVG |
| **One-Page** | Bottom Sheet pattern, minimize navigation |
| **8px Grid** | `p-2` (8px), `p-4` (16px), `gap-6` (24px) |

### Theme Colors (CSS Variables)

| Variable | Electric | Warm |
|----------|----------|------|
| `--primary` | #0047FF (Cobalt) | #0F172A (Navy) |
| `--accent` | #CCFF00 (Lime) | #EA580C (Orange) |
| `--bg-base` | #F8FAFC | #F5F5F0 |

**Critical:** Electric lime (`#CCFF00`) cannot be used as text color (poor readability).

### Icons

```tsx
import { Calendar, MapPin } from 'lucide-react'
import { KongIcon } from '@/components/icons/KongIcon'

<Calendar size={16} strokeWidth={1.5} />
<KongIcon size={16} />  // Currency icon (NOT emoji)
```

---

## Key Business Logic

### Currency: "콩" (beans)
- 1 콩 = 1 원
- Display: `<KongIcon /> 10,000콩`

### Refund Policies (DB-driven, never hardcode)
- Regular: 100% (3+ days), 50% (2 days), 0% (1 day)
- Discussion: 100% (14+ days), 50% (7+ days), 0% (<7 days)

### Capacity
- Display "O명 참여" (hide max capacity)
- Use `FOR UPDATE` locks for concurrent registration

---

## Git Workflow

```bash
# Branch naming
feature/m[번호]-[작업명]
fix/[설명]

# Commit format
[M번호] 타입: 한글 설명
# Example: [M9] feat: 티켓 발권 애니메이션 구현
```

**Prohibited:** Direct `main` work, committing `.env.local`, `git push --force`, merge/delete without user confirmation

---

## Quick Reference

### Server Component Page

```typescript
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

### API Route

```typescript
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

### Theme-aware Component

```tsx
'use client'
import { useTheme } from '@/providers/ThemeProvider'

export function Card() {
  const { theme } = useTheme()
  return (
    <h2 className={theme === 'warm' ? 'font-serif' : 'font-sans'}>
      Title
    </h2>
  )
}
```

### Rate Limited API Route

```typescript
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const result = checkRateLimit(request, rateLimiters.payment) // auth, standard, search
  if (!result.success) return rateLimitExceededResponse(result)
  // ... business logic
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `/docs/design-system.md` | Full design system (v3.5) |
| `/jidokhae/supabase/schema-complete.sql` | Database schema |
| `/jidokhae/.env.example` | Environment variables template |
| `/log/current-state.md` | Current development status |
| `/roadmap/milestones.md` | Development roadmap |
| `/roadmap/work-packages/WP-M*.md` | Work package definitions |
| `/roadmap/scenarios/SC-M*.md` | Test scenarios per milestone |
| `/core/AI_AGENT_GUIDE.md` | Document navigation guide |

---

## Cron Jobs (vercel.json)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/reminder` | 22:00 daily | Meeting reminders |
| `/api/cron/waitlist` | hourly | Process waitlist |
| `/api/cron/auto-complete` | 03:00 daily | Complete past meetings |
| `/api/cron/afterglow` | every 30min | Post-meeting followup |
| `/api/cron/welcome` | 10:00 KST daily | New member welcome |
| `/api/cron/post-meeting` | 10:00 KST daily | Post-meeting notifications |
| `/api/cron/onboarding-signup` | 10:00 KST daily | Signup reminder (3/7 days) |
| `/api/cron/onboarding-first-meeting` | 10:00 KST daily | First meeting followup |

## Project Structure

```
/jidokhae-web
├── /core            # Planning documents (PRD, specs)
├── /docs            # Technical documentation
├── /roadmap         # Development milestones & work packages
├── /log             # Work logs & current state
├── /scripts         # Automation scripts
├── /jidokhae        # Next.js source code
│   ├── /src/app     # App Router pages & API routes
│   ├── /src/components
│   ├── /src/lib     # Utilities & services
│   ├── /src/hooks   # Custom React hooks
│   ├── /src/types   # TypeScript definitions
│   └── /src/providers
└── CLAUDE.md
```

---

Last updated: 2026-02-05 | v2.7
