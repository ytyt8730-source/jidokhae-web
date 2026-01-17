# 외부 서비스 연동 순서

## 연동 순서 개요

```
1. Supabase (DB + 인증) ──► 기반 인프라
      ↓
2. 카카오 로그인 ──────────► 소셜 로그인
      ↓
3. 포트원 (결제) ──────────► 핵심 결제 기능
      ↓
4. 솔라피 (알림톡) ─────────► 알림 시스템
```

---

## 1단계: Supabase 설정

### 필수 작업
1. Supabase 프로젝트 생성 (https://supabase.com)
2. 리전 선택: **Singapore** (ap-southeast-1)
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 데이터베이스 초기화
```sql
-- Supabase SQL Editor에서 실행
-- /supabase/schema.sql 내용 붙여넣기
```

### 검증
- [ ] 회원가입 테스트 (이메일/비밀번호)
- [ ] 로그인 테스트
- [ ] 데이터 조회 테스트 (모임 목록)

---

## 2단계: 카카오 로그인 설정

### 카카오 개발자 설정
1. https://developers.kakao.com 접속
2. 앱 생성 또는 기존 앱 선택
3. 플랫폼 → Web → 사이트 도메인 추가
   - `http://localhost:3000` (개발)
   - `https://your-domain.com` (프로덕션)

### Supabase 연동
1. Supabase 대시보드 → Authentication → Providers
2. Kakao 활성화
3. 카카오 앱 키 입력:
   - **Client ID**: 카카오 앱 → 앱 키 → REST API 키
   - **Client Secret**: 카카오 앱 → 보안 → Client Secret (활성화 후)
4. Redirect URL 복사 → 카카오 개발자 콘솔에 등록

### 검증
- [ ] 카카오 로그인 버튼 동작
- [ ] 로그인 후 사용자 정보 조회

---

## 3단계: 포트원 결제 연동

### 포트원 설정
1. https://admin.portone.io 접속
2. 가맹점 생성 (테스트 모드)
3. PG사 연동 (카카오페이 또는 토스페이먼츠)
4. 웹훅 URL 설정: `https://your-domain.com/api/v1/payments/webhook`

### 환경 변수
```bash
PORTONE_STORE_ID=store-xxx
PORTONE_CHANNEL_KEY=channel-xxx
PORTONE_API_SECRET=xxx
PORTONE_WEBHOOK_SECRET=xxx
```

### 개발 순서
1. 결제 준비 API (`/api/v1/payments/prepare`)
2. 클라이언트 결제 모듈 연동
3. 결제 완료 웹훅 처리 (`/api/v1/payments/webhook`)
4. 환불 API 구현

### 검증
- [ ] 테스트 결제 성공
- [ ] 웹훅 수신 확인
- [ ] 부분 환불 테스트

---

## 4단계: 솔라피 알림톡 연동

### 카카오 비즈니스 설정
1. https://business.kakao.com 접속
2. 카카오톡 채널 생성 (또는 기존 채널 사용)
3. 채널 인증 완료

### 솔라피 설정
1. https://console.solapi.com 접속
2. 회원가입 및 충전
3. 카카오 채널 연동
4. 알림톡 템플릿 등록 및 승인

### 환경 변수
```bash
SOLAPI_API_KEY=xxx
SOLAPI_API_SECRET=xxx
SOLAPI_SENDER=01012345678
SOLAPI_KAKAO_PFID=@지독해
```

### 템플릿 등록 목록
| 템플릿 코드 | 용도 |
|------------|------|
| `MEETING_REMIND_3D` | 모임 3일 전 리마인드 |
| `MEETING_REMIND_1D` | 모임 1일 전 리마인드 |
| `MEETING_REMIND_TODAY` | 모임 당일 리마인드 |
| `WAITLIST_AVAILABLE` | 대기자 자리 발생 알림 |
| `MONTH_END_REMIND` | 월말 참여 독려 |
| `POST_MEETING` | 모임 후 "어떠셨어요?" |
| `WELCOME_FIRST` | 첫 모임 전날 환영 |

### 검증
- [ ] 테스트 알림톡 발송
- [ ] 템플릿 변수 치환 확인

---

## 연동 시 주의사항

### 1. 테스트 모드 먼저
- 포트원: 테스트 채널로 먼저 연동
- 솔라피: 소량 테스트 후 실제 발송

### 2. 웹훅 보안
- 포트원 웹훅: 시그니처 검증 필수
- 외부에서 호출 가능하므로 IP 화이트리스트 고려

### 3. 환경 분리
- 개발/프로덕션 키 분리
- Vercel Preview에서는 개발 키 사용

### 4. 롤백 계획
- 결제 연동 실패 시: 계좌이체 안내 백업
- 알림톡 실패 시: SMS 폴백

---

## 연동 완료 체크리스트

### MVP 필수
- [ ] Supabase 기본 설정
- [ ] 이메일 인증 로그인
- [ ] 카카오 로그인
- [ ] 포트원 결제
- [ ] 포트원 환불
- [ ] 솔라피 알림톡 (모임 리마인드)

### 추후 확장
- [ ] Sentry 에러 모니터링
- [ ] Vercel Analytics
- [ ] PostHog 사용자 분석

