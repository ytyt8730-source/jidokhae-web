# 운영자 직접 작업 목록

개발 과정에서 발생하는 **운영자가 직접 처리해야 하는 작업들**을 관리합니다.

---

## M6-Onboarding 준비 작업

M6-Onboarding 구현 전 운영자가 직접 완료해야 하는 작업입니다.

### 1. 솔라피 알림톡 템플릿 등록

#### 등록해야 할 템플릿 (5개)

| 순서 | 템플릿 코드 | 용도 | 우선순위 | 상태 |
|:----:|-------------|------|:--------:|:----:|
| 1 | `SIGNUP_WELCOME` | 가입 직후 환영 | 높음 | [ ] |
| 2 | `SIGNUP_REMINDER_DAY3` | 가입 후 3일 미신청 | 높음 | [ ] |
| 3 | `SIGNUP_REMINDER_DAY7` | 가입 후 7일 미신청 | 중간 | [ ] |
| 4 | `FIRST_MEETING_DAY3` | 첫 모임 후 3일 | 중간 | [ ] |
| 5 | `FIRST_MEETING_DAY7` | 첫 모임 후 7일 미신청 | 중간 | [ ] |

---

#### 템플릿 1: SIGNUP_WELCOME (가입 직후 환영)

**발송 타이밍:** 회원가입 즉시

**템플릿 문구:**
```
환영합니다, #{이름}님!

낮과 밤의 서재에 오신 것을 환영합니다.

이번 달 가장 인기 있는 모임은 #{인기모임책제목}이에요.
벌써 #{인기모임신청수}명이 신청했답니다.

함께 읽어볼까요?

[모임 둘러보기]
```

**변수 목록:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `#{이름}` | 회원 이름 | 김지독 |
| `#{인기모임책제목}` | 이번 달 인기 모임 책 제목 | 데미안 |
| `#{인기모임신청수}` | 해당 모임 신청 인원 | 5 |

**버튼 설정:**
- 버튼명: 모임 둘러보기
- 버튼 URL: `https://jidokhae.com`

---

#### 템플릿 2: SIGNUP_REMINDER_DAY3 (가입 후 3일)

**발송 타이밍:** 가입 후 3일, 모임 미신청 시 (매일 10:00)

**핵심 메시지:** 구체적 기회 제시 (남은 자리, 요일, 지역)

**템플릿 문구:**
```
#{이름}님, 자리가 얼마 남지 않았어요.

#{요일}, #{지역} 모임에 자리가 #{남은자리}개 남았어요.
이번 주 마지막 기회일지도 몰라요.

#{책제목}을 함께 읽어볼까요?

[바로 확인하기]
```

**변수 목록:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `#{이름}` | 회원 이름 | 김지독 |
| `#{요일}` | 모임 요일 | 토요일 |
| `#{지역}` | 모임 지역 | 경주 |
| `#{남은자리}` | 남은 좌석 수 | 3 |
| `#{책제목}` | 모임 책 제목 | 데미안 |

**버튼 설정:**
- 버튼명: 바로 확인하기
- 버튼 URL: `https://jidokhae.com`

---

#### 템플릿 3: SIGNUP_REMINDER_DAY7 (가입 후 7일)

**발송 타이밍:** 가입 후 7일, 모임 미신청 시 (매일 10:00)

**핵심 메시지:** 콘텐츠 맛보기 (지난 모임 이야기)

**템플릿 문구:**
```
지난주 모임에서 나눈 이야기

#{이름}님,

지난주 모임에서 회원들이 #{지난모임책제목}에 대해
이런 이야기를 나눴어요.

"생각보다 쉽게 읽혔어요"
"새로운 관점을 얻었어요"

다음 모임에서 함께 나눠볼까요?

[다음 모임 확인하기]
```

**변수 목록:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `#{이름}` | 회원 이름 | 김지독 |
| `#{지난모임책제목}` | 지난주 모임 책 제목 | 어린 왕자 |

**버튼 설정:**
- 버튼명: 다음 모임 확인하기
- 버튼 URL: `https://jidokhae.com`

---

#### 템플릿 4: FIRST_MEETING_DAY3 (첫 모임 후 3일)

**발송 타이밍:** 첫 정기모임 참여 완료 후 3일 (매일 10:00)

**핵심 메시지:** 다음 모임 안내 + 사회적 증거

**템플릿 문구:**
```
다음 모임, 함께할까요?

#{이름}님,

다음 모임은 #{다음모임일시}이에요.
벌써 #{신청인원}명이 신청했어요.

지난번에 만났던 분들도 계실 거예요.
같이 가실래요?

[바로 신청하기]
```

**변수 목록:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `#{이름}` | 회원 이름 | 김지독 |
| `#{다음모임일시}` | 다음 모임 일시 | 2월 15일 토요일 오후 2시 |
| `#{신청인원}` | 현재 신청 인원 | 4 |

**버튼 설정:**
- 버튼명: 바로 신청하기
- 버튼 URL: `https://jidokhae.com`

---

#### 템플릿 5: FIRST_MEETING_DAY7 (첫 모임 후 7일)

**발송 타이밍:** 첫 정기모임 참여 완료 후 7일, 두 번째 모임 미신청 시 (매일 10:00)

**핵심 메시지:** 희소성 (마지막 모임)

**템플릿 문구:**
```
이번 달 마지막 모임이에요.

#{이름}님,

#{지역}에서 열리는 이번 달 마지막 모임이에요.
#{책제목}을 함께 읽어요.

자리가 #{남은자리}개밖에 남지 않았어요.
같이 가실래요?

[마지막 자리 확인하기]
```

**변수 목록:**
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `#{이름}` | 회원 이름 | 김지독 |
| `#{지역}` | 모임 지역 | 경주 |
| `#{책제목}` | 모임 책 제목 | 1984 |
| `#{남은자리}` | 남은 좌석 수 | 2 |

**버튼 설정:**
- 버튼명: 마지막 자리 확인하기
- 버튼 URL: `https://jidokhae.com`

---

#### 솔라피 템플릿 등록 절차

**1단계: 솔라피 콘솔 접속**
1. [솔라피 콘솔](https://console.solapi.com) 접속
2. 로그인 후 좌측 메뉴에서 **알림톡** 선택

**2단계: 템플릿 등록 메뉴**
1. **알림톡 > 템플릿 관리** 메뉴 클릭
2. 우측 상단 **템플릿 등록** 버튼 클릭

**3단계: 템플릿 작성**
1. **템플릿 코드**: 위 표의 코드 입력 (예: `SIGNUP_WELCOME`)
2. **카테고리**: 회원/가입/인증
3. **템플릿 내용**: 위의 문구 그대로 복사
4. **버튼 설정**: 웹링크 버튼 추가, URL 입력

**4단계: 주의사항**
- 이모지 사용 금지 (검수 반려 사유)
- 변수는 반드시 `#{변수명}` 형식으로 작성
- 문구 내 광고성 표현 자제
- 버튼 URL은 https:// 포함 전체 경로

**5단계: 검수 요청**
1. 템플릿 저장 후 **검수 요청** 버튼 클릭
2. 검수 소요 시간: 1~3 영업일
3. 검수 결과는 이메일/SMS로 통보

**6단계: 승인 후 템플릿 ID 기록**
1. 검수 승인되면 템플릿 상세에서 **템플릿 ID** 확인
2. 아래 표에 기록

#### 승인된 템플릿 ID 기록

| 템플릿 코드 | 솔라피 템플릿 ID | 승인일 |
|-------------|------------------|--------|
| `SIGNUP_WELCOME` |  |  |
| `SIGNUP_REMINDER_DAY3` |  |  |
| `SIGNUP_REMINDER_DAY7` |  |  |
| `FIRST_MEETING_DAY3` |  |  |
| `FIRST_MEETING_DAY7` |  |  |

---

### 2. DB 마이그레이션 (Phase 1 전 필수)

**실행 위치:** Supabase Dashboard > SQL Editor

**실행 전 확인사항:**
- [ ] 프로덕션 DB 백업 완료
- [ ] 로컬/스테이징에서 먼저 테스트 완료

**실행할 SQL:**

```sql
-- M6-Onboarding: users 테이블 확장
-- 실행일: ____년 __월 __일

-- 1. 온보딩 진행 단계 (1~5)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- 2. 온보딩 완료 시점
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 3. 문제 인식 단계에서 선택한 항목 (JSONB 배열)
ALTER TABLE users ADD COLUMN IF NOT EXISTS problem_selections JSONB DEFAULT '[]';

-- 4. 1차 Aha Moment 달성 시점 (칭찬 보내기)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_aha_at TIMESTAMPTZ;

-- 5. 2차 Aha Moment 달성 시점 (칭찬 받기)
ALTER TABLE users ADD COLUMN IF NOT EXISTS second_aha_at TIMESTAMPTZ;

-- 6. 가입 후 리마인드 마지막 발송 시점
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_reminder_sent_at TIMESTAMPTZ;

-- 7. 가입 후 리마인드 발송 횟수 (14일 규칙: 2회 후 중단)
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_reminder_count INTEGER DEFAULT 0;

-- 8. 인덱스: 온보딩 진행 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_onboarding
  ON users(onboarding_step, is_new_member);

-- 9. 인덱스: 가입 후 리마인드 대상 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_signup_reminder
  ON users(created_at, signup_reminder_count)
  WHERE is_new_member = true;
```

**실행 방법:**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴 **SQL Editor** 클릭
4. **New query** 클릭
5. 위 SQL 전체 복사하여 붙여넣기
6. **Run** 버튼 클릭

**실행 후 확인:**
```sql
-- 컬럼 추가 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'onboarding_step',
    'onboarding_completed_at',
    'problem_selections',
    'first_aha_at',
    'second_aha_at',
    'signup_reminder_sent_at',
    'signup_reminder_count'
  );

-- 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE 'idx_users_%';
```

**완료 체크리스트:**
- [x] SQL 실행 완료 ✅ 2026-02-04
- [x] 7개 컬럼 추가 확인 ✅
- [x] 2개 인덱스 생성 확인 ✅
- [x] 기존 데이터 영향 없음 확인 ✅

---

### 2-1. DB 마이그레이션 추가 (Phase 4 & 5용) ✅ 완료

**실행 위치:** Supabase Dashboard > SQL Editor

**필요 시점:** Phase 4 & 5 구현 완료 후

**실행할 SQL:**

```sql
-- M6-Onboarding Phase 4 & 5: 첫 모임 후 리마인드 컬럼
-- 실행일: ____년 __월 __일

-- 1. 첫 모임 후 리마인드 발송 횟수 (14일 규칙: 2회 후 중단)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_meeting_reminder_count INTEGER DEFAULT 0;

-- 2. 첫 모임 후 리마인드 마지막 발송 시점
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_meeting_reminder_sent_at TIMESTAMPTZ;

-- 3. 인덱스: 첫 모임 후 리마인드 대상 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_first_meeting_reminder
  ON users(first_regular_meeting_at, first_meeting_reminder_count)
  WHERE first_regular_meeting_at IS NOT NULL;
```

**실행 후 확인:**
```sql
-- 컬럼 추가 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'first_meeting_reminder_count',
    'first_meeting_reminder_sent_at'
  );

-- 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'users'
  AND indexname = 'idx_users_first_meeting_reminder';
```

**완료 체크리스트:**
- [x] SQL 실행 완료 ✅ 2026-02-04
- [x] 2개 컬럼 추가 확인 ✅
- [x] 1개 인덱스 생성 확인 ✅

---

### 3. Vercel Cron 설정 ✅ 완료

**설정 위치:** `jidokhae/vercel.json`

**추가할 Cron 설정:**

```json
{
  "crons": [
    {
      "path": "/api/cron/onboarding-signup",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/onboarding-first-meeting",
      "schedule": "0 1 * * *"
    }
  ]
}
```

> **참고:** `0 1 * * *`는 UTC 기준 01:00 (한국시간 10:00)

**기존 Cron과 통합된 전체 설정 예시:**

```json
{
  "crons": [
    {
      "path": "/api/cron/reminder",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/cron/waitlist",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/auto-complete",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/afterglow",
      "schedule": "0,30 * * * *"
    },
    {
      "path": "/api/cron/onboarding-signup",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/onboarding-first-meeting",
      "schedule": "0 1 * * *"
    }
  ]
}
```

**완료 체크리스트:**
- [x] vercel.json에 Cron 설정 추가 ✅ 2026-02-04
- [ ] Vercel 배포 후 Cron 등록 확인 (Vercel Dashboard > Crons) - 배포 후 확인
- [x] CRON_SECRET 환경변수 설정 확인 ✅

---

### M6-Onboarding 준비 작업 체크리스트

### 완료된 작업 ✅

| # | 작업 | Phase | 담당 | 완료일 |
|:-:|------|:-----:|:----:|:------:|
| 1 | DB 마이그레이션 (Phase 1) | Phase 1 | 운영자 | 2026-02-04 |
| 2 | DB 마이그레이션 (Phase 4 & 5) | Phase 4~5 | 운영자 | 2026-02-04 |
| 3 | Vercel Cron 설정 | Phase 4 | 개발자 | 2026-02-04 |

### 남은 작업 (배포 후 진행)

| # | 작업 | Phase | 담당 | 우선순위 |
|:-:|------|:-----:|:----:|:--------:|
| 1 | SIGNUP_WELCOME 템플릿 등록 | Phase 4 | 운영자 | 높음 |
| 2 | SIGNUP_REMINDER_DAY3 템플릿 등록 | Phase 4 | 운영자 | 높음 |
| 3 | SIGNUP_REMINDER_DAY7 템플릿 등록 | Phase 4 | 운영자 | 중간 |
| 4 | FIRST_MEETING_DAY3 템플릿 등록 | Phase 5 | 운영자 | 중간 |
| 5 | FIRST_MEETING_DAY7 템플릿 등록 | Phase 5 | 운영자 | 중간 |
| 6 | 템플릿 ID 코드에 반영 | Phase 4 | 개발자 | 승인 후 |

---

## 솔라피 알림톡 템플릿 등록

### 미등록 템플릿

| 템플릿 코드 | 용도 | 우선순위 | 상태 |
|-------------|------|----------|------|
| `WAITLIST_EXPIRED` | 대기 응답 기한 만료 | 높음 | 미등록 |
| `TRANSFER_DEADLINE_WARNING` | 입금 기한 임박 (6시간 전) | 높음 | 미등록 |
| `ADMIN_NOTICE` | 관리자 공지 | 낮음 | 미등록 |
| 세그먼트 알림들 | 월말 독려, 휴면 위험 등 | 낮음 | 미등록 |

### 등록 시 참고할 템플릿 문구

#### 대기 응답 기한 만료 (`WAITLIST_EXPIRED`)

```
아쉽게도 응답 기한이 지났어요.
대기 순번 만료

#{이름}님, #{모임명} 대기 응답 기한이
만료되었습니다.

다음 자리가 나면 다시 알려드릴게요.

[다시 대기 신청하기]
```

#### 입금 기한 임박 (`TRANSFER_DEADLINE_WARNING`)

```
입금 기한이 얼마 남지 않았어요.
입금 안내

#{이름}님, #{모임명} 참가비 입금 기한이
6시간 남았습니다.

기한: #{기한}까지

입금이 확인되지 않으면 신청이 자동
취소됩니다.

[입금 정보 확인하기]
```

### 등록된 템플릿 ID

| 알림 유형 | 솔라피 템플릿 ID |
|----------|------------------|
| 내일 리마인드 | `KA01TP26013110144750559PJ8DRKmUe` |
| 당일 리마인드 | `KA01TP260131101632094bQBmdj7DTgk` |
| 빈자리 알림 | `KA01TP260131101846595Ia3f022Toxv` |
| 신청 접수 완료 | `KA01TP260131104954973tJPe3gXEmE6` |
| 취소/환불 접수 | `KA01TP260131102910054EeKya0x7uJT` |
| 입금 확인 완료 | `KA01TP260131102614264JqtfvpsSALc` |
| 신청 취소 (기한만료) | `KA01TP2601311027124798sVSTMzzQab` |
| 환영합니다 | `KA01TP260131102303488fxzX3GpPBFN` |
| 모임 후기 요청 | `KA01PF260120113206182sLWZ2NcEsUJ` |

---

## Supabase 설정

| 작업 | 설명 | 상태 |
|------|------|------|
| gallery_images 테이블 생성 | Admin 갤러리 기능용 | 확인 필요 |
| RLS 정책 적용 | 각 테이블 보안 정책 | 확인 필요 |

---

## 문서 관리

| 작업 | 설명 | 상태 |
|------|------|------|
| core/ 문서 버전 업데이트 | 서비스 개요 v1.5, PRD v1.6, 기술스택 v1.4, 시스템구조 v1.6 | 완료 |
| 참고자료 폴더 정리 | 델타 문서 정리 (선택) | 보류 |

---

## 기타

| 작업 | 설명 | 상태 |
|------|------|------|
| 이모지 제거 | 솔라피 템플릿 4개에서 이모지 제거 (취소/환불, 신청취소, 입금확인, 당일리마인드) | 완료 필요 |

---

## 결제 테스트 방법

Beta 출시 전 결제 기능이 정상 동작하는지 확인하는 테스트 가이드입니다.

### 사전 준비

1. **포트원 테스트 모드 확인**
   - [포트원 관리자](https://admin.portone.io) 접속
   - 우측 상단 **테스트/실거래** 토글이 **테스트**로 설정되어 있는지 확인
   - 테스트 모드에서는 실제 결제가 발생하지 않습니다

2. **환경 변수 확인**
   ```
   # .env.local 파일에서 확인
   NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxx  # V2 형식 (store-로 시작)
   PORTONE_API_SECRET=PortOneSecret-xxxxx
   ```

3. **개발 서버 실행**
   ```bash
   cd jidokhae
   npm run dev
   ```

---

### 테스트 1: 카카오페이 결제

| 단계 | 동작 | 예상 결과 |
|:----:|------|----------|
| 1 | 로그인 후 홈 화면에서 **모임 선택** | 모임 상세 Bottom Sheet 열림 |
| 2 | **"함께 읽기"** 버튼 클릭 | 결제 방식 선택 화면 |
| 3 | **카카오페이** 선택 | 카카오페이 결제창 열림 |
| 4 | 테스트 결제 진행 | 결제 완료 (실제 결제 안 됨) |
| 5 | **마이페이지** 확인 | 신청 내역에 **"참가 확정"** 상태 표시 |

> **참고:** PC에서는 QR 코드 스캔이 필요할 수 있습니다. 모바일에서 테스트하면 더 원활합니다.

---

### 테스트 2: 계좌이체 결제

| 단계 | 동작 | 예상 결과 |
|:----:|------|----------|
| 1 | 모임 선택 > **"함께 읽기"** 클릭 | 결제 방식 선택 화면 |
| 2 | **계좌이체** 선택 | 계좌 정보 표시 |
| 3 | 계좌번호 **클립보드 복사** 버튼 클릭 | 복사 완료 토스트 |
| 4 | **"입금했습니다"** 체크박스 선택 | 버튼 활성화 |
| 5 | **확인** 버튼 클릭 | 신청 완료, **"입금대기"** 상태 |
| 6 | **Admin 페이지** (`/admin`) 접속 | 입금대기 목록에 표시 |
| 7 | 해당 신청 건의 **"입금 확인"** 버튼 클릭 | **"참가 확정"** 으로 전환 |

> **24시간 미입금 자동 취소:** 테스트 환경에서는 수동으로 확인해야 합니다.

---

### 테스트 3: 환불 (취소)

| 단계 | 동작 | 예상 결과 |
|:----:|------|----------|
| 1 | **마이페이지** > 확정된 신청 선택 | 신청 상세 화면 |
| 2 | **"다음 기회에"** 버튼 클릭 | 취소 확인 Bottom Sheet |
| 3 | **마음 돌리기 화면** 확인 | "아쉬워요..." 문구 표시 |
| 4 | **취소 사유** 선택 | 사유 선택 완료 |
| 5 | **취소 확인** 버튼 클릭 | 취소 완료 |
| 6 | **환불 규정** 확인 | 모임 유형별 환불 금액 정확히 계산됨 |

**환불 규정 (참고):**
- 정기모임: 3일 전 100%, 2일 전 50%, 이후 불가
- 토론모임: 2주 전 100%, 7일 전 50%, 이후 불가

---

### 테스트 4: 대기 신청

| 단계 | 동작 | 예상 결과 |
|:----:|------|----------|
| 1 | **마감된 모임** 선택 | "마감" 뱃지 표시 |
| 2 | **"대기 신청"** 버튼 클릭 | 대기 등록 (결제 없음) |
| 3 | **마이페이지** 확인 | 대기 내역에 순번 표시 |

---

### 문제 발생 시 체크리스트

| 증상 | 확인 사항 | 해결 방법 |
|------|----------|----------|
| "Store ID is not recognized" | V1 테스트 코드 사용 여부 | 포트원 관리자에서 V2 Store ID 확인 |
| 결제창이 안 열림 | 포트원 SDK 로드 확인 | 브라우저 콘솔에서 에러 확인 |
| 결제 완료 후 상태 미반영 | 웹훅 처리 확인 | 서버 로그 확인 |
| 환불 금액 오류 | 환불 규정 데이터 확인 | DB의 `refund_policies` 테이블 확인 |

---

### 테스트 계정 (권장)

테스트용 계정을 미리 생성해두면 편리합니다:

| 역할 | 이메일 | 용도 |
|------|--------|------|
| Super Admin | super@test.com | 전체 권한 테스트 |
| Admin | admin@test.com | 운영자 기능 테스트 |
| Member | member@test.com | 일반 회원 플로우 테스트 |

---

## 카카오 비즈니스 채널 설정

| 작업 | 상태 |
|------|------|
| 카카오 비즈니스 채널 승인 | 완료 |
| 솔라피 채널 연동 | 확인 필요 |

---

*최종 업데이트: 2026-02-04*