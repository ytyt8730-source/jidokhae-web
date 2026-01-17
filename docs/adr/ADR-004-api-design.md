# ADR-004: API 설계 원칙

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- Next.js API Routes 사용
- 포트원 웹훅, 알림톡 API 등 외부 연동
- 일관된 에러 처리 및 응답 형식 필요

## 고려한 대안

### 대안 1: REST 스타일
- 장점: 표준적, 이해 쉬움
- 단점: 복잡한 작업 표현 어려움

### 대안 2: RPC 스타일 (Supabase Functions)
- 장점: 복잡한 비즈니스 로직 표현
- 단점: 표준 HTTP 메서드와 다름

### 대안 3: 하이브리드 (선택)
- 장점: 상황에 맞는 선택
- 단점: 일관성 유지 노력 필요

## 결정

**REST 기본 + 복잡한 작업은 RPC 스타일**

### URL 구조

```
/api/v1/
├── auth/
│   ├── login         POST    로그인
│   ├── signup        POST    회원가입
│   └── logout        POST    로그아웃
├── meetings/
│   ├── [id]          GET     모임 상세
│   └── [id]/apply    POST    모임 신청 (RPC 스타일)
├── registrations/
│   ├── [id]          GET     신청 상세
│   └── [id]/cancel   POST    취소 (RPC 스타일)
├── payments/
│   └── webhook       POST    포트원 웹훅
└── admin/
    └── ...
```

### 표준 응답 형식

```typescript
// 성공 응답
interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
    }
    timestamp: string
  }
}

// 에러 응답
interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode      // 숫자 코드
    message: string      // 사용자 표시용 메시지
    details?: unknown    // 개발 디버깅용
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

### 에러 코드 체계

```typescript
enum ErrorCode {
  // 인증 (1xxx)
  AUTH_INVALID_TOKEN = 1001,
  AUTH_SESSION_EXPIRED = 1002,
  AUTH_UNAUTHORIZED = 1003,
  
  // 결제 (2xxx)
  PAYMENT_FAILED = 2001,
  PAYMENT_WEBHOOK_INVALID = 2002,
  REFUND_NOT_ELIGIBLE = 2003,
  
  // 외부 서비스 (3xxx)
  EXTERNAL_API_TIMEOUT = 3001,
  NOTIFICATION_SEND_FAILED = 3002,
  
  // 비즈니스 로직 (4xxx)
  CAPACITY_EXCEEDED = 4001,
  DUPLICATE_REGISTRATION = 4002,
  INVALID_MEETING_STATUS = 4003,
  
  // 시스템 (5xxx)
  INTERNAL_ERROR = 5001,
  DATABASE_ERROR = 5002,
}
```

### HTTP 상태 코드 매핑

| 상황 | HTTP 코드 | 설명 |
|------|----------|------|
| 성공 | 200 | 정상 응답 |
| 생성 성공 | 201 | 리소스 생성됨 |
| 입력 오류 | 400 | 클라이언트 요청 오류 |
| 인증 필요 | 401 | 로그인 필요 |
| 권한 없음 | 403 | 접근 권한 없음 |
| 리소스 없음 | 404 | 존재하지 않음 |
| 서버 오류 | 500 | 내부 서버 오류 |

## 결과

### 긍정적 영향
- 클라이언트에서 일관된 에러 처리
- 디버깅 용이
- 앱 확장 시 API 그대로 사용 가능

### 주의사항
- 모든 API 응답에 표준 형식 적용
- 에러 메시지는 사용자 친화적으로

---

## 관련 파일
- `/src/lib/api.ts` (응답 헬퍼)
- `/src/lib/errors.ts` (에러 코드 정의)
- `/src/app/api/` (API 라우트)

