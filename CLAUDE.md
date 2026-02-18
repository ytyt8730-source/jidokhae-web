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
npm run screenshot         # Take page screenshots (Playwright)
npm run screenshot:mobile  # Mobile-only screenshots
npm run screenshot:desktop # Desktop-only screenshots
npm run screenshot:install # Install Playwright chromium (first-time setup)
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

**Test setup (`src/__tests__/setup.ts`)** pre-mocks: `next/navigation`, `next/headers`, `@/lib/supabase/client`

**Test file structure** mirrors `src/`:
```
src/__tests__/
├── setup.ts              # Global mocks, env vars, beforeEach clearAllMocks
├── lib/                  # Mirrors src/lib/
│   ├── utils.test.ts
│   ├── errors.test.ts
│   └── api.test.ts
└── components/ui/        # Mirrors src/components/
    └── Badge.test.tsx
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
./scripts/quality-gate.sh     # File size, console.log, as any, z-index, bg-white checks
./scripts/deploy-check.sh     # Full deployment readiness check
./scripts/find-pattern.sh     # Search for code anti-patterns
./scripts/count-lines.sh [N]  # Find files over N lines (default: 200)

# Development
./scripts/gen-types.sh        # Generate Supabase types → src/types/database.ts
./scripts/test-cron.sh        # Test cron endpoints locally
./scripts/test-api.sh [url]   # Smoke test API endpoints
./scripts/status.sh           # Quick project status check
./scripts/check-env.sh        # Validate environment variables
./scripts/db-migrate.sh       # Database migration guide (list/show/check)
./scripts/pre-commit.sh       # Pre-commit hook (.env check, type check)

# Workflow
./scripts/start-coding.sh     # Pre-coding checklist (branch, uncommitted, current-state)
./scripts/context-diff.sh [N] # Show last N days of changes for context

# Scaffolding
./scripts/create-component.sh [name] [client|server|page]
./scripts/create-api.sh [path] [GET,POST,...]
./scripts/scaffold-phase.sh M P  # Pre-create empty files for milestone M, phase P

# Git
./scripts/clean-branches.sh   # Clean merged branches
./scripts/rollback.sh [M] [P] # Rollback to last success

# AI/Context
./scripts/pipeline-logger.sh  # Pipeline progress logging (milestones)
./scripts/pack_context.py     # Context packing for LLM (requires pyperclip)
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
| Dates | **date-fns 4** | All date manipulation (NOT dayjs/moment) |
| Backend | **Supabase** | PostgreSQL + Auth + Realtime, RLS enabled |
| Payment | **PortOne V2** | KakaoPay, TossPay (SDK lazy-loaded in layout) |
| Notifications | **Solapi** | Kakao Alimtalk |
| Monitoring | **Sentry v10** | Error tracking & performance (`next.config.mjs` wrapped with `withSentryConfig`) |
| Class utils | **clsx + tailwind-merge** | Via `cn()` helper in `@/lib/utils` |

---

## Architecture

### Request Flow

```
Request → middleware.ts (auth check) → Page/API Route → Supabase (with RLS)
```

### Middleware (`src/middleware.ts` → `src/lib/supabase/middleware.ts`)

All non-static requests pass through middleware (negative matcher pattern):

- **Session refresh**: Syncs auth state between server/client
- **OAuth bypass**: `/auth/callback` is skipped entirely to prevent session cookie overwrite
- **Protected**: `/mypage/*` → redirect to `/auth/login` if unauthenticated
- **Protected**: `/admin/*` → requires `admin` or `super_admin` role (DB lookup)
- **NO auth→home redirect**: Authenticated users are NOT redirected from `/auth/*` pages (removed to prevent OAuth cookie loop — each auth page handles this client-side instead)

### OAuth Callback (`src/app/auth/callback/route.ts`)

The OAuth callback is the most complex auth route — handles Kakao login:
1. Exchanges auth code for session via `supabase.auth.exchangeCodeForSession()`
2. Fetches Kakao profile and auto-generates nickname if missing
3. Uses `pendingCookies` pattern: collects cookies during exchange, then manually sets them on the redirect response (because `NextResponse.redirect()` doesn't carry cookies from the Supabase client)
4. Middleware skips `/auth/callback` entirely to prevent overwriting these session cookies

**Known issue source:** If cookies are lost during redirect, user appears unauthenticated after login. Check the `pendingCookies` flow first when debugging auth issues.

### Supabase Client Usage

```typescript
// Server Components & API Routes - USE THIS BY DEFAULT
import { createClient } from '@/lib/supabase/server'

// Client Components - ONLY when 'use client' is required
import { createClient } from '@/lib/supabase/client'

// Admin operations - ONLY when bypassing RLS is necessary
import { createServiceClient } from '@/lib/supabase/server'

// All clients are typed with generated Database type from @/types/database
// Regenerate after schema changes: ./scripts/gen-types.sh (root)
```

### Layout Pattern (`src/app/layout.tsx`)

```typescript
// Provider hierarchy (order matters):
<ThemeProvider>           // Theme context (electric/warm)
  <AuthProvider>          // Supabase session
    <ToastProvider>       // Toast notifications
      <OnboardingRedirectProvider>  // New member redirect (uses Toast)
        {children}
      </OnboardingRedirectProvider>
    </ToastProvider>
  </AuthProvider>
</ThemeProvider>

// Responsive layout:
// Desktop (lg:): Fixed Sidebar (256px) + Content area (lg:ml-64)
// Mobile/Tablet: Header + Content area
```

### Fonts

| Font | Variable | Purpose |
|------|----------|---------|
| Pretendard (local) | `--font-pretendard` | Body text |
| Outfit (Google) | `--font-outfit` | Electric theme display headings |
| Noto Sans KR | `--font-noto-sans` | Body text (Korean) |
| Noto Serif KR | `--font-noto-serif` | Warm theme headings |

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

// Auth/validation helpers (use inside withErrorHandler):
import { requireAuth, requireAdmin, validateRequired } from '@/lib/api'
requireAuth(user?.id)      // Throws AUTH_UNAUTHORIZED if not authenticated
requireAdmin(userData.role) // Throws AUTH_UNAUTHORIZED if not admin/super_admin
validateRequired(body, ['meetingId', 'amount']) // Throws VALIDATION_ERROR if missing
```

### Error Codes (`@/lib/errors` ErrorCode enum)

| Range | Category | Examples |
|-------|----------|---------|
| 1xxx | Auth | 1001: AUTH_INVALID_TOKEN, 1003: AUTH_UNAUTHORIZED, 1009: AUTH_FORBIDDEN |
| 2xxx | Payment | 2001: PAYMENT_FAILED, 2006: REFUND_NOT_ELIGIBLE |
| 21xx | Transfer | 2101: TRANSFER_DEADLINE_EXPIRED, 2103: TRANSFER_SENDER_NAME_MISMATCH |
| 3xxx | External APIs | 3001: EXTERNAL_API_TIMEOUT, 3003: NOTIFICATION_SEND_FAILED |
| 40xx | Meeting | 4001: MEETING_NOT_FOUND, 4004: CAPACITY_EXCEEDED |
| 41xx | Registration | 4101: REGISTRATION_NOT_FOUND, 4102: REGISTRATION_ALREADY_EXISTS |
| 42xx | Waitlist | 4201: WAITLIST_NOT_FOUND |
| 43xx | Eligibility | 4301: ELIGIBILITY_NOT_MET |
| 44xx | Praise | 4401: PRAISE_DUPLICATE_MEETING |
| 45xx | Participation | 4501: PARTICIPATION_ALREADY_COMPLETED, 4502: PARTICIPATION_NO_SHOW |
| 5xxx | System | 5001: INTERNAL_ERROR, 5002: DATABASE_ERROR |

### Logging

**NEVER use `console.log`. ALWAYS use logger:**

```typescript
import { paymentLogger } from '@/lib/logger'

// Pre-built loggers (9):
// authLogger, paymentLogger, notificationLogger, meetingLogger,
// registrationLogger, waitlistLogger, cronLogger, systemLogger, onboardingLogger

paymentLogger.info('Payment initiated', { userId, amount })
paymentLogger.error('Payment failed', { errorCode, message })

// User context chaining (all subsequent logs include userId)
const logger = paymentLogger.withUser(userId)
logger.info('Processing refund', { amount })

// Performance timer
const timer = paymentLogger.startTimer()
await processPayment()
timer.done('Payment completed', { amount }) // auto-logs elapsed ms

// Custom loggers for other services:
import { createLogger } from '@/lib/logger'
const myLogger = createLogger('admin-gallery') // LogService type required
```

### Environment Variables

```typescript
// Check if a service is configured:
import { isConfigured } from '@/lib/env'
if (isConfigured('portone')) { /* payment enabled */ }
if (isConfigured('solapi')) { /* notifications enabled */ }
if (isConfigured('sentry')) { /* error tracking enabled */ }

// Type-safe access via env object:
import { env } from '@/lib/env'
env.supabase.url        // client-safe
env.server.portone.apiKey  // throws on client
```

**Required (client):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Required (client, payment):** `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
**Required (client, transfer):** `NEXT_PUBLIC_TRANSFER_BANK_NAME`, `NEXT_PUBLIC_TRANSFER_ACCOUNT_NUMBER`, `NEXT_PUBLIC_TRANSFER_ACCOUNT_HOLDER`
**Required (server):** `SUPABASE_SERVICE_ROLE_KEY`, `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`, `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `CRON_SECRET`
**Optional:** `NEXT_PUBLIC_APP_URL` (default: localhost:3000), `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*`, `LOG_LEVEL`

---

## Key Modules

### Core (`@/lib/`)

| Module | Purpose | When to use |
|--------|---------|-------------|
| `api` | Response helpers, validation | Every API route |
| `errors` | AppError class, error codes | Throwing typed errors |
| `logger` | Structured logging | All logging (not console.log) |
| `env` | Environment validation | Startup checks |
| `utils` | `cn()` class merge, meeting status calc, member level calc | UI class composition, user segmentation |
| `constants/microcopy` | Centralized UI text (Korean) | All user-facing strings |
| `supabase/*` | DB clients | All DB operations |

### Business Modules (`@/lib/`)

| Module | Purpose | When to use |
|--------|---------|-------------|
| `payment` | PortOne integration, refund calc, qualification check | Payment flows |
| `transfer` | Bank transfer flow, deadline management, account validation | Transfer payment method |
| `notification/` | Solapi adapter, template management, dedup, bulk send | All notification sending |
| `reminder` | Meeting reminders (3d, 1d, today) with KST handling | Cron jobs |
| `segment-notification` | Priority-based segment alerts (eligibility, dormant, onboarding) | Monthly/segment crons |
| `waitlist-notification` | Dynamic deadline waitlist notifications (24h/6h/2h) | Waitlist cron |
| `onboarding/reminder` | Signup/first-meeting 3/7 day reminders, 14-day rule | Onboarding crons |
| `auto-complete` | 10-day post-meeting auto-participation completion | Auto-complete cron |
| `post-meeting` | 3-day post-meeting feedback notification | Post-meeting cron |
| `praise` | Praise phrases, validators, helpers | Praise feature |
| `ticket` | Ticket formatting, calendar URL, ICS/image export | Ticket feature |
| `otp` | SMS OTP generation, Supabase storage, 5-attempt/5-min verification | Auth flows |
| `sound` | SoundManager singleton (beans, printer, typewriter, tear, stamp, whoosh) | Micro-interactions |
| `animations` | Centralized Framer Motion variants (~25 exports) | All animations |

### Architectural Split Patterns

- **permissions vs permissions-constants**: `permissions` is server-only (uses Supabase), `permissions-constants` is shared (client + server)
- **notification/**: Adapter pattern (`SolapiAdapter` in production, `MockNotificationAdapter` in dev). Use `sendAndLogNotification()` and `isAlreadySent()` from `notification/index`
- **badges vs badges-client**: Server-side awarding logic vs client-side rendering (to avoid importing server code in `'use client'` components)

---

## Code Rules

### PROHIBITED (Strict)

| Pattern | Use Instead | Why |
|---------|-------------|-----|
| `as any` | Proper type or `unknown` | Type safety |
| `console.log/error/warn` | Logger from `@/lib/logger` | Production logging |
| `z-40`, `z-50` (raw z-index) | Tokens: `z-modal`, `z-toast` | Cross-file consistency |
| `bg-white` | `bg-bg-surface` | Theme-aware |
| Inline styles `style={{}}` | Tailwind classes | Consistency |
| Emojis (any) | Lucide React icons | Cross-platform rendering |
| Hardcoded business values | DB config or constants | Maintainability |
| Hardcoded UI text | `MICROCOPY` from `@/lib/constants/microcopy` | Tone consistency |

### quality-gate.sh Exemptions

When a pattern is intentionally used, add a comment on the SAME LINE:

```typescript
// z-legacy       → Skip z-index check
// bg-white-allowed → Skip bg-white check
// console-allowed  → Skip console check
```

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

- **UI text**: Korean (centralized in `MICROCOPY` constants)
- **Code, comments, types**: English

### Key Patterns

**Class merging with `cn()`:**

```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class', className)} />
```

**Admin pages** follow Server + Client component split:

```
src/app/admin/[section]/
  page.tsx          # Server Component: data fetching, auth check
  [Section]Client.tsx  # Client Component: interactive UI
```

**UI text** - Never hardcode. Import from centralized microcopy:

```typescript
import { MICROCOPY } from '@/lib/constants/microcopy'
<button>{MICROCOPY.buttons.register}</button>  // "함께 읽기"
```

**CSS utility classes** defined in `globals.css`:
- Typography: `text-display`, `text-h1`..`text-h3`, `text-body`, `text-body-sm`, `text-caption`, `text-caption-sm`, `heading-themed`
- Buttons: `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-accent`
- Cards: `card`, `card-base`, `card-hoverable`
- Badges: `badge-primary`, `badge-accent`, `badge-success`, `badge-warning`, `badge-danger`, `badge-muted`
- Inputs: `input`
- Layout: `nav-item`, `section-label`, `safe-area-inset-bottom`

**Portal for modals inside `backdrop-filter`/`transform` parents:**

```tsx
import { Portal } from '@/components/ui/Portal'
<Portal><MyModal /></Portal>  // Renders at document.body to escape stacking context
```

---

## Database Patterns

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

### z-index Tokens

**NEVER use raw z-index values (z-40, z-50). ALWAYS use tokens:**

| Token | Value | Use for |
|-------|:-----:|---------|
| `z-base` | 0 | Default stacking |
| `z-card` | 10 | Cards, list items |
| `z-sticky` | 100 | Sticky headers |
| `z-fab` | 200 | Floating action buttons |
| `z-dropdown` | 300 | Dropdowns, selects |
| `z-modal-overlay` | 1000 | Modal backdrop |
| `z-modal` | 1001 | Modal content |
| `z-toast` | 2000 | Toast notifications |
| `z-noise` | 9999 | Noise texture (warm theme) |

### Semantic Color Tokens

Tailwind config defines semantic colors with foreground/background variants:

```
success / success-fg / success-bg
warning / warning-fg / warning-bg
error / error-fg / error-bg    (also aliased as 'danger')
info / info-fg / info-bg
```

### Shadow & Animation Tokens

See `tailwind.config.ts` for full definitions. Key tokens: `shadow-card`, `shadow-sheet`, `shadow-fab`, `shadow-button`, `shadow-modal`, `animate-fade-in`, `animate-fade-in-up`, `animate-slide-up`, `animate-slide-down`.

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

### Member Levels (PRD-driven)

| Level | Segment | Condition |
|:-----:|---------|-----------|
| Lv.1 | new | is_new_member=true OR 0 participations |
| Lv.2 | onboarding | 1 participation |
| Lv.3 | growing | 2-4 participations |
| Lv.4 | loyal | 5+ participations |

```typescript
import { getMemberLevel } from '@/lib/utils'
const level = getMemberLevel(totalParticipations, isNewMember)
// Returns: { level, label, displayText, segment }
```

### Eligibility

- 6-month participation window for regular meetings
- Check via `@/lib/eligibility`

---

## Rate Limiting

```typescript
import { checkRateLimit, rateLimiters, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Choose appropriate limiter:
  // - rateLimiters.auth: login, OTP (10/min)
  // - rateLimiters.payment: payment operations (5/min)
  // - rateLimiters.standard: general APIs (60/min)
  // - rateLimiters.search: search/query APIs (120/min)

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
| `/.cursorrules` | Cursor IDE rules (v3.0) - Git workflow, @agent- commands |

---

## Cron Jobs

Routes in `src/app/api/cron/`. All require `CRON_SECRET` auth via `verifyCronRequest()` from `@/lib/cron-auth`. Schedules in `vercel.json` (UTC; KST = UTC + 9):

| Cron Route | UTC Schedule | KST | Purpose |
|------------|:------------|:----|---------|
| `reminder` | 0 22 * * * | 07:00 daily | Meeting reminders (3d, 1d, today) |
| `waitlist` | 0 * * * * | Hourly | Expired waitlist processing |
| `transfer-timeout` | 0 * * * * | Hourly | Transfer deadline expiry |
| `afterglow` | 0,30 * * * * | Every 30m | Post-meeting afterglow effects |
| `post-meeting` | 0 1 * * * | 10:00 daily | 3-day post-meeting feedback |
| `welcome` | 0 1 * * * | 10:00 daily | Welcome notifications |
| `first-meeting-followup` | 0 1 * * * | 10:00 daily | First meeting follow-up |
| `onboarding-signup` | 0 1 * * * | 10:00 daily | Signup 3/7-day reminders |
| `onboarding-first-meeting` | 0 1 * * * | 10:00 daily | First meeting 3/7-day reminders |
| `praise-nudge` | 0 1 * * * | 10:00 daily | Praise nudge notifications |
| `segment-reminder` | 0 2 * * * | 11:00 daily | Segment-based priority alerts |
| `auto-complete` | 0 3 * * * | 12:00 daily | 10-day auto-participation |
| `monthly` | 0 1 25 * * | 25th 10:00 | Monthly summary |
| `eligibility-warning` | 0 1 * * 1 | Mon 10:00 | Weekly eligibility warnings |

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
│   ├── /src/components
│   │   ├── layout/        # Header, Footer, Sidebar
│   │   ├── ui/            # Reusable primitives (Button, Input, Toast, Badge, Price, Portal, BrandLogo)
│   │   ├── icons/         # Custom icons (KongIcon, BookIcon, LeafIcon)
│   │   ├── effects/       # Animation effects (Confetti, KongPour, StubFlyaway)
│   │   ├── providers/     # AuthProvider, OnboardingRedirectProvider
│   │   ├── ticket/        # Ticket components
│   │   ├── onboarding/    # Onboarding flow components
│   │   ├── cancel/        # Cancellation/refund components
│   │   └── [root]         # Feature-specific (MeetingCard, PaymentButton, etc.)
│   ├── /src/lib           # Utilities & services
│   ├── /src/hooks         # Custom React hooks
│   ├── /src/types         # TypeScript definitions
│   ├── /src/providers     # Context providers (ThemeProvider)
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

Last updated: 2026-02-18 | v3.7
