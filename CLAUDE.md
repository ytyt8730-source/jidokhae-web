# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

지독해(Jidokhae) - A web service for a reading club in Gyeongju/Pohang, Korea. Members join meetings, make payments, and build community through praise, badges, and book tracking.

**Brand:** "낮과 밤의 서재" - Dual theme system (Electric: modern/energetic, Warm: calm/classic)

---

## Commands

**IMPORTANT:** All commands run from `jidokhae/` subdirectory unless marked with `(root)`.

### Development

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript check (tsc --noEmit)
```

### Testing (Vitest)

```bash
npm run test                              # Watch mode
npm run test:run                          # Run once
npm run test:ui                           # Interactive UI
npm run test -- src/lib/utils.test.ts     # Single file
npm run test -- --grep "payment"          # Pattern match
npm run test:coverage                     # Coverage report (threshold: 60%)
```

### Pre-commit (REQUIRED)

**Use ONE of these before every commit:**

```bash
# RECOMMENDED: Comprehensive check
./scripts/check-all.sh    # (root) Type + Build + Lint + Env validation

# ALTERNATIVE: Minimal check
npx tsc --noEmit && npm run build
```

### Utility Scripts (root)

```bash
# Quality
./scripts/quality-gate.sh     # File size >200, console.log, as any checks
./scripts/deploy-check.sh     # Full deployment readiness check

# Development
./scripts/gen-types.sh        # Generate Supabase types → src/types/database.ts
./scripts/test-cron.sh        # Test cron endpoints locally
./scripts/status.sh           # Quick project status check

# Scaffolding
./scripts/create-component.sh [name] [client|server|page]
./scripts/create-api.sh [path] [GET,POST,...]

# Git
./scripts/clean-branches.sh   # Clean merged branches
./scripts/rollback.sh [M] [P] # Rollback to last success
```

---

## Tech Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | **Next.js 14** | App Router only (NOT Pages Router) |
| Language | **TypeScript 5** | Strict mode enabled |
| Styling | **Tailwind CSS 3.4** | CSS Variables for theming |
| Animation | **Framer Motion** | Micro-interactions |
| Icons | **Lucide React** | strokeWidth: 1.5, NO emojis allowed |
| Backend | **Supabase** | PostgreSQL + Auth + Realtime, RLS enabled |
| Payment | **PortOne V2** | KakaoPay, TossPay |
| Notifications | **Solapi** | Kakao Alimtalk |
| Monitoring | **Sentry** | Error tracking & performance |

---

## Architecture

### Request Flow

```
Request → middleware.ts (auth check) → Page/API Route → Supabase (with RLS)
```

### Middleware (`src/middleware.ts`)

All requests pass through middleware for session refresh:

```typescript
// Handles: session refresh, auth state sync between server/client
// Protected routes: /mypage/*, /admin/*
// Public routes: /, /about, /meetings, /auth/*
```

### Supabase Client Usage

```typescript
// Server Components & API Routes - USE THIS BY DEFAULT
import { createClient } from '@/lib/supabase/server'

// Client Components - ONLY when 'use client' is required
import { createClient } from '@/lib/supabase/client'

// Admin operations - ONLY when bypassing RLS is necessary
import { createServiceClient } from '@/lib/supabase/server'
```

### Providers (in `src/app/layout.tsx`)

```typescript
// Provider hierarchy (order matters):
<ThemeProvider>           // Theme context (electric/warm)
  <AuthProvider>          // Supabase session
    <OnboardingRedirectProvider>  // New member redirect
      <ToastProvider>     // Toast notifications
        {children}
      </ToastProvider>
    </OnboardingRedirectProvider>
  </AuthProvider>
</ThemeProvider>
```

### API Response Pattern

```typescript
import { successResponse, withErrorHandler } from '@/lib/api'

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const { data } = await supabase.from('meetings').select('*')
    return successResponse(data)
  })
}
// Response: { success: boolean, data?: T, error?: { code, message } }
```

### Error Codes

| Range | Category | Example |
|-------|----------|---------|
| 1xxx | Auth | 1001: unauthorized, 1002: invalid_token |
| 2xxx | Payment | 2001: payment_failed, 2002: refund_failed |
| 3xxx | External APIs | 3001: solapi_error, 3002: portone_error |
| 4xxx | Business logic | 4001: capacity_full, 4002: not_eligible |
| 5xxx | System | 5001: internal_error, 5002: db_error |

### Logging

**NEVER use `console.log`. ALWAYS use logger:**

```typescript
import { paymentLogger } from '@/lib/logger'

// Available loggers:
// authLogger, paymentLogger, notificationLogger, meetingLogger,
// registrationLogger, waitlistLogger, cronLogger, systemLogger, onboardingLogger

paymentLogger.info('Payment initiated', { userId, amount })
paymentLogger.error('Payment failed', { errorCode, message })
```

---

## Key Modules

### Core (`@/lib/`)

| Module | Purpose | When to use |
|--------|---------|-------------|
| `api` | Response helpers, validation | Every API route |
| `errors` | AppError class, error codes | Throwing typed errors |
| `logger` | Structured logging | All logging (not console.log) |
| `env` | Environment validation | Startup checks |
| `supabase/*` | DB clients | All DB operations |

### Auth & Security

| Module | Purpose |
|--------|---------|
| `permissions` | Role-based access control |
| `cron-auth` | Cron job authentication (CRON_SECRET) |
| `rate-limit` | API rate limiting (presets: auth, payment, standard) |
| `otp` | Phone OTP authentication |

### Business Logic

| Module | Purpose |
|--------|---------|
| `eligibility` | Meeting join eligibility (6-month window) |
| `payment` | PortOne V2 integration |
| `ticket` | Digital ticket generation |
| `badges` | Badge system (server-side) |
| `badges-client` | Badge rendering (client-side) |
| `praise` | Member praise/points |
| `transfer` | Registration transfer |
| `auto-complete` | Meeting auto-completion |

### Notifications

| Module | Purpose |
|--------|---------|
| `notification/` | Solapi Alimtalk |
| `onboarding/reminder` | Signup/first-meeting reminders |
| `reminder` | General meeting reminders |
| `segment-notification` | Segment-based targeting |
| `waitlist-notification` | Waitlist status changes |

### UX

| Module | Purpose |
|--------|---------|
| `sound` | SoundManager singleton |
| `animations` | Framer Motion presets |
| `ticket-export` | Ticket image export |

### Hooks (`@/hooks/`)

| Hook | Purpose |
|------|---------|
| `useFeedback` | Unified sound + haptic |
| `useTickets` | Ticket list management |
| `useTearGesture` | Ticket tear animation |
| `useTypewriter` | Typewriter effect |
| `useOnboardingRedirect` | New member redirect |
| `useMeetingParticipants` | Participant list |

---

## Code Rules

### PROHIBITED (Strict)

| Pattern | Use Instead | Why |
|---------|-------------|-----|
| `as any` | Proper type or `unknown` | Type safety |
| `console.log` | Logger from `@/lib/logger` | Production logging |
| Inline styles `style={{}}` | Tailwind classes | Consistency |
| Emojis (any) | Lucide React icons | Cross-platform rendering |
| Hardcoded business values | DB config or constants | Maintainability |

### When to use `unknown` vs Proper Type

```typescript
// USE unknown: External data with uncertain shape
const data: unknown = await externalApi.fetch()
if (isValidResponse(data)) { /* use data */ }

// USE proper type: Internal data, DB results, known shapes
const meeting: Meeting = await supabase.from('meetings').select('*').single()
```

### When to use `'use client'`

Add `'use client'` directive ONLY when the component:
- Uses React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Has event handlers (`onClick`, `onChange`, `onSubmit`, etc.)
- Uses browser APIs (`localStorage`, `window`, `document`)
- Uses client-only libraries (Framer Motion animations, etc.)

**Default is Server Component. Do NOT add 'use client' preemptively.**

### File Size Limits

| Type | Max Lines | Action if exceeded |
|------|:---------:|-------------------|
| Page/API Route | 200 | Extract to lib/ or components/ |
| Utility | 100 | Split into focused modules |
| Service Class | 300 | Decompose by responsibility |

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MeetingCard.tsx` |
| Hooks | camelCase, use prefix | `useFeedback.ts` |
| Utilities | camelCase | `payment.ts` |
| Routes | kebab-case | `my-page/` |
| Constants | SCREAMING_SNAKE | `MAX_CAPACITY` |
| Types/Interfaces | PascalCase | `Meeting`, `UserProfile` |
| Booleans | is/has/can prefix | `isLoading`, `hasPermission` |

### Language

- **UI text**: Korean
- **Code, comments, types**: English

---

## Database Patterns

### Concurrent Registration Lock

```typescript
// ALWAYS use FOR UPDATE when checking capacity
const { data: meeting } = await supabase
  .from('meetings')
  .select('*')
  .eq('id', meetingId)
  .single()
  .forUpdate()  // Prevents race conditions
```

### DB-driven Configuration

```typescript
// NEVER hardcode business rules. ALWAYS read from DB:
const { data: refundPolicy } = await supabase
  .from('refund_policies')
  .select('*')
  .eq('meeting_type', meetingType)
  .single()

// Use the policy values, not hardcoded numbers
const refundRate = calculateRefund(daysUntilMeeting, refundPolicy)
```

### Row Level Security (RLS)

```typescript
// Regular client respects RLS (user can only see their data)
const supabase = await createClient()

// Service client bypasses RLS (admin operations only)
const supabaseAdmin = await createServiceClient()
```

---

## Design System

> **Full reference:** `/docs/design-system.md`

### Core Principles

| Principle | Rule |
|-----------|------|
| **No-Emoji** | ALL icons via Lucide React or custom SVG. Zero exceptions. |
| **One-Page** | Use Bottom Sheet pattern, minimize navigation |
| **8px Grid** | `p-2` (8px), `p-4` (16px), `gap-6` (24px) |
| **Mobile-First** | Design from 360px baseline |

### Theme Colors

| Variable | Electric | Warm |
|----------|----------|------|
| `--primary` | #0047FF (Cobalt) | #0F172A (Navy) |
| `--accent` | #CCFF00 (Lime) | #EA580C (Orange) |
| `--bg-base` | #F8FAFC | #F5F5F0 |

**CRITICAL:** `#CCFF00` (lime) CANNOT be used as text color - poor readability.

### Icon Usage

```tsx
import { Calendar, MapPin } from 'lucide-react'
import { KongIcon } from '@/components/icons/KongIcon'

// Standard icons
<Calendar size={16} strokeWidth={1.5} />

// Currency icon (NOT emoji 🫘)
<KongIcon size={16} />
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

---

## Business Logic

### Currency: "콩" (beans)

- 1 콩 = 1 원
- Display: `<KongIcon /> 10,000콩`

### Refund Policies (DB-driven)

| Type | 3+ days | 2 days | 1 day |
|------|:-------:|:------:|:-----:|
| Regular | 100% | 50% | 0% |

| Type | 14+ days | 7+ days | <7 days |
|------|:--------:|:-------:|:-------:|
| Discussion | 100% | 50% | 0% |

**NEVER hardcode these values. Read from `refund_policies` table.**

### Capacity Display

- Show: "O명 참여" (current participants)
- Hide: max capacity (never show to users)

### Eligibility

- 6-month participation window for regular meetings
- Check via `@/lib/eligibility`

---

## Rate Limiting

```typescript
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Choose appropriate limiter:
  // - rateLimiters.auth: login, OTP (strict)
  // - rateLimiters.payment: payment operations (strict)
  // - rateLimiters.standard: general APIs (lenient)

  const result = checkRateLimit(request, rateLimiters.payment)
  if (!result.success) return rateLimitExceededResponse(result)

  // ... business logic
}
```

---

## Git Workflow

### Branch Naming

```
feature/m[번호]-[작업명]    # Milestone work
fix/[설명]                  # Bug fixes
```

### Commit Format

```
[M번호] 타입: 한글 설명

# Types: feat, fix, refactor, docs, chore, WIP
# Example: [M9] feat: 티켓 발권 애니메이션 구현
```

### PROHIBITED

- Direct work on `main` branch
- Committing `.env.local` or any secrets
- `git push --force`
- Merge/delete without user confirmation

---

## Key Files

| File | Purpose |
|------|---------|
| `/docs/design-system.md` | Full design system (v3.5) |
| `/docs/owner-tasks.md` | Operator manual tasks |
| `/docs/adr/` | Architecture Decision Records |
| `/docs/code-quality.md` | SOLID/DRY/KISS guide |
| `/docs/runbook/` | Incident response & rollback |
| `/jidokhae/supabase/schema-complete.sql` | Database schema |
| `/log/current-state.md` | Current development status |
| `/roadmap/milestones.md` | Development roadmap |
| `/core/AI_AGENT_GUIDE.md` | Document navigation rules |

---

## Cron Jobs (vercel.json)

All times in UTC. KST = UTC + 9.

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/reminder` | 22:00 daily | Meeting D-1 reminders |
| `/api/cron/waitlist` | hourly | Process waitlist |
| `/api/cron/auto-complete` | 03:00 daily | Complete past meetings |
| `/api/cron/afterglow` | */30 * * * * | Post-meeting followup |
| `/api/cron/welcome` | 01:00 daily | New member welcome |
| `/api/cron/post-meeting` | 01:00 daily | Post-meeting notifications |
| `/api/cron/monthly` | 01:00, 25th | Monthly summary |
| `/api/cron/segment-reminder` | 02:00 daily | Segment-based reminders |
| `/api/cron/eligibility-warning` | 01:00 Mon | Eligibility warnings |
| `/api/cron/onboarding-signup` | 01:00 daily | Signup reminder (3/7 days) |
| `/api/cron/onboarding-first-meeting` | 01:00 daily | First meeting followup |
| `/api/cron/praise-nudge` | 01:00 daily | Encourage praise giving |
| `/api/cron/transfer-timeout` | hourly | Auto-cancel expired transfers |

---

## Project Structure

```
/jidokhae-web
├── /core            # Planning documents (PRD, specs)
├── /docs            # Technical documentation
├── /roadmap         # Milestones & work packages
├── /log             # Work logs & current state
├── /scripts         # Automation scripts (run from root)
├── /jidokhae        # Next.js source code
│   ├── /src/app           # App Router pages & API routes
│   ├── /src/components    # React components
│   ├── /src/lib           # Utilities & services
│   ├── /src/hooks         # Custom React hooks
│   ├── /src/types         # TypeScript definitions
│   ├── /src/providers     # Context providers
│   └── /src/middleware.ts # Auth middleware
└── CLAUDE.md
```

---

## Document Priority

When documents conflict, follow this order:

1. **`CLAUDE.md`** - Code conventions (THIS FILE - highest priority)
2. **`/roadmap/work-packages/`** - Current task requirements
3. **`/core/*.md`** - Planning intent
4. **`/docs/*.md`** - Technical guides

> See `/core/AI_AGENT_GUIDE.md` for detailed navigation rules.

---

Last updated: 2026-02-06 | v3.1
