---
name: api-patterns
description: 지독해 API 설계 패턴 및 에러 처리 규칙
disable-model-invocation: true
---

# 지독해 API Patterns

> 이 스킬은 API 설계 패턴과 에러 처리 규칙을 제공합니다.

## API 응답 구조

### 성공 응답
```typescript
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    total?: number,
    // ...
  }
}
```

### 에러 응답
```typescript
{
  success: false,
  error: {
    code: number,      // ErrorCode enum
    message: string,   // 사용자 친화적 메시지
    details?: unknown  // 디버그 정보
  }
}
```

## API 라우트 템플릿

```typescript
// app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api'
import { requireAuth, validateRequired } from '@/lib/api'
import { ErrorCode, AppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-[resource]')

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      logger.error('조회 실패', { error })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    return successResponse(data)
  })
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const supabase = await createClient()
    const user = await requireAuth(supabase)
    const body = await request.json()

    validateRequired(body, ['field1', 'field2'])

    const { data, error } = await supabase
      .from('table')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()

    if (error) {
      logger.error('생성 실패', { error, body })
      throw new AppError(ErrorCode.DATABASE_ERROR)
    }

    logger.info('생성 성공', { id: data.id })
    return successResponse(data, 201)
  })
}
```

## 에러 코드 체계

| 범위 | 카테고리 | 예시 |
|------|----------|------|
| 1xxx | 인증 | 1001 (토큰 무효), 1003 (권한 없음) |
| 2xxx | 결제 | 2001 (결제 실패), 2006 (환불 불가) |
| 3xxx | 외부 서비스 | 3001 (타임아웃), 3003 (알림 실패) |
| 4xxx | 비즈니스 로직 | 4001 (모임 없음), 4004 (정원 초과) |
| 5xxx | 시스템 | 5001 (내부 오류), 5002 (DB 오류) |

## 헬퍼 함수

### requireAuth
```typescript
// 인증 필수 API에서 사용
const user = await requireAuth(supabase)
// 미인증시 AUTH_UNAUTHORIZED 에러 throw
```

### requireAdmin
```typescript
// 관리자 전용 API에서 사용
const user = await requireAdmin(supabase)
// 비관리자시 AUTH_FORBIDDEN 에러 throw
```

### validateRequired
```typescript
// 필수 필드 검증
validateRequired(body, ['name', 'email', 'phone'])
// 누락시 VALIDATION_ERROR 에러 throw
```

## Supabase 클라이언트 사용

| 컨텍스트 | Import | 용도 |
|----------|--------|------|
| Server Component | `@/lib/supabase/server` | SSR 데이터 페칭 |
| API Route | `@/lib/supabase/server` | 백엔드 처리 |
| Client Component | `@/lib/supabase/client` | 브라우저 인터랙션 |
| RLS 우회 필요 | `createServiceClient()` | 관리자 작업 |

## 로깅 규칙

```typescript
import { createLogger } from '@/lib/logger'
const logger = createLogger('payment')

// ✅ 올바른 사용
logger.info('결제 시작', { userId, amount })
logger.error('결제 실패', { error, context })

// ❌ 금지
console.log('결제 시작')  // console 사용 금지
```

## 절대 금지

- ❌ `console.log` 사용 (logger 사용)
- ❌ `as any` 타입 단언
- ❌ try-catch 없는 외부 API 호출
- ❌ 에러 메시지에 민감 정보 포함
- ❌ 200 상태코드로 에러 반환
