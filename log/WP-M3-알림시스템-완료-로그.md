# WP-M3: 알림시스템 완료 로그

> **작성일**: 2026-01-17
> **Work Package**: WP-M3
> **목표**: 솔라피 기반 알림톡 시스템 구축 및 자동화
> **상태**: ✅ 완료

## 📌 요약 (3줄 이내)

- 솔라피 알림톡 서비스 추상화 레이어 구현 (추후 NHN Cloud 등 교체 용이)
- Vercel Cron 기반 자동 알림 (리마인드, 대기자, 세그먼트별, 월말독려)
- 운영자 수동 알림 발송 UI 및 API 구현

## ✅ 완료된 작업

| Phase | 작업 | 상태 |
|-------|------|:----:|
| Phase 1 | 알림 서비스 추상화 레이어 (NotificationService 인터페이스) | ✅ |
| Phase 1 | Solapi 어댑터 및 Mock 어댑터 구현 | ✅ |
| Phase 1 | notification_logs 테이블 확인 및 로깅 유틸리티 | ✅ |
| Phase 2 | 모임 리마인드 Cron API (3일/1일/당일) | ✅ |
| Phase 2 | KST 시간대 처리 및 중복 발송 방지 | ✅ |
| Phase 3 | 대기자 자리 발생 알림 (취소 시 트리거) | ✅ |
| Phase 3 | 대기자 응답 기한 체크 Cron (24h/6h/2h) | ✅ |
| Phase 4 | 세그먼트별 알림 (자격만료/휴면/온보딩) | ✅ |
| Phase 4 | 월말 독려 Cron (매월 25일) | ✅ |
| Phase 4 | 운영자 수동 알림 발송 API | ✅ |
| Phase 4 | 운영자 알림 관리 UI 페이지 | ✅ |
| 설정 | vercel.json Cron 스케줄 구성 | ✅ |

## 📁 수정된 파일

> 코드는 포함하지 않고 경로만 기록

### 신규 생성

**알림 서비스 인프라**
- `src/lib/notification/types.ts` - 알림 관련 타입 정의 및 템플릿 코드 상수
- `src/lib/notification/solapi.ts` - Solapi 알림톡 어댑터
- `src/lib/notification/index.ts` - 메인 엔트리포인트, 로깅/중복체크 유틸리티

**비즈니스 로직**
- `src/lib/reminder.ts` - 모임 리마인드 로직 (3일/1일/당일)
- `src/lib/waitlist-notification.ts` - 대기자 알림 로직 (응답 기한 계산)
- `src/lib/segment-notification.ts` - 세그먼트별 알림 (자격만료/휴면/온보딩/월말독려)

**Cron API**
- `src/app/api/cron/reminder/route.ts` - 매일 오전 7시 (KST)
- `src/app/api/cron/waitlist/route.ts` - 매시간
- `src/app/api/cron/monthly/route.ts` - 매월 25일 오전 10시 (KST)
- `src/app/api/cron/segment-reminder/route.ts` - 매일 오전 11시 (KST)

**관리자 기능**
- `src/app/api/admin/notifications/route.ts` - 수동 알림 발송 API
- `src/app/admin/notifications/page.tsx` - 알림 관리 페이지
- `src/app/admin/notifications/NotificationForm.tsx` - 알림 발송 폼
- `src/app/admin/notifications/NotificationLogs.tsx` - 발송 이력 조회

**설정**
- `vercel.json` - Cron 스케줄 설정

### 수정됨

- `src/app/api/registrations/cancel/route.ts` - 취소 시 대기자 알림 트리거 추가
- `src/app/admin/layout.tsx` - 알림 발송 메뉴 추가
- `src/lib/logger.ts` - TimerResult 인터페이스 추가
- `src/lib/errors.ts` - AUTH_FORBIDDEN 에러 코드 추가
- `supabase/schema.sql` - M3용 RPC 함수 추가 (get_dormant_risk_users, adjust_waitlist_positions)

## 🔧 필요한 환경 변수

```bash
# 솔라피 (알림톡)
SOLAPI_API_KEY=xxxxx
SOLAPI_API_SECRET=xxxxx
SOLAPI_SENDER=01012345678
SOLAPI_KAKAO_PFID=@지독해

# Cron 인증 (선택)
CRON_SECRET=your_cron_secret
```

## ⚡ 빠른 참조 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build

# Cron API 로컬 테스트 (개발 환경에서는 인증 없이 호출 가능)
curl http://localhost:3000/api/cron/reminder
curl http://localhost:3000/api/cron/waitlist
curl http://localhost:3000/api/cron/monthly
curl http://localhost:3000/api/cron/segment-reminder
```

## ⚠️ 트러블슈팅

### 문제 1: logger.startTimer().done() 타입 오류
- **증상**: `Property 'done' does not exist on type '() => number'`
- **원인**: 기존 startTimer()가 함수만 반환
- **해결**: TimerResult 인터페이스 추가하여 elapsed(), done() 메서드 포함

### 문제 2: AUTH_FORBIDDEN 미존재
- **증상**: `Property 'AUTH_FORBIDDEN' does not exist on type 'typeof ErrorCode'`
- **원인**: ErrorCode enum에 해당 코드 미정의
- **해결**: AUTH_FORBIDDEN = 1009 추가

### 문제 3: 누락된 RPC 함수
- **증상**: `get_dormant_risk_rpc_not_found` 경고, `adjust_waitlist_positions` 호출 실패 가능성
- **원인**: schema.sql에 해당 RPC 함수들 미정의
- **해결**:
  - `get_dormant_risk_users(three_months_ago, five_months_ago)` - 휴면 위험 회원 조회
  - `adjust_waitlist_positions(p_meeting_id, p_removed_position)` - 대기자 순번 조정
  - schema.sql에 두 함수 추가 완료

## 🧪 테스트 결과

### API 엔드포인트 테스트 (2026-01-17)

| API | 상태 | 응답 |
|-----|:----:|------|
| GET /api/cron/reminder | ✅ 200 | `{"success":true,"stats":{"total":0,"sent":0,"skipped":0,"failed":0}}` |
| GET /api/cron/waitlist | ✅ 200 | `{"success":true,"stats":{"expired":0,"notified":0}}` |
| GET /api/cron/monthly | ✅ 200 | `{"success":true,"stats":{"total":0,"sent":0}}` |
| GET /api/cron/segment-reminder | ✅ 200 | `{"success":true,"stats":{...}}` |
| GET /api/admin/notifications | ✅ 403 | 인증 필요 (정상 동작) |
| POST /api/admin/notifications | ✅ 403 | 인증 필요 (정상 동작) |

### 빌드 테스트

- **TypeScript 타입 체크**: ✅ 통과 (오류 없음)
- **프로덕션 빌드**: ✅ 성공
- **관리자 UI 페이지**: ✅ 빌드됨 (`/admin/notifications`)

## 🔙 롤백 방법

```bash
# 이전 커밋으로 롤백
git revert HEAD --no-edit
git push

# 또는 Vercel 롤백
vercel rollback
```

## 📋 다음 작업

- [ ] 솔라피 계정 생성 및 API 키 발급
- [ ] 카카오 비즈니스 채널 개설
- [ ] 알림톡 템플릿 등록 및 승인 (1~3일 소요)
- [ ] 실제 발송 테스트
- [ ] M4 소속감 기능 시작

## 🔗 참조 문서

- [WP-M3 알림시스템](/roadmap/work-packages/WP-M3-알림시스템.md)
- [SC-M3 알림시스템 시나리오](/roadmap/scenarios/SC-M3-알림시스템.md)
- [외부 서비스 설정](/docs/external-services.md)
