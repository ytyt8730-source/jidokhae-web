---
name: testing
description: 지독해 테스트 작성 규칙 및 패턴
disable-model-invocation: true
---

# 지독해 Testing Guide

> 이 스킬은 테스트 작성 규칙과 패턴을 제공합니다.

## 테스트 스택

| 도구 | 용도 |
|------|------|
| Vitest | 테스트 러너 |
| @testing-library/react | 컴포넌트 테스트 |
| @testing-library/jest-dom | DOM 매처 |
| jsdom | 브라우저 환경 시뮬레이션 |

## 명령어

```bash
npm run test           # watch 모드
npm run test:run       # 1회 실행
npm run test:coverage  # 커버리지 포함
npm run test:ui        # UI 모드
```

## 파일 구조

```
src/
├── __tests__/
│   ├── setup.ts              # 전역 설정
│   ├── lib/
│   │   ├── utils.test.ts     # 유틸리티 테스트
│   │   ├── api.test.ts       # API 테스트
│   │   └── errors.test.ts    # 에러 시스템 테스트
│   └── components/
│       └── ui/
│           ├── Badge.test.tsx
│           └── Button.test.tsx
```

## 테스트 작성 패턴

### 유틸리티 함수

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('정상 입력을 처리한다', () => {
    expect(myFunction('input')).toBe('expected')
  })

  it('엣지 케이스를 처리한다', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toBeNull()
  })

  it('에러를 적절히 던진다', () => {
    expect(() => myFunction('invalid')).toThrow()
  })
})
```

### 컴포넌트

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('텍스트를 렌더링한다', () => {
    render(<MyComponent text="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('클릭 이벤트를 처리한다', () => {
    const onClick = vi.fn()
    render(<MyComponent onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('조건부 렌더링을 한다', () => {
    render(<MyComponent showExtra={false} />)
    expect(screen.queryByTestId('extra')).not.toBeInTheDocument()
  })
})
```

### API 핸들러

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from '@/app/api/resource/route'

describe('GET /api/resource', () => {
  it('성공 응답을 반환한다', async () => {
    const response = await GET(new Request('http://localhost/api/resource'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })
})

describe('POST /api/resource', () => {
  it('생성 후 201을 반환한다', async () => {
    const response = await POST(new Request('http://localhost/api/resource', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    }))

    expect(response.status).toBe(201)
  })
})
```

## 모킹 패턴

### Supabase 모킹

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: 'Test' },
        error: null,
      }),
    })),
  }),
}))
```

### Next.js 라우터 모킹

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/current-path',
}))
```

## 커버리지 목표

| 메트릭 | 최소 | 권장 |
|--------|------|------|
| Lines | 60% | 80% |
| Functions | 60% | 80% |
| Branches | 60% | 80% |
| Statements | 60% | 80% |

## 테스트 우선순위

1. **필수**: 비즈니스 로직 (utils, calculations)
2. **필수**: 에러 처리 (errors, api helpers)
3. **권장**: UI 컴포넌트 (interactive components)
4. **선택**: 정적 컴포넌트 (presentation only)

## 테스트 명명 규칙

```typescript
// ✅ 좋은 예: 한국어로 명확하게
it('빈 배열에 대해 빈 문자열을 반환한다', ...)
it('3일 전 취소시 50% 환불한다', ...)
it('정원 초과시 에러를 던진다', ...)

// ❌ 나쁜 예: 모호하거나 영어
it('works correctly', ...)
it('should handle edge case', ...)
it('test case 1', ...)
```

## 절대 금지

- ❌ `test.skip` 남겨두기
- ❌ 하드코딩된 타임아웃
- ❌ 테스트 간 상태 공유
- ❌ 실제 API/DB 호출
- ❌ 스냅샷 테스트 남용
