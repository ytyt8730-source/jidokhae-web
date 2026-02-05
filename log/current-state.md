# 현재 작업 상태 (AI 에이전트용)

> **마지막 업데이트**: 2026-02-05
> **버전**: 4.1

---

## 현재 상태 요약

| 항목 | 값 |
|------|-----|
| 현재 브랜치 | main |
| 진행 중 WP | **M6-Onboarding** 코드 완료 |
| 완료 Phase | M1~M9 전체 완료 + M6-Onboarding 전체 (Phase 1~5) |
| 다음 단계 | **M10 Connection & Memory** 또는 **운영자 DB 마이그레이션** |

---

## 마지막 완료 작업

### 코드 정리 및 버그 수정 (2026-02-05)

**커밋 5baaf56: 미사용 코드 정리 및 M9 티켓 찢기 기능 적용**

삭제된 파일 (9개):
- `src/hooks/useRegistrationStatus.ts` - 미사용 hook
- `src/components/home/HeroSection.tsx` - 미사용 컴포넌트
- `src/components/ui/ThemeToggle.tsx` - 미사용 컴포넌트
- `src/components/icons/index.ts` - 미사용 barrel export
- `src/components/effects/index.ts` - 미사용 barrel export
- `src/components/issuance/` (폴더 전체) - 미사용 컴포넌트

수정된 파일:
- `src/components/providers/OnboardingRedirectProvider.tsx` - **신규 생성**, 회원가입 후 온보딩 리다이렉트 수정
- `src/app/layout.tsx` - OnboardingRedirectProvider 추가
- `src/components/ticket/TicketPerforation.tsx` - useTearGesture hook 적용 (피드백 통합)
- `src/components/ticket/TicketDetailModal.tsx` - onTear prop 추가, 확정 티켓 절취선 표시
- `src/__tests__/lib/utils.test.ts` - calculateMeetingStatus 대기자 기능 반영

**커밋 6634a77: PRD 세그먼트 기반 회원 레벨 시스템 구현**

수정된 파일:
- `src/lib/utils.ts` - getMemberLevel() 함수 추가
- `src/components/layout/Sidebar.tsx` - 하드코딩 제거, 실제 참여 횟수 기반 레벨 표시

레벨 매핑 (PRD v1.7 섹션 4 기반):
| PRD 세그먼트 | 조건 | 레벨 |
|-------------|------|------|
| 신규 | is_new_member=true 또는 참여 0회 | Lv.1 신규멤버 |
| 온보딩 중 | 참여 1회 | Lv.2 새싹멤버 |
| 성장 중 | 참여 2~4회 | Lv.3 성장멤버 |
| 충성 | 참여 5회+ | Lv.4 열정멤버 |

**검증:**
- TypeScript: ✅ 통과
- Build: ✅ 통과
- Test: ✅ 66/66 통과

---

### M6-Onboarding Phase 1 (2026-02-04)

**완료된 파일:**
- `src/types/onboarding.ts` - 온보딩 타입 정의
  - OnboardingStep (1~5), OnboardingState 인터페이스
  - PROBLEM_OPTIONS 상수 (4개 선택지)
  - 유효성 검사 함수들 (isValidOnboardingStep, isValidProblemId, isValidAhaType)
  - toOnboardingState 변환 함수

- `src/app/api/users/onboarding/route.ts` - 온보딩 상태 API
  - GET: 현재 온보딩 상태 조회
  - PATCH: 온보딩 단계 업데이트

- `src/app/api/users/onboarding/problems/route.ts` - 문제 선택 API
  - POST: 문제 인식 선택 저장 (1~4개)

- `src/app/api/users/aha/route.ts` - Aha Moment API
  - POST: Aha Moment 달성 기록 (first/second)

- `src/lib/logger.ts` - onboardingLogger 추가

**DB 마이그레이션 (운영자 완료):**
- onboarding_step, onboarding_completed_at, problem_selections, first_aha_at, second_aha_at

**검증:**
- TypeScript: ✅ 통과
- Build: ✅ 통과
- ESLint: ✅ 통과

### M6-Onboarding Phase 2 (2026-02-04)

**완료된 파일:**
- `src/components/onboarding/OnboardingContainer.tsx` - 3단계 온보딩 플로우 관리
- `src/components/onboarding/OnboardingProgress.tsx` - 프로그레스 바 컴포넌트
- `src/components/onboarding/ProblemRecognition.tsx` - 1단계: 문제 인식 선택 화면
- `src/components/onboarding/TrustBuilding.tsx` - 2단계: 신뢰 확보 화면
- `src/components/onboarding/ActionGuide.tsx` - 3단계: 행동 안내 화면
- `src/components/onboarding/NumberCards.tsx` - 숫자 카드 애니메이션
- `src/components/onboarding/ReviewSlider.tsx` - 회원 후기 슬라이더
- `src/components/onboarding/index.ts` - 컴포넌트 export
- `src/app/onboarding/page.tsx` - 온보딩 페이지 라우트
- `src/hooks/useOnboardingRedirect.ts` - 신규 회원 자동 리다이렉트 훅

**API 업데이트:**
- `src/app/api/users/onboarding/route.ts` - complete 플래그 추가

**주요 기능:**
- 3단계 온보딩 플로우 (문제 인식 → 신뢰 확보 → 행동 안내)
- 문제 선택 시 공감 메시지 표시
- 숫자 카드 Stagger 애니메이션
- 회원 후기 자동 슬라이드 (5초)
- 건너뛰기 기능
- URL 쿼리 파라미터로 단계 복원

**검증:**
- TypeScript: ✅ 통과
- Build: ✅ 통과
- ESLint: ✅ 통과

### M6-Onboarding Phase 3 (2026-02-04)

**기존 구현 확인:** `/about` 페이지가 이미 Phase 3 요구사항을 충족

**기존 파일 (수정 불필요):**
- `src/app/about/page.tsx` - SSR, SEO 메타데이터, 갤러리, 후기 섹션
- 스크롤 애니메이션, 후기 익명화 처리 완료

### M6-Onboarding Phase 4 (2026-02-04)

**완료된 파일:**
- `src/lib/onboarding/reminder.ts` - 리마인더 유틸리티
  - ReminderTarget, SignupReminderTarget 타입
  - getSignupReminderTargets() - 3/7일 가입 후 대상 조회
  - getMostPopularMeeting() - 인기 모임 조회
  - updateReminderCount() - 발송 카운터 업데이트
  - logReminderNotification() - 알림 로그 저장

- `src/app/api/cron/onboarding-signup/route.ts` - 가입 후 리마인더 Cron
  - 매일 오전 10시(KST) 실행
  - 3일/7일 후 미신청 회원 대상
  - 14일 규칙: 2회 발송 후 중단

**템플릿 코드:**
- SIGNUP_REMINDER_DAY3
- SIGNUP_REMINDER_DAY7

### M6-Onboarding Phase 5 (2026-02-04)

**완료된 파일:**
- `src/app/api/cron/onboarding-first-meeting/route.ts` - 첫 모임 후 리마인더 Cron
  - 매일 오전 10시(KST) 실행
  - 첫 정기모임 참여 후 3/7일 된 미신청 회원 대상
  - 14일 규칙: 2회 발송 후 중단

- `src/lib/onboarding/reminder.ts` (확장)
  - FirstMeetingReminderTarget 타입
  - getFirstMeetingReminderTargets() - 첫 모임 후 대상 조회
  - getNextAvailableMeeting() - 다음 모임 조회

**템플릿 코드:**
- FIRST_MEETING_DAY3
- FIRST_MEETING_DAY7

**vercel.json 업데이트:**
- `/api/cron/onboarding-signup` (0 1 * * *)
- `/api/cron/onboarding-first-meeting` (0 1 * * *)

**운영자 필수 작업:**
- DB 마이그레이션 (first_meeting_reminder_count, first_meeting_reminder_sent_at)
- 솔라피 템플릿 등록 및 ID 반영
- 상세: `/docs/owner-tasks.md` 참조

**검증:**
- TypeScript: ✅ 통과
- Build: ✅ 통과
- ESLint: ✅ 통과

---

## 디자인 시스템 v3.4 현황

### v2.1 -> v3.3 업그레이드 (2026-01-27)
- CSS 변수 기반 색상 시스템 전환
- 테마 전환 (Electric/Warm) 완전 지원
- No-Emoji Policy 준수 (Coins -> KongIcon 교체)

### 수정된 컴포넌트
- `src/components/ui/Button.tsx` - bg-primary, focus:ring-primary
- `src/components/ui/Badge.tsx` - CSS 변수 기반, accent 색상 수정
- `src/components/layout/Header.tsx` - useTheme 훅, 로고 테마별 폰트 분기
- `src/components/layout/Footer.tsx` - bg-bg-base, border-[var(--border)]
- `src/components/meetings/MeetingCard.tsx` - KongIcon, CSS 변수 색상
- `src/app/meetings/[id]/page.tsx` - KongIcon, CSS 변수 색상

### 테마별 폰트 규칙
- Electric 테마: 로고에 font-sans 적용
- Warm 테마: 로고에 font-serif 적용

### 기존 v2.1 변경 내역
- **brand**: Terracotta (#c77654) -> Hunter Green (#355E3B)
- **accent**: 신규 추가 (마감임박용 #B85C38)
- **warm-***: 모두 brand-* 또는 gray-*로 교체
- `tailwind.config.ts`: brand/accent 팔레트, 그림자 업데이트
- `globals.css`: 타이포그래피 유틸리티 (text-h1~h3, text-body 등)

### 신규 파일
- `src/app/admin/settings/` - 설정 페이지
- `src/app/admin/users/` - 사용자 관리 페이지
- `src/app/mockup/` - 디자인 미리보기 페이지
- `supabase/migration-v1.3.0-fix-rls.sql`
- `supabase/migration-v1.3.0-full-reset.sql`

### 5-star 품질 인프라 (2026-01-25)
- `vitest.config.ts` - 테스트 설정
- `src/__tests__/setup.ts` - Testing Library 설정
- `src/__tests__/lib/utils.test.ts` - 유틸 테스트 (18개)
- `src/__tests__/lib/errors.test.ts` - 에러 테스트 (20개)
- `src/__tests__/lib/api.test.ts` - API 테스트 (16개)
- `src/__tests__/components/ui/Badge.test.tsx` - Badge 테스트 (12개)
- `src/lib/env.ts` - 타입 안전 환경변수
- `.env.example` - 완전 문서화

---

## M8 Ritual Foundation (2026-01-27)

### Phase 8.1: Micro-Copy 시스템
- `src/lib/constants/microcopy.ts` - 전체 서비스 텍스트 감성적 톤 통일
- 버튼, 상태, 에러, 폼 검증, 페이지 타이틀, 빈 상태 메시지

### Phase 8.2: No-Emoji Policy
- 전체 소스 코드에서 이모지 제거 완료
- Lucide React 아이콘으로 전환
- Custom 아이콘: KongIcon, LeafIcon, BookIcon

### Phase 8.3-8.4: Sound/Haptic System
- `src/lib/sound.ts` - SoundManager 싱글톤
- `src/hooks/useFeedback.ts` - Sound + Haptic 통합 훅
- 사운드: beans, printer, typewriter, tear, stamp, whoosh
- 햅틱 패턴: light, heavy, success, tick, error

---

## M9 Commitment Ritual (2026-01-27)

### Phase 9.1: DB 스키마 + 티켓 컴포넌트 기반
- `src/types/ticket.ts` - TicketData, TicketStatus 타입 정의
- `src/lib/ticket.ts` - 티켓 유틸리티 함수
- `src/components/ticket/Ticket.tsx` - 메인 티켓 컴포넌트
- `src/components/ticket/TicketStub.tsx` - 스텁 컴포넌트
- `src/components/ticket/TicketPerforation.tsx` - 절취선 컴포넌트

### Phase 9.2: 발권 애니메이션 + 콩 물성
- `src/hooks/useTypewriter.ts` - 타자 효과 훅
- `src/components/icons/KongIcon.tsx` - Gold/Brown 그라데이션 콩 아이콘
- `src/lib/animations.ts` - ticketSlit, ticketPrinting, kongIdle, kongPour, confirmStamp
- `src/components/ticket/TicketPrinting.tsx` - 발권 애니메이션

### Phase 9.3: 확정 Celebration + 입금대기
- `src/components/ticket/ConfirmStamp.tsx` - 확정 도장 애니메이션
- `src/components/ticket/PendingIndicator.tsx` - 점 애니메이션 포함 대기 표시
- `src/components/ticket/ConfirmationModal.tsx` - 확정 모달
- `src/hooks/useTearGesture.ts` - 절취선 드래그 제스처 (2026-02-05: TicketPerforation에 적용 완료)

### Phase 9.4: 티켓 보관함 + 취소 Flow 개선
- `src/lib/ticket-export.ts` - 이미지 저장 및 ICS 생성
- `src/hooks/useTickets.ts` - 티켓 목록 조회 훅
- `src/components/ticket/TicketList.tsx` - 티켓 그리드
- `src/components/ticket/TicketActions.tsx` - 이미지/캘린더 버튼
- `src/components/ticket/TicketDetailModal.tsx` - 상세 모달
- `src/components/ticket/TicketsPageHeader.tsx` - 페이지 헤더
- `src/components/ticket/TicketsTabs.tsx` - 탭 컴포넌트
- `src/components/cancel/CancelBottomSheet.tsx` - 취소 Bottom Sheet
- `src/components/cancel/RefundPolicySection.tsx` - 환불 규정
- `src/components/cancel/CancelComplete.tsx` - 취소 완료
- `src/app/mypage/tickets/page.tsx` - 보관함 페이지
- `src/lib/constants/microcopy.ts` - 티켓/취소 메시지 추가
- `src/lib/logger.ts` - LogService 타입 추가
- html2canvas 의존성 추가

---

## 전체 마일스톤 완료 현황 (v4.0 재구성)

### Part 1: Core MVP (M1~M9) ✅ 완료
```
M1: 프로젝트 기반 구축 ✅
M2: 핵심 결제 흐름 ✅
M3: 알림 시스템 ✅
M4: 소속감 기능 ✅
M5: 운영자 도구 ✅
M6: 신규 회원 & 출시 준비 ✅
M7: Polish & Growth ✅
M8: Ritual Foundation ✅
M9: Commitment Ritual ✅
```

### Part 2: Onboarding ✅ 완료
```
M6-Onboarding: 5단계 온보딩 플로우 ✅ (PRD v1.6 기반)
  ├── Phase 1: DB 스키마 & API ✅ 완료
  ├── Phase 2: 온보딩 UI ✅ 완료
  ├── Phase 3: 랜딩페이지 개선 ✅ 완료 (기존 /about 활용)
  ├── Phase 4: 가입 후 리마인드 시퀀스 ✅ 완료
  └── Phase 5: 첫 모임 후 리마인드 ✅ 완료
  └── 목표: 신규 회원 재참여율 50% → 70%
  └── 운영자 작업 필요: DB 마이그레이션, 솔라피 템플릿
```

### Part 3: Experience Enhancement (M10~M12)
```
M10: Connection & Memory ⏳ (WP 완료, 코드 미구현)
M11: Community Hub ⏳ (WP 완료, 코드 미구현)
M12: Admin Evolution ⏳ (WP 완료, M6-Onboarding과 병행 가능)
```

### Part 4: 백오피스 MVP (M13~M17)
```
M13: 백오피스 기반 구축 ⏳
M14: 결제 운영 ⏳
M15: 모임 관리 ⏳
M16: 회원 관리 ⏳
M17: 설정 관리 ⏳
```

**진행 순서 (확정):**
```
M6-Onboarding ✅ → M10 → M11 → M12(병행) → M13-M17
```

**총 진행률:** M1~M9 + M6-Onboarding 코드 완료 / 다음 단계: M10 또는 운영자 작업

---

## 다음 작업

### 🟢 M6-Onboarding 완료 - 운영자 작업 필요

**개발 완료 (5 Phase 모두 완료):**
1. ~~Phase 1: DB 스키마 & 기반 인프라~~ ✅
2. ~~Phase 2: 온보딩 1~3단계 UI~~ ✅
3. ~~Phase 3: 후킹 랜딩페이지~~ ✅ (기존 /about 활용)
4. ~~Phase 4: 가입 후 리마인드 시퀀스~~ ✅
5. ~~Phase 5: 첫 모임 후 리마인드~~ ✅

**운영자 필수 작업 (배포 전):**
1. DB 마이그레이션 실행 (Phase 1 + Phase 4 & 5)
2. 솔라피 템플릿 5개 등록 및 승인
3. 템플릿 ID 코드에 반영
4. 상세: `/docs/owner-tasks.md` 참조

**다음 마일스톤 옵션:**
- M10: Connection & Memory (WP 완료, 코드 미구현)
- M11: Community Hub (WP 완료, 코드 미구현)
- M12: Admin Evolution (병행 가능)

**시작 명령:**
```
M10 시작
```

### 배포 전 필요 작업

1. **Supabase 스키마 업데이트**
   - `migration-v1.3.0-fix-rls.sql` 실행
   - M6-Onboarding 마이그레이션 (Phase 1 + Phase 4 & 5)

2. **솔라피 설정**
   - [x] 카카오 비즈니스 채널 승인 ✅ 완료
   - [ ] 알림톡 템플릿 등록 (M6용 5개 + 기타 2개)

---

## 해결된 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| RLS 무한 재귀 | policy 내 자기 참조 | `auth.uid() = id` 단순화 |
| 포트원 Store ID 오류 | V1 코드 사용 | V2 Store ID로 변경 |
| Client/Server import 충돌 | permissions.ts 서버 전용 | permissions-constants.ts 분리 |
| warm-* 색상 클래스 | 디자인 시스템 변경 | brand-*/gray-*로 전체 교체 |
| 하드코딩 색상 | v2.1에서 남은 잔재 | CSS 변수 기반으로 전환 (v3.3) |
| Coins 아이콘 | No-Emoji Policy 위반 | KongIcon으로 교체 |
| 온보딩 리다이렉트 미작동 | useOnboardingRedirect 호출 안됨 | OnboardingRedirectProvider 생성 |
| 회원 레벨 하드코딩 | "Lv.2 열정멤버" 고정 | PRD 세그먼트 기반 getMemberLevel() 구현 |
| 티켓 찢기 기능 미적용 | useTearGesture 미사용 | TicketPerforation에 hook 적용 |

---

## 알려진 주의사항

1. **포트 충돌**: 3000 사용 중이면 3001/3003으로 자동 변경 -> Redirect URI 등록 필요
2. **PC 결제 제한**: 카카오페이 PC에서 QR 스캔 필요, 모바일은 자동 연결
3. **Mock 알림**: 개발 환경에서는 실제 발송 없이 로그만 기록
4. **레터박스 UI**: 데스크톱에서 480px 너비 중앙 정렬, 모바일은 전체 너비
5. **아이콘 표준**: 모든 lucide-react 아이콘은 strokeWidth=1.5 사용

---

## 환경 정보

| 항목 | 값 |
|------|-----|
| Next.js | 14.2.35 |
| Supabase | njaavwosjwndtwnjovac |
| 포트원 | V2 API |
| 솔라피 | API 키 설정 완료, 카카오 채널 승인 ✅ |
| 배포 | Beta-ready (미배포) |
| DB 스키마 | v1.3.0 |
| 디자인 시스템 | v3.5 (CSS 변수 기반, 테마 전환 지원) |
| 마일스톤 문서 | v4.0 (M6-Onboarding 추가, 우선순위 재구성) |
| WP 문서 | M1~M17 + M6-Onboarding 완료 |
