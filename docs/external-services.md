# 외부 서비스 설정 가이드

> **버전**: 1.0  
> **마지막 업데이트**: 2026-01-17

이 문서는 지독해 웹서비스에서 사용하는 외부 서비스 설정 방법을 통합 관리합니다.

---

## 📊 서비스 현황

| 서비스 | 용도 | 상태 | 마일스톤 |
|--------|------|:----:|:--------:|
| Supabase | DB, Auth, Realtime | ✅ | M1 |
| 카카오 OAuth | 소셜 로그인 | ✅ | M2 |
| 포트원 V2 | 결제 | ✅ | M2 |
| 솔라피 | 알림톡 | 🔄 코드완료 | M3 |

> 🔄 **코드완료**: 코드 구현은 완료되었으나 외부 서비스 계정 설정이 필요한 상태

---

## 1. Supabase

### 1.1 프로젝트 정보

| 항목 | 값 |
|------|-----|
| Project ID | `njaavwosjwndtwnjovac` |
| Region | Northeast Asia (Seoul) |

### 1.2 필요한 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://njaavwosjwndtwnjovac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 1.3 확인 방법

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **Settings** → **API**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. 카카오 OAuth

### 2.1 설정 위치

- **카카오 개발자**: https://developers.kakao.com
- **Supabase**: Authentication → Providers → Kakao

### 2.2 Redirect URI 등록

**카카오 개발자 사이트**:
```
내 애플리케이션 → 카카오 로그인 → Redirect URI
```

등록해야 할 URI:
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3003/auth/callback
https://njaavwosjwndtwnjovac.supabase.co/auth/v1/callback
```

> 💡 **Why 여러 포트?**: Next.js는 포트 충돌 시 자동으로 3001, 3003 등으로 변경됩니다.

**Supabase Dashboard**:
```
Authentication → URL Configuration → Redirect URLs
```

등록해야 할 패턴:
```
http://localhost:3000/**
http://localhost:3001/**
http://localhost:3003/**
```

### 2.3 Supabase Provider 설정

1. Supabase Dashboard → Authentication → Providers → Kakao
2. 카카오 개발자에서 발급받은 값 입력:
   - **Client ID**: REST API 키
   - **Client Secret**: 보안 탭에서 생성

---

## 3. 포트원 V2 결제

### 3.1 V1 vs V2 차이점

| 항목 | V1 (구버전) | V2 (현재 사용) |
|------|-------------|----------------|
| Store ID 형식 | `TC0ONETIM` | `store-xxxxx-xxxx-xxxx` |
| SDK URL | `cdn.iamport.kr` | `cdn.portone.io/v2/browser-sdk.js` |
| 테스트 코드 | `TC0ONETIM` | 별도 없음 (테스트 모드 토글) |

> ⚠️ **주의**: V1 테스트 코드(`TC0ONETIM`)를 V2에서 사용하면 "Store ID is not recognized" 오류 발생!

### 3.2 필요한 환경 변수

```bash
# 클라이언트 (결제 요청)
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 서버 전용 (환불/취소)
PORTONE_API_SECRET=PortOneSecret-xxxxx
PORTONE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3.3 확인 방법

1. https://admin.portone.io 접속
2. **결제연동** → **연동 정보** 클릭
3. **V2 API** 탭에서 확인:
   - Store ID: `store-`로 시작하는 값
   - API Secret: 복사 버튼 클릭
4. **채널 관리**에서 Channel Key 확인

### 3.4 테스트 모드

- 포트원 관리자 우측 상단 **테스트/실거래** 토글
- 테스트 모드에서는 실제 결제 없이 흐름 확인 가능

---

## 4. 솔라피 (M3)

### 4.1 현재 상태

**계정 설정** (2026-01-17):
- ✅ 솔라피 계정 생성
- ✅ API Key / Secret 발급
- ✅ 충전 (1만원)
- ✅ 발신번호 등록 (180일 후 재인증)
- ⏳ 카카오 비즈니스 채널 승인 대기 중
- ⬜ 알림톡 템플릿 등록 (채널 승인 후)

### 4.2 남은 작업 (승인 후)

- [ ] 카카오 비즈니스 채널 승인 확인
- [ ] 솔라피에서 채널 연동
- [ ] 알림톡 템플릿 등록 (카카오 승인 1~3일 소요)

### 4.3 필요한 환경 변수

```bash
SOLAPI_API_KEY=xxxxx
SOLAPI_API_SECRET=xxxxx
SOLAPI_SENDER=01012345678
SOLAPI_KAKAO_PFID=@지독해
```

### 4.4 확인 방법

1. https://console.solapi.com 접속
2. **설정** → **API 키 관리**

### 4.5 Vercel Cron 스케줄 (vercel.json)

| API | 스케줄 (UTC) | 한국시간 | 용도 |
|-----|-------------|---------|------|
| `/api/cron/reminder` | `0 22 * * *` | 매일 07:00 | 모임 리마인드 (3일/1일/당일) |
| `/api/cron/waitlist` | `0 * * * *` | 매시간 | 대기자 응답 기한 체크 |
| `/api/cron/monthly` | `0 1 25 * *` | 매월 25일 10:00 | 월말 참여 독려 |
| `/api/cron/segment-reminder` | `0 2 * * *` | 매일 11:00 | 세그먼트별 알림 |

### 4.6 알림 템플릿 코드

솔라피에 등록할 템플릿 코드 목록:

| 코드 | 용도 |
|------|------|
| `reminder_3d` | 3일 전 리마인드 |
| `reminder_1d` | 1일 전 리마인드 |
| `reminder_today` | 당일 리마인드 |
| `waitlist_spot` | 대기자 자리 발생 |
| `waitlist_expired` | 대기 기한 만료 |
| `monthly_encourage` | 월말 참여 독려 |
| `eligibility_warning` | 자격 만료 임박 |
| `dormant_risk` | 휴면 위험 |
| `onboarding_risk` | 온보딩 이탈 |
| `admin_notice` | 운영자 공지 |

---

## 🔧 트러블슈팅

### 카카오 로그인 callback 실패

**증상**: 로그인 후 홈으로 돌아왔으나 로그인 상태 미반영

**원인**: 현재 실행 포트의 Redirect URI 미등록

**해결**:
1. 터미널에서 현재 포트 확인 (`localhost:3001` 등)
2. 카카오/Supabase에 해당 포트 URI 추가
3. 브라우저 쿠키 삭제 후 재시도

### 포트원 "Store ID is not recognized"

**원인**: V1 테스트 코드를 V2에서 사용

**해결**: 포트원 관리자 → V2 API 탭에서 올바른 Store ID 확인

### Supabase RLS 무한 재귀

**증상**: `infinite recursion detected in policy for relation "users"`

**원인**: RLS policy 내에서 같은 테이블 조회

**해결**: 단순 조건으로 변경 (`auth.uid() = id`)

---

## 📚 관련 문서

- [환경 변수 상세 설명](/docs/env-variables.md)
- [환경 변수 템플릿](/jidokhae/ENV_TEMPLATE.md)
- [트러블슈팅 패턴](/docs/troubleshooting-patterns.md)
