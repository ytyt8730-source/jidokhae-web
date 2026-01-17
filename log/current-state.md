# 현재 작업 상태 (AI 에이전트용)

> **마지막 업데이트**: 2026-01-17
> **버전**: 1.2

---

## 📌 현재 상태 요약

| 항목 | 값 |
|------|-----|
| 완료된 WP | M1 기반구축, M2 핵심결제흐름, M3 알림시스템 |
| 다음 WP | **M4 소속감** |
| 블로커 | 솔라피 계정 설정 필요 (M3 실발송 전) |

---

## ✅ 마지막 완료 작업

### WP-M3 알림시스템 (2026-01-17 완료)

**코드 구현**: 4개 Phase 전체 완료
- Phase 1: 알림 서비스 추상화 (솔라피/Mock 어댑터)
- Phase 2: 모임 리마인드 자동화 (3일/1일/당일)
- Phase 3: 대기자 알림 (자리 발생, 기한 만료)
- Phase 4: 세그먼트별/월말 알림 + 운영자 수동 발송

**주요 구현 내용**:
- ✅ NotificationService 인터페이스 (추후 NHN Cloud 등 교체 용이)
- ✅ Vercel Cron 4개 스케줄 설정
- ✅ 관리자 알림 발송 UI
- ✅ notification_logs 테이블 로깅
- ✅ 중복 발송 방지 로직

**테스트 현황**:

| 항목 | 상태 | 비고 |
|------|:----:|------|
| TypeScript 타입 체크 | ✅ | 오류 없음 |
| 프로덕션 빌드 | ✅ | 성공 |
| Cron API 호출 | ✅ | 4개 모두 200 OK |
| 관리자 API 인증 | ✅ | 403 정상 반환 |
| 실제 알림톡 발송 | ⬜ | 솔라피 설정 필요 |

---

## 🔜 다음 작업

### M3 실발송 전 필요 작업 (영탁 담당)

1. **Supabase RPC 함수 배포**
   ```sql
   -- SQL Editor에서 실행 필요
   -- get_dormant_risk_users
   -- adjust_waitlist_positions
   ```

2. **솔라피 설정**
   - [ ] 솔라피 계정 생성 (https://solapi.com)
   - [ ] API 키 발급 → `.env.local`에 추가
   - [ ] 카카오 비즈니스 채널 개설
   - [ ] 알림톡 템플릿 등록 및 승인 (1~3일)

### WP-M4 소속감 기능

**구현 예정**:
- 칭찬하기 (모임 후 다른 멤버에게)
- 배지 시스템 (참여 횟수, 연속 참석 등)
- 내 책장 (읽은 책 기록)

---

## 🟢 해결된 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| RLS 무한 재귀 | policy 내 자기 참조 | `auth.uid() = id` 단순화 |
| 포트원 Store ID 오류 | V1 코드 사용 | V2 Store ID로 변경 |
| logger.startTimer 타입 | 반환 타입 미정의 | TimerResult 인터페이스 추가 |
| AUTH_FORBIDDEN 미존재 | ErrorCode 미정의 | 1009 코드 추가 |
| RPC 함수 누락 | schema.sql 미포함 | get_dormant_risk_users, adjust_waitlist_positions 추가 |

---

## 🟡 알려진 주의사항

1. **포트 충돌**: 3000 사용 중이면 3001/3003으로 자동 변경 → Redirect URI 등록 필요
2. **PC 결제 제한**: 카카오페이 PC에서 QR 스캔 필요, 모바일은 자동 연결
3. **Mock 알림**: 개발 환경에서는 실제 발송 없이 로그만 기록

---

## 📁 최근 수정 파일

### M3 핵심 파일
- `src/lib/notification/` - 알림 서비스 모듈 (types, solapi, index)
- `src/lib/reminder.ts` - 모임 리마인드 로직
- `src/lib/waitlist-notification.ts` - 대기자 알림 로직
- `src/lib/segment-notification.ts` - 세그먼트별 알림 로직
- `src/app/api/cron/` - Cron API 엔드포인트 4개
- `src/app/api/admin/notifications/` - 관리자 알림 API
- `src/app/admin/notifications/` - 관리자 알림 UI
- `vercel.json` - Cron 스케줄 설정
- `supabase/schema.sql` - RPC 함수 추가

### 환경 설정 (필요)
- `.env.local` - 솔라피 API 키 추가 예정

---

## 🔗 참조 문서

- [WP-M3 완료 로그](/log/WP-M3-알림시스템-완료-로그.md)
- [외부 서비스 설정](/docs/external-services.md)
- [환경 변수](/docs/env-variables.md)
- [WP-M4 소속감](/roadmap/work-packages/WP-M4-소속감.md)

---

## 환경 정보

| 항목 | 값 |
|------|-----|
| Next.js | 14.2.x |
| Supabase | njaavwosjwndtwnjovac |
| 포트원 | V2 API |
| 솔라피 | 미설정 (Mock 사용 중) |
| 배포 | 미배포 (개발 중) |
