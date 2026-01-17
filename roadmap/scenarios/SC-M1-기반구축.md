# Scenario: M1 - 프로젝트 기반 구축

---

**Work Package:** WP-M1  
**총 Scenario 수:** 39개  
**작성일:** 2026-01-14

---

## Phase 1: 인프라 & 프로젝트 초기화

### Scenario M1-001: Next.js 프로젝트 생성 성공

- **Given:** 개발 환경에 Node.js 18+가 설치되어 있음
- **When:** `npx create-next-app@14` 명령으로 프로젝트를 생성함
- **Then:** Next.js 14 프로젝트가 생성되고 `npm run dev`로 로컬 실행됨
- **선행 Scenario:** 없음

---

### Scenario M1-002: Tailwind CSS 설정 성공

- **Given:** M1-001에서 생성된 Next.js 프로젝트가 있음
- **When:** Tailwind CSS를 설치하고 `tailwind.config.js`를 설정함
- **Then:** Tailwind 클래스가 적용된 컴포넌트가 정상 렌더링됨
- **선행 Scenario:** M1-001

---

### Scenario M1-003: 프로젝트 폴더 구조 생성

- **Given:** M1-002에서 Tailwind 설정이 완료됨
- **When:** `/app`, `/components`, `/lib`, `/types` 폴더를 생성함
- **Then:** 폴더 구조가 생성되고 각 폴더에 placeholder 파일이 존재함
- **선행 Scenario:** M1-002

---

### Scenario M1-004: 환경 변수 파일 생성

- **Given:** 프로젝트 폴더 구조가 완성됨
- **When:** `.env.local`과 `.env.example` 파일을 생성함
- **Then:** `.env.example`에 필요한 환경 변수 키 목록이 정리됨
- **선행 Scenario:** M1-003

---

### Scenario M1-005: GitHub 레포지토리 연결 성공

- **Given:** 로컬 프로젝트가 git 초기화됨
- **When:** GitHub 레포지토리를 생성하고 초기 커밋을 푸시함
- **Then:** GitHub에 코드가 업로드되고 main 브랜치가 생성됨
- **선행 Scenario:** M1-004

---

### Scenario M1-006: Vercel 자동 배포 연결 성공

- **Given:** GitHub 레포지토리가 생성됨
- **When:** Vercel 프로젝트를 생성하고 GitHub 레포지토리를 연결함
- **Then:** `https://[프로젝트명].vercel.app` 접속 시 기본 페이지가 표시됨
- **선행 Scenario:** M1-005

---

### Scenario M1-007: Vercel 자동 배포 동작 확인

- **Given:** Vercel과 GitHub이 연결됨
- **When:** 코드를 수정하고 main 브랜치에 푸시함
- **Then:** Vercel이 자동으로 재배포하고 변경 사항이 반영됨
- **선행 Scenario:** M1-006

---

### Scenario M1-008: Supabase 프로젝트 생성 성공

- **Given:** Supabase 계정이 있음
- **When:** 싱가포르 리전에 새 프로젝트를 생성함
- **Then:** Supabase 프로젝트 URL과 API 키가 발급됨
- **선행 Scenario:** 없음

---

### Scenario M1-008a: 8px 그리드 시스템 설정 성공

- **Given:** Tailwind CSS가 설정됨
- **When:** tailwind.config.js에 8px 기반 spacing을 정의함
- **Then:** 모든 간격이 8의 배수로 적용됨 (p-2=8px, p-4=16px 등)
- **선행 Scenario:** M1-002

---

### Scenario M1-008b: 폰트 로드 성공

- **Given:** Next.js 프로젝트가 생성됨
- **When:** layout.tsx에 Pretendard와 Noto Serif KR 폰트를 로드함
- **Then:** 본문은 Pretendard, 제목은 Noto Serif KR이 적용됨
- **선행 Scenario:** M1-001

---

### Scenario M1-008c: Framer Motion 설치 성공

- **Given:** Next.js 프로젝트가 생성됨
- **When:** `npm install framer-motion`을 실행함
- **Then:** package.json에 framer-motion이 추가되고 import 가능함
- **선행 Scenario:** M1-001

---

### Scenario M1-008d: 공통 애니메이션 variants 정의

- **Given:** Framer Motion이 설치됨
- **When:** `/lib/animations.ts`에 fadeIn, slideUp, stagger variants를 정의함
- **Then:** 다른 컴포넌트에서 import하여 재사용 가능함
- **선행 Scenario:** M1-008c

---

## Phase 2: 데이터베이스 & 인증

### Scenario M1-009: Supabase 클라이언트 연결 성공

- **Given:** Supabase 프로젝트가 생성됨, 환경 변수가 설정됨
- **When:** `/lib/supabase.ts`에서 Supabase 클라이언트를 초기화함
- **Then:** 클라이언트가 정상 생성되고 연결 테스트가 통과함
- **선행 Scenario:** M1-008, M1-004

---

### Scenario M1-010: Supabase 연결 실패 (잘못된 API 키)

- **Given:** 잘못된 Supabase API 키가 환경 변수에 설정됨
- **When:** Supabase 클라이언트로 데이터 조회를 시도함
- **Then:** 인증 오류가 발생하고 명확한 에러 메시지가 표시됨
- **선행 Scenario:** M1-008

---

### Scenario M1-011: users 테이블 생성 성공

- **Given:** Supabase 연결이 완료됨
- **When:** users 테이블 생성 SQL 마이그레이션을 실행함
- **Then:** users 테이블이 생성되고 필수 컬럼이 존재함
- **선행 Scenario:** M1-009

---

### Scenario M1-012: meetings 테이블 생성 성공

- **Given:** users 테이블이 생성됨
- **When:** meetings 테이블 생성 SQL 마이그레이션을 실행함
- **Then:** meetings 테이블이 생성되고 refund_policies와 FK 관계가 설정됨
- **선행 Scenario:** M1-014

---

### Scenario M1-013: registrations 테이블 생성 성공

- **Given:** users, meetings 테이블이 생성됨
- **When:** registrations 테이블 생성 SQL 마이그레이션을 실행함
- **Then:** registrations 테이블이 생성되고 UNIQUE 제약조건이 적용됨
- **선행 Scenario:** M1-011, M1-012

---

### Scenario M1-014: refund_policies 테이블 생성 및 기본 데이터 삽입

- **Given:** Supabase 연결이 완료됨
- **When:** refund_policies 테이블을 생성하고 기본 환불 규정을 삽입함
- **Then:** 정기모임(3일/2일) 및 토론모임(2주/7일) 규정이 저장됨
- **선행 Scenario:** M1-009

---

### Scenario M1-015: RLS 정책 설정 성공

- **Given:** 모든 테이블이 생성됨
- **When:** 테이블별 RLS 정책을 설정함
- **Then:** 인증되지 않은 사용자는 데이터에 접근할 수 없음
- **선행 Scenario:** M1-011, M1-012, M1-013, M1-014

---

### Scenario M1-016: 이메일/비밀번호 회원가입 성공

- **Given:** 회원가입 페이지가 존재함, users 테이블이 준비됨
- **When:** 유효한 이메일과 비밀번호로 회원가입을 시도함
- **Then:** Supabase Auth에 사용자가 생성되고 users 테이블에 기록됨
- **선행 Scenario:** M1-011

---

### Scenario M1-017: 회원가입 실패 (중복 이메일)

- **Given:** 이미 등록된 이메일이 있음
- **When:** 동일한 이메일로 회원가입을 시도함
- **Then:** "이미 등록된 이메일입니다" 에러 메시지가 표시됨
- **선행 Scenario:** M1-016

---

### Scenario M1-018: 회원가입 실패 (약한 비밀번호)

- **Given:** 회원가입 페이지가 존재함
- **When:** 6자 미만의 비밀번호로 회원가입을 시도함
- **Then:** "비밀번호는 6자 이상이어야 합니다" 에러 메시지가 표시됨
- **선행 Scenario:** M1-011

---

### Scenario M1-019: 이메일/비밀번호 로그인 성공

- **Given:** 회원가입이 완료된 계정이 있음
- **When:** 올바른 이메일과 비밀번호로 로그인함
- **Then:** 세션이 생성되고 홈 화면으로 이동함
- **선행 Scenario:** M1-016

---

### Scenario M1-020: 로그인 실패 (잘못된 비밀번호)

- **Given:** 회원가입이 완료된 계정이 있음
- **When:** 틀린 비밀번호로 로그인을 시도함
- **Then:** "이메일 또는 비밀번호가 올바르지 않습니다" 에러가 표시됨
- **선행 Scenario:** M1-016

---

### Scenario M1-021: 로그아웃 성공

- **Given:** 로그인된 세션이 있음
- **When:** 로그아웃 버튼을 클릭함
- **Then:** 세션이 종료되고 로그인 페이지로 이동함
- **선행 Scenario:** M1-019

---

### Scenario M1-022: 비로그인 시 보호된 페이지 접근 차단

- **Given:** 로그인되지 않은 상태
- **When:** 마이페이지 URL에 직접 접근함
- **Then:** 로그인 페이지로 리다이렉트됨
- **선행 Scenario:** M1-019

---

## Phase 3: 모임 조회 UI

### Scenario M1-023: 홈 화면 레이아웃 렌더링 성공

- **Given:** 로그인된 상태
- **When:** 홈 화면(`/`)에 접속함
- **Then:** 헤더, 모임 목록 영역, 푸터가 표시됨
- **선행 Scenario:** M1-019

---

### Scenario M1-024: 모임 목록 조회 성공 (데이터 있음)

- **Given:** meetings 테이블에 모임 데이터가 있음
- **When:** 홈 화면에 접속함
- **Then:** 모임 카드가 컴팩트 디자인으로 표시됨
- **선행 Scenario:** M1-012

---

### Scenario M1-025: 모임 목록 조회 (데이터 없음)

- **Given:** meetings 테이블이 비어있음
- **When:** 홈 화면에 접속함
- **Then:** "등록된 모임이 없습니다" 메시지가 표시됨
- **선행 Scenario:** M1-012

---

### Scenario M1-026: 이번 주 모임 하이라이트 표시

- **Given:** 이번 주에 예정된 모임이 있음
- **When:** 홈 화면에 접속함
- **Then:** 해당 모임 카드에 "이번 주" 뱃지가 표시됨
- **선행 Scenario:** M1-024

---

### Scenario M1-027: 모임 상세 페이지 조회 성공

- **Given:** 모임 목록이 표시됨
- **When:** 모임 카드를 클릭함
- **Then:** 해당 모임의 상세 페이지(`/meetings/[id]`)가 표시됨
- **선행 Scenario:** M1-024

---

### Scenario M1-028: 참가 인원 "O명 참여" 표시 (정원 숨김)

- **Given:** 모임에 8명이 신청 완료됨
- **When:** 모임 카드 또는 상세 페이지를 확인함
- **Then:** "8명 참여"라고만 표시되고 정원은 표시되지 않음
- **선행 Scenario:** M1-024

---

### Scenario M1-029: 마감 임박 뱃지 표시 (남은 자리 3명 이하)

- **Given:** 정원 14명 중 12명이 신청 완료됨
- **When:** 모임 카드를 확인함
- **Then:** "마감 임박" 주황색 뱃지가 표시됨
- **선행 Scenario:** M1-024

---

### Scenario M1-030: 마감 상태 표시 (정원 도달)

- **Given:** 정원 14명이 모두 신청 완료됨
- **When:** 모임 카드를 확인함
- **Then:** "마감" 회색 뱃지가 표시됨
- **선행 Scenario:** M1-024

---

### Scenario M1-031: 마이페이지 내 정보 표시

- **Given:** 로그인된 상태
- **When:** 마이페이지(`/mypage`)에 접속함
- **Then:** 사용자 이름과 이메일이 표시됨
- **선행 Scenario:** M1-019

---

### Scenario M1-032: 모바일 반응형 UI 정상 동작

- **Given:** 홈 화면이 로드됨
- **When:** 화면 너비를 320px~768px로 조정함
- **Then:** UI가 깨지지 않고 모임 카드가 세로로 정렬됨
- **선행 Scenario:** M1-024

---

### Scenario M1-032a: 홈 화면 카드 Stagger 애니메이션

- **Given:** 모임 목록이 로드됨
- **When:** 홈 화면에 접속함
- **Then:** 카드가 아래에서 위로 100ms 간격으로 순차 등장함
- **선행 Scenario:** M1-024, M1-008d

---

### Scenario M1-032b: 모임 카드 호버 애니메이션

- **Given:** 모임 카드가 표시됨
- **When:** 마우스를 카드 위에 올림
- **Then:** 카드가 Y축으로 -4px 이동하고 그림자가 확대됨
- **선행 Scenario:** M1-024

---

### Scenario M1-032c: 모임 카드 클릭 피드백

- **Given:** 모임 카드가 표시됨
- **When:** 카드를 클릭함
- **Then:** 카드가 잠시 scale 0.98로 축소되었다가 상세 페이지로 이동함
- **선행 Scenario:** M1-024

---

### Scenario M1-032d: 마감 임박 뱃지 Pulse 애니메이션

- **Given:** 남은 자리가 3명 이하인 모임이 있음
- **When:** 홈 화면에서 해당 카드를 확인함
- **Then:** "마감 임박" 뱃지가 1.5초 주기로 부드럽게 깜빡임 (opacity 0.7~1)
- **선행 Scenario:** M1-029

---

## Phase 4: 운영자 모임 관리

### Scenario M1-033: 운영자 페이지 접근 성공

- **Given:** role이 'admin' 또는 'super_admin'인 사용자가 로그인됨
- **When:** `/admin` 페이지에 접속함
- **Then:** 운영자 대시보드가 표시됨
- **선행 Scenario:** M1-019

---

### Scenario M1-034: 일반 회원 운영자 페이지 접근 차단

- **Given:** role이 'member'인 사용자가 로그인됨
- **When:** `/admin` 페이지에 접속함
- **Then:** 403 Forbidden 또는 홈으로 리다이렉트됨
- **선행 Scenario:** M1-019

---

### Scenario M1-035: 모임 생성 성공

- **Given:** 운영자가 `/admin/meetings/new`에 접속함
- **When:** 모든 필수 필드를 입력하고 저장함
- **Then:** 모임이 생성되고 홈 화면에 표시됨
- **선행 Scenario:** M1-033

---

### Scenario M1-036: 모임 생성 실패 (필수 필드 누락)

- **Given:** 운영자가 모임 생성 폼을 열음
- **When:** 모임명 없이 저장을 시도함
- **Then:** "모임명을 입력해주세요" 에러 메시지가 표시됨
- **선행 Scenario:** M1-033

---

### Scenario M1-037: 모임 수정 성공

- **Given:** 생성된 모임이 있음
- **When:** 운영자가 모임 정보를 수정하고 저장함
- **Then:** 변경 사항이 반영되어 표시됨
- **선행 Scenario:** M1-035

---

### Scenario M1-038: 모임 삭제 성공

- **Given:** 생성된 모임이 있음 (신청자 없음)
- **When:** 운영자가 삭제 버튼을 클릭하고 확인함
- **Then:** 모임이 삭제되고 목록에서 사라짐
- **선행 Scenario:** M1-035

---

### Scenario M1-039: 환불 규정 선택 및 연결

- **Given:** 모임 생성 폼을 열음
- **When:** 환불 규정 드롭다운에서 "정기모임"을 선택함
- **Then:** 해당 환불 규정이 모임에 연결됨
- **선행 Scenario:** M1-014, M1-033

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 | 12 | 0 | 12 |
| Phase 2 | 10 | 4 | 14 |
| Phase 3 | 13 | 1 | 14 |
| Phase 4 | 6 | 1 | 7 |
| **총계** | **41** | **6** | **47** |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | SC-M1 최초 작성 |
| 2026-01-14 | 1.1 | 총 Scenario 수 35개 → 39개 수정 |
| 2026-01-15 | 1.2 | 디자인 시스템 시나리오 추가 (M1-008a~d), 애니메이션 시나리오 추가 (M1-032a~d), 총 47개 |

