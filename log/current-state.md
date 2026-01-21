# 현재 작업 상태 (AI 에이전트용)

> **마지막 업데이트**: 2026-01-21
> **버전**: 2.3

---

## 📌 현재 상태 요약

| 항목 | 값 |
|------|-----|
| 완료된 WP | M1 기반구축, M2 핵심결제흐름, M3 알림시스템, M4 소속감, M5 운영자도구, **M6 신규회원&출시준비 완료** |
| 다음 WP | **MVP 완성!** (M1~M6 전체 완료) |
| 블로커 | 솔라피 카카오 채널 승인 대기 중 (M3 실발송 전) |

---

## ✅ 마지막 완료 작업

### WP-M6: 신규 회원 & 출시 준비 (2026-01-21 완료)

**M6 전체 4 Phase 구현 완료!**

#### Phase 1: 후킹 랜딩페이지 (M6-001 ~ M6-010)
- ✅ `/app/about/page.tsx` - SSR 기반 랜딩페이지 (통계, 후기 데이터)
- ✅ `/app/about/LandingContent.tsx` - 애니메이션 기반 클라이언트 컴포넌트
- ✅ `/api/reviews/public` - 공개 동의 후기 API (is_public=true만)
- ✅ SEO 메타데이터 (title, description, og:image, twitter)
- ✅ Framer Motion 스크롤 인터랙션 (섹션별 페이드인, 스태거 애니메이션)
- ✅ 브랜드 스토리, 갤러리, 회원 후기, CTA 버튼 섹션
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)

#### Phase 2: 신규 회원 플로우 (M6-011 ~ M6-021)
- ✅ `NewMemberGuideModal.tsx` - 신규 회원 안내 팝업 (처음이시네요!)
- ✅ "지독해 알아보기" / "바로 신청하기" 선택지
- ✅ "다시 보지 않기" 로컬스토리지 옵션
- ✅ `/api/cron/welcome` - 신규 회원 첫 모임 환영 알림 (D-1)
- ✅ `/api/cron/first-meeting-followup` - 첫 모임 후 후기 요청 (D+3)
- ✅ 신규→기존 회원 전환 로직 (`convertNewMemberToExisting`)
- ✅ 다음 정기모임 추천 로직 포함

#### Phase 3: 자격 체크 & 유도 (M6-022 ~ M6-029)
- ✅ `/lib/eligibility.ts` - 정기모임 자격 검증 모듈 (6개월 규정)
- ✅ `checkRegularMeetingEligibility()` - 자격 상태 체크 함수
- ✅ `IneligibilityModal.tsx` - 자격 미충족 팝업 (정기모임 유도)
- ✅ `/api/cron/eligibility-warning` - 자격 만료 임박 알림 (30일 전)
- ✅ `getEligibilityWarningUsers()` - 만료 임박 회원 조회

#### Phase 4: 알림 템플릿 + Cron 설정
- ✅ `m6-notification-templates.sql` - M6 알림 템플릿 4개
  - NEW_MEMBER_WELCOME (첫 모임 환영)
  - FIRST_MEETING_FOLLOWUP (후기 요청)
  - ELIGIBILITY_WARNING (자격 만료 임박)
  - LAUNCH_ANNOUNCEMENT (정식 출시 안내)
- ✅ `vercel.json` - 새 Cron 작업 추가 (welcome, followup, eligibility-warning)

**테스트 현황**:

| 항목 | 상태 | 비고 |
|------|:----:|------|
| TypeScript 타입 체크 | ✅ | `npx tsc --noEmit` 오류 없음 |
| 프로덕션 빌드 | ✅ | `npm run build` 성공 |
| ESLint | ✅ | 에러 0개 (img 경고만 - 기존 이슈) |

---

## 🎉 MVP 완성!

```
M1: 프로젝트 기반 구축 ✅
M2: 핵심 결제 흐름 ✅
M3: 알림 시스템 ✅
M4: 소속감 기능 ✅
M5: 운영자 도구 ✅
M6: 신규 회원 & 출시 준비 ✅

총 진행률: 100% (모든 마일스톤 완료)
```

---

## 🔜 다음 작업

### 출시 전 필요 작업

1. **Supabase 스키마 업데이트**
   - `m6-notification-templates.sql` 실행
   - 4개 알림 템플릿 추가

2. **테스트 계정 생성 및 QA**
   - super@test.com, admin@test.com, member@test.com
   - 50개 수동 테스트 시나리오 진행 (`manual-test-scenario.md`)

3. **솔라피 설정 완료**
   - [ ] 카카오 비즈니스 채널 승인 대기 중
   - [ ] 알림톡 템플릿 등록 (채널 승인 후)

4. **배포 준비**
   - Vercel 환경 변수 설정 (production)
   - 도메인 연결 (선택)
   - SSL 인증서 확인

---

## 🟢 해결된 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| RLS 무한 재귀 | policy 내 자기 참조 | `auth.uid() = id` 단순화 |
| 포트원 Store ID 오류 | V1 코드 사용 | V2 Store ID로 변경 |
| logger.startTimer 타입 | 반환 타입 미정의 | TimerResult 인터페이스 추가 |
| AUTH_FORBIDDEN 미존재 | ErrorCode 미정의 | 1009 코드 추가 |
| RPC 함수 누락 | schema.sql 미포함 | get_dormant_risk_users, adjust_waitlist_positions 추가 |
| templates LogService 누락 | LogService 타입에 미포함 | 'templates', 'admin', 'reviews', 'eligibility' 타입 추가 |
| Client/Server import 충돌 | permissions.ts 서버 전용 | permissions-constants.ts 분리 |

---

## 🟡 알려진 주의사항

1. **포트 충돌**: 3000 사용 중이면 3001/3003으로 자동 변경 → Redirect URI 등록 필요
2. **PC 결제 제한**: 카카오페이 PC에서 QR 스캔 필요, 모바일은 자동 연결
3. **Mock 알림**: 개발 환경에서는 실제 발송 없이 로그만 기록
4. **계좌이체 정원 관리**: pending_transfer 상태에서 이미 정원 차감됨
5. **갤러리 이미지**: `/public/images/gallery/` 폴더에 실제 이미지 필요 (플레이스홀더 사용 중)
6. **템플릿 코드 대소문자**: 새 템플릿은 대문자 사용 (NEW_MEMBER_WELCOME 등)
7. **권한 import 분리**: 클라이언트에서는 `permissions-constants.ts`, 서버에서는 `permissions.ts` import

---

## 📁 최근 수정/추가 파일

### M6 Phase 1-4 구현 (2026-01-21)

**API Routes:**
- `src/app/api/reviews/public/route.ts` - 공개 후기 API
- `src/app/api/cron/welcome/route.ts` - 신규 회원 환영 알림 Cron
- `src/app/api/cron/first-meeting-followup/route.ts` - 첫 모임 후 알림 Cron
- `src/app/api/cron/eligibility-warning/route.ts` - 자격 만료 임박 알림 Cron

**Pages:**
- `src/app/about/page.tsx` - 랜딩페이지 (SSR + 메타데이터)
- `src/app/about/LandingContent.tsx` - 랜딩페이지 클라이언트 컴포넌트

**Components:**
- `src/components/NewMemberGuideModal.tsx` - 신규 회원 안내 팝업
- `src/components/IneligibilityModal.tsx` - 자격 미충족 팝업

**Utilities:**
- `src/lib/eligibility.ts` - 정기모임 자격 검증 모듈
- `src/lib/animations.ts` - 스크롤 애니메이션 variants 추가

**Types:**
- `src/types/database.ts` - Review, PublicReview, EligibilityCheckResult 타입 추가
- `src/lib/logger.ts` - LogService에 'reviews', 'eligibility' 추가

**Config:**
- `vercel.json` - welcome, first-meeting-followup, eligibility-warning Cron 추가

**SQL:**
- `supabase/m6-notification-templates.sql` - M6 알림 템플릿 4개

---

## 🔗 참조 문서

- [WP-M6 신규회원&출시](/roadmap/work-packages/WP-M6-신규회원-출시.md) - Phase 1-4 완료
- [SC-M6 시나리오](/roadmap/scenarios/SC-M6-신규회원-출시.md) - 45개 시나리오
- [수동 테스트 시나리오](/docs/manual-test-scenario.md) - 50개 테스트 항목
- [milestones.md](/roadmap/milestones.md) - 전체 마일스톤
- [외부 서비스 설정](/docs/external-services.md)
- [환경 변수](/docs/env-variables.md)

---

## 환경 정보

| 항목 | 값 |
|------|-----|
| Next.js | 14.2.35 |
| Supabase | njaavwosjwndtwnjovac |
| 포트원 | V2 API |
| 솔라피 | API 키 설정 완료, 카카오 채널 승인 대기 |
| 배포 | 미배포 (개발 중) |
| DB 스키마 | v1.2.2 (M6 템플릿 추가) |
