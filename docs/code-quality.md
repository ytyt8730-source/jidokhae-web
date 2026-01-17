# 코드 품질 원칙

## SOLID / DRY / KISS / YAGNI 적용 가이드

### 적용 기준

| 원칙 | 적용 기준 | 예시 |
|------|----------|------|
| **DRY** | 동일 함수 2회 이상 중복 시 통합 | 환불 계산 로직 `calculateRefund()` 통합 |
| **SRP** | API Route 200줄 초과 시 서비스 분리 | `lib/services/payment.ts` 분리 |
| **YAGNI** | 현재 필요한 기능만 구현 | 관리자 URL 입력 UI 미구현 (M2에서) |
| **KISS** | 가장 단순한 구현 선택 | 복잡한 상태관리 대신 Server Components |

---

## 타입 안전성 규칙

### 1. `as any` 사용 금지
```typescript
// ❌ 나쁜 예
const data = response as any

// ✅ 좋은 예
interface ApiResponse {
  data: User[]
  error: string | null
}
const data: ApiResponse = response
```

### 2. Supabase 타입 자동 생성
```bash
# Supabase CLI로 타입 생성
npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts
```

### 3. 빌드 시 타입 체크
```bash
# 에러 0개 유지 필수
npx tsc --noEmit
```

---

## 파일 크기 가이드라인

| 파일 유형 | 권장 최대 줄 수 | 초과 시 조치 |
|----------|---------------|-------------|
| 페이지 컴포넌트 | 200줄 | 컴포넌트 분리 |
| API Route | 200줄 | 서비스 레이어 분리 |
| 유틸리티 함수 | 100줄 | 함수 분리 |
| 서비스 클래스 | 300줄 | 도메인별 분리 |

---

## 네이밍 컨벤션

### 파일명

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `MeetingCard.tsx` |
| 유틸/서비스 | camelCase | `payment.ts`, `refund.ts` |
| 타입 파일 | camelCase | `database.ts`, `api.ts` |
| 라우트 폴더 | kebab-case | `my-page/`, `auth/` |

### 변수/함수명

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 | camelCase | `currentUser`, `meetingList` |
| 상수 | SCREAMING_SNAKE | `MAX_CAPACITY`, `API_TIMEOUT` |
| 함수 | camelCase (동사로 시작) | `fetchMeetings()`, `calculateRefund()` |
| 타입/인터페이스 | PascalCase | `Meeting`, `UserProfile` |
| Boolean | is/has/can 접두사 | `isLoading`, `hasPermission` |

---

## 코드 구조 패턴

### 1. API Route 구조
```typescript
// src/app/api/v1/meetings/route.ts
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { meetingLogger } from '@/lib/logger'

export async function GET() {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const logger = meetingLogger

    logger.info('모임 목록 조회')
    
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('datetime', { ascending: true })

    if (error) throw error

    return successResponse(data)
  })
}
```

### 2. 서비스 레이어 분리
```typescript
// src/lib/services/payment.ts
export class PaymentService {
  async processPayment(params: PaymentParams): Promise<PaymentResult> {
    // 결제 처리 로직
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    // 환불 처리 로직
  }
}

// API Route에서 사용
const paymentService = new PaymentService()
await paymentService.processPayment(params)
```

### 3. 컴포넌트 분리 기준
```
// 분리해야 할 때:
- 100줄 이상
- 독립적인 상태 관리
- 재사용 가능한 UI
- 다른 곳에서도 사용

// 분리하지 않아도 될 때:
- 한 곳에서만 사용
- 50줄 미만
- 부모와 강하게 결합
```

---

## 금지 패턴

### 1. 인라인 스타일 (Tailwind 대신)
```tsx
// ❌ 나쁜 예
<div style={{ marginTop: 16, padding: 8 }}>

// ✅ 좋은 예
<div className="mt-4 p-2">
```

### 2. any 타입
```typescript
// ❌ 나쁜 예
function process(data: any) { ... }

// ✅ 좋은 예
function process(data: Meeting) { ... }
```

### 3. 콘솔 로그 (프로덕션)
```typescript
// ❌ 나쁜 예
console.log('debug:', data)

// ✅ 좋은 예 (logger 사용)
import { meetingLogger } from '@/lib/logger'
meetingLogger.debug('debug', { data })
```

### 4. 하드코딩된 값
```typescript
// ❌ 나쁜 예
if (participants >= 14) { ... }

// ✅ 좋은 예
const MAX_CAPACITY = 14
if (participants >= MAX_CAPACITY) { ... }
```

---

## 체크리스트 (PR 전)

- [ ] `as any` 사용 없음
- [ ] 200줄 초과 파일 없음
- [ ] 하드코딩된 값 없음 (상수로 분리)
- [ ] console.log 제거 (logger 사용)
- [ ] 타입 에러 0개 (`npx tsc --noEmit`)
- [ ] 빌드 성공 (`npm run build`)

