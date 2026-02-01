# Beta 출시 전 종합 검증 계획

> **작성일**: 2026-02-01
> **목적**: Beta 출시 전 기능, 인프라, 비즈니스 로직의 완전성 검증

---

## Expert Panel (전문가 페르소나)

### 1. Dr. Maya Chen - QA Engineering Director
- **배경**: Google Test Engineering (8년) → Netflix Quality Platform Lead (5년)
- **전문**: Test Automation, Edge Case Analysis, Regression Testing, Performance Testing
- **인증**: ISTQB Advanced, Google Cloud Professional
- **철학**: "Every untested path is a bug waiting to happen."
- **검토 영역**: 기능 테스트, 엣지 케이스, 에러 핸들링, 데이터 무결성

### 2. Alex Rivera - Principal DevOps Engineer
- **배경**: AWS Solutions Architect (6년) → Stripe Infrastructure Lead (4년)
- **전문**: CI/CD, Security, Monitoring, Disaster Recovery, Database Operations
- **인증**: AWS Solutions Architect Pro, Kubernetes CKA/CKAD
- **철학**: "If it's not automated and monitored, it doesn't exist."
- **검토 영역**: 배포 파이프라인, 환경 변수, 보안, 모니터링, 백업

### 3. Sarah Park - VP of Product
- **배경**: Airbnb Product (5년) → Toss Product Strategy Lead (4년)
- **전문**: User Journey, Business Logic, KPI Definition, Launch Readiness
- **인증**: Pragmatic Marketing, Google Analytics
- **철학**: "Ship fast, but never compromise on user trust."
- **검토 영역**: PRD 충족도, 사용자 플로우, 비즈니스 규칙, 출시 체크리스트

---

## Phase 1: QA 검토 (Dr. Maya Chen)

### 1.1 핵심 기능 테스트

| ID | 테스트 항목 | 목적 | 우선순위 |
|----|------------|------|----------|
| QA-001 | 회원가입 플로우 | 신규 사용자 온보딩 정상 동작 | P0 |
| QA-002 | 로그인/로그아웃 | 인증 플로우 정상 동작 | P0 |
| QA-003 | 모임 목록 조회 | 데이터 로딩 및 표시 | P0 |
| QA-004 | 모임 상세 페이지 | 상세 정보 표시 및 CTA | P0 |
| QA-005 | 결제 플로우 (카카오페이) | 정상 결제 완료 | P0 |
| QA-006 | 결제 플로우 (계좌이체) | 입금 대기 → 확인 플로우 | P0 |
| QA-007 | 취소/환불 플로우 | 규정별 환불 처리 | P0 |
| QA-008 | 대기 신청 | 마감 모임 대기 등록 | P1 |
| QA-009 | 마이페이지 | 프로필, 신청 내역, 배지 | P1 |
| QA-010 | Realtime 참가 인원 | 실시간 업데이트 확인 | P1 |

### 1.2 엣지 케이스 테스트

| ID | 테스트 항목 | 시나리오 | 예상 결과 |
|----|------------|----------|----------|
| EC-001 | 동시 신청 | 2명이 마지막 1자리 동시 신청 | 1명만 성공, 1명은 에러 |
| EC-002 | 결제 중 마감 | 결제 진행 중 정원 마감 | 결제 취소 + 안내 메시지 |
| EC-003 | 네트워크 끊김 | 결제 완료 직전 연결 끊김 | 웹훅으로 상태 복구 |
| EC-004 | 중복 결제 시도 | 같은 모임 2번 결제 시도 | 중복 방지 에러 |
| EC-005 | 환불 경계값 | D-3 00:00:00 정각 취소 | 100% 환불 |
| EC-006 | 입금 기한 초과 | 계좌이체 24시간 미입금 | 자동 취소 |
| EC-007 | 대기 → 승격 | 취소 발생 시 대기자 승격 | 순서대로 알림 발송 |
| EC-008 | 세션 만료 | 결제 중 세션 만료 | 재로그인 유도 |

### 1.3 데이터 무결성 테스트

| ID | 테스트 항목 | 검증 내용 |
|----|------------|----------|
| DI-001 | 참가자 수 정합성 | registrations 수 = current_participants |
| DI-002 | 결제 금액 일치 | payment_amount = meeting.fee |
| DI-003 | 환불 금액 정확성 | 규정별 환불율 적용 확인 |
| DI-004 | 대기 순서 | waitlist position 순차적 |
| DI-005 | 트리거 동작 | INSERT/UPDATE 트리거 정상 |

---

## Phase 2: DevOps 검토 (Alex Rivera)

### 2.1 환경 설정 검증

| ID | 검증 항목 | 체크리스트 |
|----|----------|-----------|
| ENV-001 | 필수 환경 변수 | Supabase, PortOne, Solapi 키 설정 |
| ENV-002 | Sentry 연동 | DSN, Org, Project 설정 |
| ENV-003 | 도메인 설정 | NEXT_PUBLIC_APP_URL 프로덕션 값 |
| ENV-004 | 웹훅 시크릿 | PORTONE_WEBHOOK_SECRET 설정 |
| ENV-005 | CORS 설정 | 허용 도메인 확인 |

### 2.2 보안 검증

| ID | 검증 항목 | 위험도 | 검증 방법 |
|----|----------|--------|----------|
| SEC-001 | API 키 노출 | Critical | 클라이언트 번들 검사 |
| SEC-002 | RLS 정책 | Critical | 직접 DB 쿼리 테스트 |
| SEC-003 | 인증 우회 | Critical | 토큰 없이 API 호출 |
| SEC-004 | SQL Injection | High | 특수문자 입력 테스트 |
| SEC-005 | XSS | High | 스크립트 인젝션 테스트 |
| SEC-006 | CSRF | Medium | 크로스 사이트 요청 테스트 |

### 2.3 모니터링 검증

| ID | 검증 항목 | 확인 내용 |
|----|----------|----------|
| MON-001 | Sentry 에러 캡처 | 테스트 에러 Sentry 도달 |
| MON-002 | 로그 레벨 | 프로덕션 INFO 이상만 |
| MON-003 | 알림 설정 | 에러 발생 시 알림 |

### 2.4 데이터베이스 검증

| ID | 검증 항목 | 확인 내용 |
|----|----------|----------|
| DB-001 | 인덱스 확인 | 쿼리 성능용 인덱스 존재 |
| DB-002 | 마이그레이션 | 스키마 최신 상태 |
| DB-003 | 백업 설정 | Supabase 자동 백업 활성화 |
| DB-004 | RPC 함수 | check_and_reserve_capacity 존재 |

---

## Phase 3: PM 검토 (Sarah Park)

### 3.1 PRD 충족도 검증

| ID | PRD 요구사항 | 구현 상태 | 검증 방법 |
|----|-------------|----------|----------|
| PRD-001 | 3-Click 신청 | 확인 필요 | 클릭 수 카운트 |
| PRD-002 | Bottom Sheet 패턴 | 확인 필요 | UI 동작 확인 |
| PRD-003 | 마음 돌리기 UI | 구현됨 | 설득 요소 표시 확인 |
| PRD-004 | Realtime 참가 인원 | 구현됨 | 실시간 업데이트 확인 |
| PRD-005 | 환불 규정 표시 | 확인 필요 | 취소 화면에서 확인 |
| PRD-006 | 콩 화폐 단위 | 확인 필요 | 전체 UI에서 확인 |
| PRD-007 | No-Emoji 정책 | 확인 필요 | 전체 UI 스캔 |

### 3.2 사용자 플로우 검증

| ID | 플로우 | 테스트 시나리오 |
|----|--------|----------------|
| UX-001 | 신규 회원 첫 신청 | 가입 → 로그인 → 모임 선택 → 결제 |
| UX-002 | 기존 회원 신청 | 로그인 → 모임 선택 → 결제 |
| UX-003 | 취소 플로우 | 마이페이지 → 신청 내역 → 취소 |
| UX-004 | 대기 신청 | 마감 모임 → 대기 등록 |
| UX-005 | 모바일 경험 | 360px 화면에서 전체 플로우 |

### 3.3 비즈니스 규칙 검증

| ID | 규칙 | 검증 내용 |
|----|------|----------|
| BIZ-001 | 정기모임 환불 | 3일 전 100%, 2일 전 50%, 이후 0% |
| BIZ-002 | 토론모임 환불 | 2주 전 100%, 7일 전 50%, 이후 0% |
| BIZ-003 | 참여 자격 | 6개월 내 정기모임 참여 필요 |
| BIZ-004 | 대기 순서 | 신청 순서대로 승격 |
| BIZ-005 | 입금 기한 | 24시간 내 미입금 시 자동 취소 |

---

## 검증 스크립트

### 자동화 테스트 스크립트
- `scripts/test-critical-flows.ts` - 핵심 플로우 자동 테스트
- `scripts/test-edge-cases.ts` - 엣지 케이스 테스트
- `scripts/check-env.ts` - 환경 변수 검증
- `scripts/security-scan.ts` - 보안 취약점 스캔
- `scripts/data-integrity.ts` - 데이터 무결성 검사

### 수동 테스트 체크리스트
- `docs/manual-test-checklist.md` - 수동 테스트 항목

---

## 실행 계획

```
┌─────────────────────────────────────────────────────────────┐
│                    Beta 검증 실행 계획                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: QA 검토 (Dr. Maya Chen)                           │
│  ├─ 1.1 핵심 기능 테스트 스크립트 실행                         │
│  ├─ 1.2 엣지 케이스 수동 테스트                               │
│  └─ 1.3 데이터 무결성 검사                                    │
│                                                             │
│  Phase 2: DevOps 검토 (Alex Rivera)                         │
│  ├─ 2.1 환경 변수 검증 스크립트 실행                          │
│  ├─ 2.2 보안 스캔 실행                                       │
│  └─ 2.3 모니터링 설정 확인                                    │
│                                                             │
│  Phase 3: PM 검토 (Sarah Park)                              │
│  ├─ 3.1 PRD 체크리스트 검토                                  │
│  ├─ 3.2 사용자 플로우 워크스루                                │
│  └─ 3.3 비즈니스 규칙 검증                                    │
│                                                             │
│  Phase 4: 통합 리포트                                        │
│  ├─ 발견된 이슈 정리                                         │
│  ├─ 심각도별 분류                                            │
│  └─ 액션 아이템 도출                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 성공 기준

| 영역 | 기준 | 목표 |
|------|------|------|
| QA | Critical 버그 | 0개 |
| QA | High 버그 | 0개 |
| QA | Medium 버그 | 3개 이하 |
| DevOps | 보안 취약점 | 0개 |
| DevOps | 환경 설정 누락 | 0개 |
| PM | PRD 충족도 | 95% 이상 |
| PM | Critical UX 이슈 | 0개 |

---

*작성: Claude Code*
*검토 예정: 2026-02-01*
