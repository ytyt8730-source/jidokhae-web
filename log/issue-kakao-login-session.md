# 카카오 로그인 후 세션 미유지 문제 - 진단 및 해결

> **생성일:** 2026-02-16
> **해결일:** 2026-02-18
> **상태:** ✅ 해결 완료

## 문제 요약
카카오 로그인 완료 후 홈화면에 도착했을 때 로그인 상태가 아님

## 증상

- 브라우저 DevTools에서 세션 쿠키는 정상적으로 존재
- 콘솔에 406 Not Acceptable 에러 다수 발생
- React Hydration Error (#425, #422) 발생
- 서버 로그에 PostgREST 406 에러

---

## 근본 원인 (확정)

### **RLS(Row Level Security) 정책으로 인한 users INSERT 실패**

OAuth 콜백에서 `exchangeCodeForSession()` 호출 후, `handleKakaoUser()` 함수가 `public.users` 테이블에 새 사용자를 INSERT하려 함.

**문제점:**
1. `public.users` 테이블의 INSERT 정책: `auth.uid() = id`
2. `exchangeCodeForSession()` 직후 anon key 클라이언트에서는 `auth.uid()`가 아직 설정되지 않음
3. → INSERT가 RLS에 의해 차단됨
4. → `public.users`에 레코드 없음
5. → `useOnboardingRedirect` 등에서 `.single()` 호출 시 0 rows 반환
6. → **406 Not Acceptable** (PostgREST: `.single()` expects exactly 1 row)
7. → React Hydration Error (서버/클라이언트 상태 불일치)

### 오진된 원인들 (참고)

| 의심 원인 | 실제 상태 |
|-----------|-----------|
| 쿠키 Secure 속성 누락 | ❌ 쿠키는 정상 저장됨 |
| 307 리다이렉트 문제 | ❌ 리다이렉트는 정상 동작 |
| PKCE Code Verifier 유실 | ❌ 교환은 성공 |
| Middleware 쿠키 덮어쓰기 | ⚠️ 부분적 문제, 이미 수정됨 |

---

## 해결 방법

### 1. Service Role 클라이언트 사용 (핵심 수정)

**파일:** `jidokhae/src/app/auth/callback/route.ts`

```typescript
import { createServiceClient } from '@/lib/supabase/server'

async function handleKakaoUser(
  user: { id: string; ... },
  origin: string,
  next: string,
): Promise<string> {
  // Service Role 클라이언트 사용 (RLS 우회 - users 테이블 insert/update 필요)
  const serviceClient = await createServiceClient()

  // 이후 모든 DB 작업은 serviceClient 사용
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id, phone, nickname, is_new_member')
    .eq('id', user.id)
    .single()

  // ... INSERT/UPDATE도 serviceClient로
}
```

### 2. 에러 핸들링 추가

**파일:** `jidokhae/src/hooks/useOnboardingRedirect.ts`

```typescript
const { data: userData, error } = await supabase
  .from('users')
  .select('is_new_member, onboarding_step, onboarding_completed_at')
  .eq('id', user.id)
  .single()

// 쿼리 에러 시 (RLS 거부, 네트워크 오류 등) 온보딩 체크 스킵
if (error) {
  setStatus({ isLoading: false, needsOnboarding: false, currentStep: null })
  return
}
```

---

## 수정 파일 목록

| 파일 | 변경 내용 | 상태 |
|------|----------|:----:|
| `jidokhae/src/app/auth/callback/route.ts` | createServiceClient() 사용 | ✅ |
| `jidokhae/src/hooks/useOnboardingRedirect.ts` | 에러 핸들링 추가 | ✅ |

---

## 추가 발견 이슈 및 해결

### IneligibilityModal 모바일 위치 문제

**증상:** 결제 방식 선택 모달 → 간편결제 클릭 → IneligibilityModal이 화면 오른쪽 밖으로 벗어남

**원인:** translate 기반 센터링 (`left-1/2 -translate-x-1/2`) + `mx-4` 마진 조합이 모바일에서 충돌

**해결:**
- flexbox 기반 센터링으로 변경 (`fixed inset-0 flex items-center justify-center p-4`)
- 내부 div에 `relative w-full max-w-md` 적용
- `PaymentMethodSelector`에서 Portal 래핑 추가

| 파일 | 변경 내용 | 상태 |
|------|----------|:----:|
| `jidokhae/src/components/IneligibilityModal.tsx` | flexbox 센터링 | ✅ |
| `jidokhae/src/components/PaymentMethodSelector.tsx` | Portal 래핑 | ✅ |

---

## 커밋 이력

| 커밋 | 내용 |
|------|------|
| `4785095` | fix: OAuth 콜백에서 RLS 우회를 위해 Service Role 클라이언트 사용 |
| `c2b5d6a` | fix: IneligibilityModal 모바일 화면에서 잘림 현상 수정 |
| `e3e6aaa` | docs: CLAUDE.md 아키텍처 문서 보강 |

---

## 교훈

1. **PostgREST 406 에러**는 `.single()` 호출 시 0 또는 2+ rows 반환을 의미
2. **OAuth 콜백**에서 `exchangeCodeForSession()` 직후에는 anon key 클라이언트의 `auth.uid()`가 설정되지 않을 수 있음
3. **RLS INSERT 정책**이 `auth.uid() = id`인 경우, 새 사용자 생성 시 Service Role 필요
4. **쿠키 문제로 오진하기 쉬움** - DB 레코드 존재 여부부터 확인할 것

---

*이 파일은 다음 릴리즈 후 삭제 예정*
