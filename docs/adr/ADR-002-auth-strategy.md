# ADR-002: 인증 전략

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- 지독해 웹서비스는 이메일/비밀번호 + 카카오 로그인 지원
- 대부분의 회원이 카카오톡 사용 (알림톡 수신 전제)
- MVP에서 복잡한 OAuth 조합 없이 빠른 구현 필요

## 고려한 대안

### 대안 1: 커스텀 인증 구현
- 장점: 완전한 제어권
- 단점: 개발 시간 증가, 보안 취약점 위험

### 대안 2: Supabase Auth 단독 사용 (선택)
- 장점: 내장 이메일/비밀번호, OAuth 지원, RLS 연동
- 단점: Supabase 종속성

### 대안 3: NextAuth + Supabase
- 장점: 다양한 OAuth 제공자 쉽게 추가
- 단점: 추가 복잡성, RLS와 별도 연동 필요

## 결정

**Supabase Auth 단독 사용**

### 인증 방식
1. **이메일/비밀번호** (MVP Phase 0)
   - 회원가입 시 이메일 인증
   - 비밀번호 재설정 이메일 발송

2. **카카오 로그인** (MVP Phase 1)
   - Supabase OAuth 연동
   - 카카오 계정 이메일로 사용자 생성

### 세션 관리
- Supabase SSR 쿠키 기반 세션
- Next.js Middleware에서 세션 갱신
- 만료 시간: 기본값 (7일)

### 권한 레벨
```typescript
type UserRole = 'member' | 'admin' | 'super_admin'
```

| 역할 | 설명 |
|------|------|
| member | 일반 회원 (기본값) |
| admin | 운영자 (선택적 권한 부여) |
| super_admin | 메인 운영자 (모든 권한) |

### 보안 규칙
- Row Level Security (RLS) 적용
- `auth.uid()` 기반 데이터 접근 제어
- API 라우트에서 세션 검증 필수

## 결과

### 긍정적 영향
- Supabase 생태계 내 통합으로 복잡도 감소
- RLS와 자연스러운 연동
- AI 에이전트가 다루기 쉬운 패턴

### 주의사항
- 카카오 개발자 앱 설정 필요
- Supabase 대시보드에서 카카오 OAuth 활성화 필요
- 알림톡 발송을 위한 전화번호는 별도 입력 유도

---

## 관련 파일
- `/src/lib/supabase/server.ts`
- `/src/lib/supabase/client.ts`
- `/src/lib/supabase/middleware.ts`
- `/src/middleware.ts`

