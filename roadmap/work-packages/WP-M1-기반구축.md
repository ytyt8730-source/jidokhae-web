# Work Package: M1 - 프로젝트 기반 구축

---

**Milestone:** M1  
**목표:** 개발 인프라 완성, 기본 화면 동작 확인  
**기간:** 1~2주  
**선행 조건:** 없음 (시작점)

---

## 1. Work Package 개요

M1은 **4개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: 인프라 & 프로젝트 초기화
    ↓ [동작 확인: 빈 페이지가 Vercel에 배포됨]
Phase 2: 데이터베이스 & 인증
    ↓ [동작 확인: 회원가입/로그인 동작]
Phase 3: 모임 조회 UI
    ↓ [동작 확인: 모임 목록이 화면에 표시됨]
Phase 4: 운영자 모임 관리
    ↓ [동작 확인: 운영자가 모임 생성/수정/삭제 가능]
```

---

## 2. Phase 상세

### Phase 1: 인프라 & 프로젝트 초기화

**목표:** 빈 페이지가 Vercel에 자동 배포되어 접속 가능한 상태

**예상 소요:** 0.5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | Next.js 14 프로젝트 생성 | `/` 디렉토리 구조 | `npm run dev` 로 로컬 실행 |
| 1.2 | Tailwind CSS 설정 | `tailwind.config.js` | 기본 스타일 적용 확인 |
| 1.3 | 프로젝트 폴더 구조 설정 | `/app`, `/components`, `/lib`, `/types` | 폴더 생성 완료 |
| 1.4 | 환경 변수 파일 생성 | `.env.local`, `.env.example` | 환경 변수 템플릿 |
| 1.5 | GitHub 레포지토리 생성 | GitHub repo | 초기 커밋 완료 |
| 1.6 | Vercel 프로젝트 연결 | Vercel 프로젝트 | 자동 배포 동작 |
| 1.7 | Supabase 프로젝트 생성 | Supabase 프로젝트 URL | 싱가포르 리전 |
| 1.8 | 8px 그리드 시스템 설정 | `tailwind.config.js` | spacing이 8의 배수로 정의됨 |
| 1.9 | 색상 팔레트 설정 | `globals.css`, `tailwind.config.js` | CSS 변수 정의 |
| 1.10 | 폰트 로드 설정 | `app/layout.tsx` | Pretendard + Noto Serif KR 로드 |
| 1.11 | Framer Motion 설치 | `package.json` | 의존성 추가 |
| 1.12 | 공통 애니메이션 정의 | `/lib/animations.ts` | fadeIn, slideUp, stagger variants |

#### 완료 검증

- [ ] `https://[프로젝트명].vercel.app` 접속 시 빈 페이지 또는 기본 페이지 표시
- [ ] GitHub 푸시 시 Vercel 자동 배포 동작
- [ ] 환경 변수 `.env.example` 파일에 필요한 키 목록 정리됨

#### 사용자 가치

> 🎯 **"개발 환경이 준비되어 즉시 개발을 시작할 수 있다"**

---

### Phase 2: 데이터베이스 & 인증

**목표:** 회원가입, 로그인, 로그아웃이 동작하는 상태

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | Supabase 클라이언트 설정 | `/lib/supabase.ts` | 연결 테스트 통과 |
| 2.2 | users 테이블 생성 | SQL 마이그레이션 | 테이블 생성 완료 |
| 2.3 | meetings 테이블 생성 | SQL 마이그레이션 | 테이블 생성 완료 |
| 2.4 | registrations 테이블 생성 | SQL 마이그레이션 | 테이블 생성 완료 |
| 2.5 | refund_policies 테이블 생성 | SQL 마이그레이션 | 기본 환불 규정 입력 |
| 2.6 | RLS 정책 설정 | SQL 마이그레이션 | 본인 데이터만 접근 |
| 2.7 | 회원가입 페이지 | `/app/auth/signup/page.tsx` | 이메일/비밀번호 가입 |
| 2.8 | 로그인 페이지 | `/app/auth/login/page.tsx` | 이메일/비밀번호 로그인 |
| 2.9 | 로그아웃 기능 | 로그아웃 버튼 | 세션 종료 |
| 2.10 | 인증 상태 관리 | `/lib/auth.ts` | 전역 상태 관리 |
| 2.11 | 인증 미들웨어 | `/middleware.ts` | 보호된 라우트 접근 제어 |

#### 데이터베이스 스키마

```sql
-- users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'member', -- member, admin, super_admin
  is_new_member BOOLEAN DEFAULT true,
  first_regular_meeting_at TIMESTAMP,
  last_regular_meeting_at TIMESTAMP,
  total_participations INTEGER DEFAULT 0,
  consecutive_weeks INTEGER DEFAULT 0,
  total_praises_received INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- meetings 테이블
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  meeting_type VARCHAR(50) NOT NULL, -- regular, discussion, etc.
  datetime TIMESTAMP NOT NULL,
  location VARCHAR(200) NOT NULL,
  capacity INTEGER DEFAULT 14,
  fee INTEGER NOT NULL, -- 콩 단위
  description TEXT,
  refund_policy_id UUID REFERENCES refund_policies(id),
  status VARCHAR(20) DEFAULT 'open', -- open, closed, cancelled
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- registrations 테이블
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  meeting_id UUID REFERENCES meetings(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled
  payment_status VARCHAR(20), -- pending, paid, refunded, partial_refunded
  payment_amount INTEGER,
  refund_amount INTEGER DEFAULT 0,
  cancel_reason TEXT,
  cancelled_at TIMESTAMP,
  participation_status VARCHAR(20), -- null, completed, no_show
  participation_method VARCHAR(20), -- praise, review, confirm, auto, admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

-- refund_policies 테이블
CREATE TABLE refund_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  meeting_type VARCHAR(50) NOT NULL,
  rules JSONB NOT NULL, -- [{days_before: 3, refund_percent: 100}, ...]
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 환불 규정 삽입
INSERT INTO refund_policies (name, meeting_type, rules) VALUES
('정기모임', 'regular', '[{"days_before": 3, "refund_percent": 100}, {"days_before": 2, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]'),
('토론모임', 'discussion', '[{"days_before": 14, "refund_percent": 100}, {"days_before": 7, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]');
```

#### 완료 검증

- [ ] 회원가입 → 로그인 → 로그아웃 전체 흐름 동작
- [ ] 로그인 후 마이페이지 접근 가능
- [ ] 비로그인 시 보호된 페이지 접근 불가 (로그인 페이지로 리다이렉트)
- [ ] Supabase 대시보드에서 users 테이블에 데이터 확인

#### 사용자 가치

> 🎯 **"회원이 가입하고 로그인하여 서비스를 이용할 수 있다"**

---

### Phase 3: 모임 조회 UI

**목표:** 홈 화면에서 모임 목록을 확인하고, 상세 페이지로 이동 가능한 상태

**예상 소요:** 2~3일

> 📌 **MVP 범위:** PRD에서 "캘린더 뷰, 컴팩트 카드 뷰" 모두 명시되었으나, MVP에서는 **컴팩트 카드 뷰를 우선 구현**합니다. 비주얼 캘린더는 2차 개발 또는 Beta 피드백 후 추가를 검토합니다.

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | 레이아웃 컴포넌트 | `/components/layout/` | 헤더, 푸터, 네비게이션 |
| 3.2 | 홈 화면 레이아웃 | `/app/page.tsx` | 기본 레이아웃 완성 |
| 3.3 | 모임 카드 컴포넌트 | `/components/MeetingCard.tsx` | 컴팩트 디자인, 반응형, 호버/클릭 애니메이션 |
| 3.4 | 모임 목록 조회 API | `/app/api/meetings/route.ts` | GET 요청 처리 |
| 3.5 | 홈 화면 모임 목록 | 서버 컴포넌트 | 모임 카드 리스트 + Stagger 등장 효과 |
| 3.6 | 이번 주 모임 하이라이트 | 하이라이트 뱃지 | 이번 주 모임 강조 |
| 3.7 | 모임 상세 페이지 | `/app/meetings/[id]/page.tsx` | 모임 정보 표시 |
| 3.8 | 참가 인원 표시 | "O명 참여" 표시 | 정원 숨김, 인원만 표시 |
| 3.9 | 모임 상태 표시 | 모집중/마감임박/마감 뱃지 | 상태별 색상 구분, 마감임박 Pulse 효과 |
| 3.10 | 마이페이지 기본 | `/app/mypage/page.tsx` | 내 정보 표시 |
| 3.11 | 모바일 반응형 | 모든 UI | 768px 이하 대응 |

#### UI 컴포넌트 명세

**모임 카드 (MeetingCard)**
```
┌─────────────────────────────────┐
│ [이번 주] 경주 정기모임          │ ← 하이라이트 뱃지 (선택적)
│ 📅 1월 20일 (토) 14:00          │
│ 📍 경주 황리단길 북카페          │
│ 💰 10,000콩                     │
│ ─────────────────────────────── │
│ 👥 8명 참여     [마감 임박]     │ ← 정원 숨김, 상태 뱃지
└─────────────────────────────────┘
```

**모임 상태 표시 규칙**
- 모집중: 기본 상태 (뱃지 없음 또는 녹색)
- 마감 임박: 남은 자리 3명 이하 (주황색 뱃지, **Pulse 애니메이션**)
- 마감: 정원 도달 (회색 뱃지)
- 대기 가능: 마감 + 대기 가능 (파란색 뱃지)

**모임 카드 애니메이션**
- 페이지 로드 시: 아래에서 위로 순차적 등장 (Stagger 100ms 간격)
- 호버 시: Y축 -4px 이동 + 그림자 확대 (`whileHover={{ y: -4 }}`)
- 클릭 시: scale 0.98로 잠깐 축소 (`whileTap={{ scale: 0.98 }}`)
- 마감 임박 뱃지: 부드러운 Pulse (opacity 0.7~1, 1.5초 주기)

#### 완료 검증

- [ ] 홈 화면에서 모임 목록이 컴팩트 카드로 표시됨
- [ ] 홈 화면 진입 시 카드가 순차적으로 나타남 (Stagger)
- [ ] 모임 카드 호버 시 미세하게 떠오름 (Y축 -4px)
- [ ] 모임 카드 클릭 시 눌림 피드백 (scale 0.98)
- [ ] 마감 임박 뱃지가 부드럽게 깜빡임 (Pulse)
- [ ] Pretendard 폰트가 본문에 적용됨
- [ ] Noto Serif KR 폰트가 모임명/제목에 적용됨
- [ ] 이번 주 모임에 하이라이트 뱃지 표시
- [ ] 모임 카드 클릭 시 상세 페이지로 이동
- [ ] 상세 페이지에서 모임 정보 확인 가능
- [ ] 모바일에서 UI가 깨지지 않음 (320px~768px)
- [ ] 마이페이지에서 내 정보 확인 가능

#### 사용자 가치

> 🎯 **"회원이 모임 일정을 한눈에 확인하고, 관심 있는 모임의 상세 정보를 볼 수 있다"**

---

### Phase 4: 운영자 모임 관리

**목표:** 운영자가 모임을 생성, 수정, 삭제할 수 있는 상태

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | 운영자 권한 체크 | 미들웨어/HOC | role 기반 접근 제어 |
| 4.2 | 운영자 페이지 레이아웃 | `/app/admin/layout.tsx` | 운영자 전용 네비게이션 |
| 4.3 | 모임 목록 (운영자) | `/app/admin/meetings/page.tsx` | 전체 모임 목록 + 상태 |
| 4.4 | 모임 생성 폼 | `/app/admin/meetings/new/page.tsx` | 모든 필드 입력 가능 |
| 4.5 | 모임 생성 API | `/app/api/admin/meetings/route.ts` | POST 요청 처리 |
| 4.6 | 모임 수정 폼 | `/app/admin/meetings/[id]/edit/page.tsx` | 기존 값 로드 + 수정 |
| 4.7 | 모임 수정 API | `/app/api/admin/meetings/[id]/route.ts` | PUT 요청 처리 |
| 4.8 | 모임 삭제 기능 | 삭제 버튼 + 확인 모달 | DELETE 요청 처리 |
| 4.9 | 환불 규정 선택 | 드롭다운 | 정기모임/토론모임 등 선택 |

#### 모임 생성 폼 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 모임명 | text | ✅ | 최대 200자 |
| 모임 유형 | select | ✅ | 정기모임, 토론모임, 기타 |
| 일시 | datetime | ✅ | 날짜 + 시간 |
| 장소 | text | ✅ | 최대 200자 |
| 정원 | number | ✅ | 기본값 14 |
| 참가비 | number | ✅ | 콩 단위 |
| 설명 | textarea | - | 모임 안내 문구 |
| 환불 규정 | select | ✅ | 정기모임/토론모임/커스텀 |

#### 완료 검증

- [ ] 운영자가 `/admin` 페이지 접근 가능 (일반 회원은 불가)
- [ ] 모임 생성 후 홈 화면에 표시됨
- [ ] 모임 수정 후 변경 사항 반영됨
- [ ] 모임 삭제 후 목록에서 사라짐
- [ ] 환불 규정 선택 시 해당 규정이 모임에 연결됨

#### 사용자 가치 (운영자)

> 🎯 **"운영자가 직접 모임을 등록하고 관리할 수 있다"**

---

## 3. M1 완료 검증 체크리스트

### 기능 검증

- [ ] 회원가입 → 로그인 → 로그아웃 정상 동작
- [ ] 홈 화면에서 모임 목록 표시
- [ ] 모임 카드 클릭 → 상세 페이지 이동
- [ ] 모임 상태(모집중/마감임박/마감) 정확히 표시
- [ ] 마이페이지에서 내 정보 확인
- [ ] 운영자가 모임 생성/수정/삭제 가능

### 기술 검증

- [ ] Vercel 자동 배포 동작
- [ ] Supabase 연결 정상
- [ ] RLS 정책 동작 (본인 데이터만 접근)
- [ ] 모바일 반응형 UI (320px~768px)

### 브랜드 톤 검증

- [ ] 따뜻하고 편안하면서도 고급스러운 디자인
- [ ] 컴팩트 카드가 "참여하고 싶은" 느낌

---

## 4. 기술적 주의사항

### AI 에이전트 가이드

1. **모바일 우선 설계**
   - 모든 UI는 모바일(360px)에서 먼저 확인
   - Tailwind CSS의 `sm:`, `md:`, `lg:` 활용

2. **폴더 구조**
   ```
   /app
     /api
       /meetings
       /admin/meetings
     /auth
       /login
       /signup
     /meetings
       /[id]
     /mypage
     /admin
       /meetings
   /components
     /layout
     /ui
     MeetingCard.tsx
   /lib
     supabase.ts
     auth.ts
   /types
     database.ts
   ```

3. **환경 변수**
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. **타입 안전성**
   - Supabase 타입 자동 생성 활용
   - `/types/database.ts`에 테이블 타입 정의

---

## 5. 다음 단계 (M2 준비)

M1 완료 후 M2 시작 전 확인:

- [ ] 포트원 샌드박스 계정 준비
- [ ] 카카오 개발자 계정 준비 (카카오 로그인용)
- [ ] 모임 상세 페이지에 "신청하기" 버튼 자리 확보 (비활성 상태)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | WP-M1 최초 작성 |
| 2026-01-14 | 1.1 | Phase 3에 MVP 범위 명시 (캘린더 뷰 2차 개발) |
| 2026-01-15 | 1.2 | Phase 1에 디자인 시스템 작업 추가, Phase 3에 애니메이션 요구사항 추가 (Stagger, 호버, Pulse) |

