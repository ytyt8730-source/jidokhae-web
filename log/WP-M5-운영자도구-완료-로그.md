# WP-M5 운영자도구 + 계좌이체 완료 로그

> **완료일**: 2026-01-21
> **작업 기간**: 2026-01-20 ~ 2026-01-21
> **브랜치**: main

---

## 1. 완료 내용

### Phase 1: 대시보드 + 계좌이체 결제

- 운영자 대시보드 (참가현황, 수입/환불, 재참여율, 세그먼트)
- 계좌이체 결제 방식 추가 (간편결제/계좌이체 선택)
- 입금대기 관리 (운영자 입금확인, 24시간 자동취소)
- 환불대기 관리 (환불계좌 수집, 환불완료 처리)
- 마이페이지 입금대기 상태 표시

### Phase 2: 알림 템플릿 관리

- 템플릿 목록 조회 (13개 템플릿)
- 템플릿 문구 수정 및 미리보기
- 발송 on/off 토글
- 발송 시점(N일 전) 변경

### Phase 3: 권한 관리

- 7개 권한 체계 (meeting_manage, payment_manage, notification_send, banner_manage, request_respond, dashboard_view, template_manage)
- 운영자 목록 및 권한 부여 (super_admin 전용)
- 운영자 추가/해제 (역할 변경)
- 권한별 접근 제어 (403 반환)

### Phase 4: 요청함 & 배너 관리

- 요청함 목록/상세/답변 (미답변/답변완료 구분)
- 배너 CRUD + 드래그 앤 드롭 순서 관리
- 배너 활성/비활성 토글
- 홈 화면 배너 슬라이드 표시

---

## 2. 주요 파일

| 구분 | 경로 |
|------|------|
| Phase 1 API | src/app/api/admin/stats, transfers, registrations |
| Phase 1 Pages | src/app/admin/DashboardClient, transfers |
| Phase 2 API | src/app/api/admin/templates |
| Phase 2 Pages | src/app/admin/templates |
| Phase 3 API | src/app/api/admin/permissions, users |
| Phase 3 Pages | src/app/admin/permissions |
| Phase 3 Utils | src/lib/permissions.ts, permissions-constants.ts |
| Phase 4 API | src/app/api/admin/requests, banners |
| Phase 4 Pages | src/app/admin/requests, banners |
| Phase 4 Components | src/components/BannerSlide.tsx |

---

## 3. 시나리오 검증 결과

| Phase | 시나리오 | 통과 |
|-------|---------|:----:|
| Phase 1 대시보드 | M5-001 ~ M5-010 | 10/10 |
| Phase 1 계좌이체 | M5-040 ~ M5-057 | 18/18 |
| Phase 2 템플릿 | M5-011 ~ M5-018 | 8/8 |
| Phase 3 권한 | M5-019 ~ M5-028 | 10/10 |
| Phase 4 요청함/배너 | M5-029 ~ M5-039 | 11/11 |
| **총계** | | **57/57** |

---

## 4. 이슈 및 해결

| 이슈 | 해결 |
|------|------|
| Client/Server import 충돌 | permissions-constants.ts 분리 (클라이언트/서버 공용) |
| 템플릿 LogService 타입 누락 | 'templates', 'admin' 타입 추가 |
| 계좌이체 정원 관리 | pending_transfer 상태에서 즉시 정원 차감 |
| 배너 외부 URL 이미지 | next/image 대신 img 태그 사용 (허용) |

---

## 5. 테스트 현황

| 항목 | 상태 |
|------|:----:|
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors |
| 프로덕션 빌드 | ✅ 성공 |
| 코드 품질 (as any, inline style) | ✅ 준수 |

---

## 6. 다음 단계

- M6: 랜딩페이지 & 런치 준비
- 후킹 랜딩페이지 (신규 회원 유치)
- SEO 최적화 및 메타 태그
- 최종 QA 및 배포 준비

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-21 | M5 전체 완료 (Phase 1~4) |
