# 현재 작업 상태 (AI 에이전트용)

> **마지막 업데이트**: 2026-01-22
> **버전**: 2.4

---

## 현재 상태 요약

| 항목 | 값 |
|------|-----|
| 완료된 WP | M1 기반구축, M2 핵심결제흐름, M3 알림시스템, M4 소속감, M5 운영자도구, M6 신규회원&출시준비, **M7 Polish & Growth 완료** |
| 다음 WP | 추가 피드백 반영 또는 프로덕션 배포 |
| 블로커 | 솔라피 카카오 채널 승인 대기 중 (M3 실발송 전) |

---

## 마지막 완료 작업

### WP-M7: Polish & Growth (2026-01-22 완료)

**M7 전체 4 Phase 구현 완료!**

#### Phase 1: 전환율 개선
- M7-001: 환불 규정 "더보기"로 접기 (`RefundRulesSection.tsx`)
- M7-002: 첫 방문 뱃지 넛지 배너 (meetings/[id]/page.tsx)
- M7-003: 팝업 -> 인라인 미리보기 (`AtmospherePreview.tsx`, `NewMemberGuideModal.tsx` DEPRECATED)

#### Phase 2: 리텐션 강화
- M7-010: 참여자 티저 알림 (reminder.ts 수정)
- M7-011: 여운 메시지 Cron (`/api/cron/afterglow`, vercel.json 추가)
- M7-012: 내 책장 플레이스홀더 개선 (AddBookForm.tsx)

#### Phase 3: 바이럴 장치
- M7-020: 한 문장 카드 이미지 생성 (`QuoteCardGenerator.tsx`, html-to-image)

#### Phase 4: 인프라 & 마무리
- M7-030: 레터박스 UI (layout.tsx - 480px 중앙 정렬)

**테스트 현황**:

| 항목 | 상태 | 비고 |
|------|:----:|------|
| TypeScript 타입 체크 | ✅ | `npx tsc --noEmit` 에러 0개 |
| 프로덕션 빌드 | ✅ | `npm run build` 성공 |
| ESLint | ✅ | 에러 0개 (img 경고만 - 기존 이슈) |

---

## 전체 마일스톤 완료 현황

```
M1: 프로젝트 기반 구축 ✅
M2: 핵심 결제 흐름 ✅
M3: 알림 시스템 ✅
M4: 소속감 기능 ✅
M5: 운영자 도구 ✅
M6: 신규 회원 & 출시 준비 ✅
M7: Polish & Growth ✅

총 진행률: 100% (M1~M7 완료)
```

---

## 다음 작업

### 배포 전 필요 작업

1. **Supabase 스키마 업데이트**
   - `m6-notification-templates.sql` 실행 (M6 템플릿 4개)
   - `m7-notification-templates.sql` 실행 (M7 템플릿 - AFTERGLOW, REMINDER_1D 업데이트)

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

## 해결된 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| RLS 무한 재귀 | policy 내 자기 참조 | `auth.uid() = id` 단순화 |
| 포트원 Store ID 오류 | V1 코드 사용 | V2 Store ID로 변경 |
| logger.startTimer 타입 | 반환 타입 미정의 | TimerResult 인터페이스 추가 |
| AUTH_FORBIDDEN 미존재 | ErrorCode 미정의 | 1009 코드 추가 |
| RPC 함수 누락 | schema.sql 미포함 | get_dormant_risk_users, adjust_waitlist_positions 추가 |
| templates LogService 누락 | LogService 타입에 미포함 | 'templates', 'admin', 'reviews', 'eligibility' 타입 추가 |
| Client/Server import 충돌 | permissions.ts 서버 전용 | permissions-constants.ts 분리 |
| html-to-image 미설치 | M7 구현 후 미설치 | npm install html-to-image |
| QuoteCardGenerator " escape | ESLint react/no-unescaped-entities | `&ldquo;` 사용 |
| RefundRulesSection 미사용 변수 | policyName 선언만 됨 | 파라미터 제거 |

---

## 알려진 주의사항

1. **포트 충돌**: 3000 사용 중이면 3001/3003으로 자동 변경 -> Redirect URI 등록 필요
2. **PC 결제 제한**: 카카오페이 PC에서 QR 스캔 필요, 모바일은 자동 연결
3. **Mock 알림**: 개발 환경에서는 실제 발송 없이 로그만 기록
4. **계좌이체 정원 관리**: pending_transfer 상태에서 이미 정원 차감됨
5. **갤러리 이미지**: `/public/images/gallery/` 폴더에 실제 이미지 필요 (플레이스홀더 사용 중)
6. **템플릿 코드 대소문자**: 새 템플릿은 대문자 사용 (NEW_MEMBER_WELCOME 등)
7. **권한 import 분리**: 클라이언트에서는 `permissions-constants.ts`, 서버에서는 `permissions.ts` import
8. **레터박스 UI**: 데스크톱에서 480px 너비 중앙 정렬, 모바일은 전체 너비

---

## 최근 수정/추가 파일

### M7 Phase 1-4 구현 (2026-01-22)

**신규 파일:**
- `src/components/RefundRulesSection.tsx` - 환불 규정 더보기 컴포넌트
- `src/components/AtmospherePreview.tsx` - 인라인 분위기 미리보기
- `src/components/QuoteCardGenerator.tsx` - 한 문장 카드 이미지 생성
- `src/app/api/cron/afterglow/route.ts` - 여운 메시지 Cron
- `supabase/m7-notification-templates.sql` - M7 알림 템플릿
- `roadmap/work-packages/WP-M7-Polish-Growth.md` - M7 워크패키지

**수정 파일:**
- `src/app/layout.tsx` - 레터박스 UI (480px 중앙 정렬)
- `src/app/meetings/[id]/page.tsx` - 뱃지 넛지, 환불 규정, 인라인 미리보기
- `src/app/mypage/bookshelf/page.tsx` - QuoteCardGenerator 연동
- `src/app/mypage/bookshelf/AddBookForm.tsx` - 플레이스홀더 개선
- `src/lib/reminder.ts` - 티저 문구 생성 로직
- `src/app/globals.css` - pulse-slow 애니메이션
- `src/components/NewMemberGuideModal.tsx` - DEPRECATED 표시
- `vercel.json` - afterglow Cron 추가
- `roadmap/milestones.md` - M7 섹션 추가

---

## 참조 문서

- [WP-M7 Polish & Growth](/roadmap/work-packages/WP-M7-Polish-Growth.md)
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
| DB 스키마 | v1.2.3 (M7 템플릿 추가) |
