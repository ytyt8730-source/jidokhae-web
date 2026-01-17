# Scenario: M3 - 알림 시스템

---

**Work Package:** WP-M3  
**총 Scenario 수:** 38개 (기존 34개 + 세그먼트별 알림 4개)  
**작성일:** 2026-01-14

---

## Phase 1: 알림 인프라 구축 (솔라피)

### Scenario M3-001: 솔라피 API 키 설정

- **Given:** 솔라피 계정이 생성됨
- **When:** API 키를 환경 변수에 설정함
- **Then:** 환경 변수에서 API 키를 정상적으로 읽을 수 있음
- **선행 Scenario:** 없음

---

### Scenario M3-002: 카카오 비즈니스 채널 연동

- **Given:** 카카오 비즈니스 채널이 있음, 솔라피 계정이 있음
- **When:** 솔라피에서 카카오 채널을 연동함
- **Then:** 알림톡 발송 권한이 활성화됨
- **선행 Scenario:** M3-001

---

### Scenario M3-003: 알림톡 템플릿 등록 및 승인 (카카오)

- **Given:** 카카오 비즈니스 채널이 연동됨
- **When:** 모임 리마인드 템플릿을 등록하고 카카오 승인을 요청함
- **Then:** 템플릿이 승인되어 발송 가능 상태가 됨
- **선행 Scenario:** M3-002

---

### Scenario M3-004: 알림 서비스 추상화 레이어 구현

- **Given:** `/lib/notification/` 폴더가 있음
- **When:** NotificationService 인터페이스와 SolapiAdapter를 구현함
- **Then:** getNotificationService()로 서비스를 주입받을 수 있음
- **선행 Scenario:** M1-003

---

### Scenario M3-005: notification_logs 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** notification_logs 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 발송 기록을 저장할 수 있음
- **선행 Scenario:** M1-009

---

### Scenario M3-006: 테스트 알림 발송 성공

- **Given:** 솔라피 연동 완료, 승인된 템플릿 있음
- **When:** 테스트 번호로 알림톡을 발송함
- **Then:** 알림톡이 정상 수신되고 notification_logs에 기록됨
- **선행 Scenario:** M3-003, M3-005

---

### Scenario M3-007: 알림 발송 실패 (잘못된 전화번호)

- **Given:** 솔라피 연동 완료
- **When:** 잘못된 형식의 전화번호로 알림톡을 발송함
- **Then:** 실패 로그가 notification_logs에 status='failed'로 기록됨
- **선행 Scenario:** M3-006

---

### Scenario M3-008: 알림 발송 실패 (API 키 오류)

- **Given:** 잘못된 솔라피 API 키가 설정됨
- **When:** 알림톡 발송을 시도함
- **Then:** 인증 오류가 발생하고 에러가 로깅됨
- **선행 Scenario:** M3-001

---

## Phase 2: 모임 리마인드 자동화

### Scenario M3-009: Vercel Cron 설정 확인

- **Given:** vercel.json에 cron 스케줄이 설정됨
- **When:** Vercel에 배포함
- **Then:** Cron job이 활성화되고 스케줄 확인 가능
- **선행 Scenario:** M1-006

---

### Scenario M3-010: 3일 전 리마인드 대상 조회

- **Given:** 3일 후에 모임이 있고, confirmed 상태 신청자가 있음
- **When:** getReminderTargets(3)을 호출함
- **Then:** 해당 모임의 신청자 목록이 반환됨
- **선행 Scenario:** M2-014

---

### Scenario M3-011: 3일 전 리마인드 발송 성공

- **Given:** 3일 전 리마인드 대상이 있음
- **When:** 오전 7시에 Cron이 실행됨
- **Then:** 대상자에게 알림톡이 발송되고 로그에 기록됨
- **선행 Scenario:** M3-010

---

### Scenario M3-012: 1일 전 리마인드 발송 성공

- **Given:** 1일 후에 모임이 있는 신청자가 있음
- **When:** 오전 7시에 Cron이 실행됨
- **Then:** 1일 전 템플릿으로 알림톡이 발송됨
- **선행 Scenario:** M3-011

---

### Scenario M3-013: 당일 리마인드 발송 성공

- **Given:** 오늘 모임이 있는 신청자가 있음
- **When:** 오전 7시에 Cron이 실행됨
- **Then:** 당일 템플릿으로 알림톡이 발송됨
- **선행 Scenario:** M3-011

---

### Scenario M3-014: 중복 발송 방지 (같은 건)

- **Given:** 3일 전 리마인드가 이미 발송됨
- **When:** Cron이 다시 실행됨
- **Then:** 동일한 user_id + meeting_id + notification_type에 대해 재발송하지 않음
- **선행 Scenario:** M3-011

---

### Scenario M3-015: 리마인드 대상 없음 처리

- **Given:** 3일 후에 모임이 없음
- **When:** Cron이 실행됨
- **Then:** 에러 없이 0건 처리 완료
- **선행 Scenario:** M3-010

---

### Scenario M3-016: 발송 결과 로깅 (성공)

- **Given:** 알림톡 발송이 성공함
- **When:** notification_logs를 확인함
- **Then:** status='sent', message_id, sent_at이 기록됨
- **선행 Scenario:** M3-011

---

### Scenario M3-017: 발송 결과 로깅 (실패)

- **Given:** 알림톡 발송이 실패함
- **When:** notification_logs를 확인함
- **Then:** status='failed', error_message가 기록됨
- **선행 Scenario:** M3-007

---

## Phase 3: 대기자 알림 자동화

### Scenario M3-018: 취소 시 대기자에게 자동 알림 발송

- **Given:** 모임에 대기자가 있음, 기존 신청자가 취소함
- **When:** 취소 처리가 완료됨
- **Then:** 1순위 대기자에게 "자리가 생겼어요" 알림 발송됨
- **선행 Scenario:** M2-030, M2-034

---

### Scenario M3-019: 응답 대기 시간 계산 - 3일 전 이전 (24시간)

- **Given:** 모임까지 5일 남음
- **When:** 대기자에게 알림이 발송됨
- **Then:** response_deadline이 현재 시각 + 24시간으로 설정됨
- **선행 Scenario:** M3-018

---

### Scenario M3-020: 응답 대기 시간 계산 - 3일~1일 전 (6시간)

- **Given:** 모임까지 2일 남음
- **When:** 대기자에게 알림이 발송됨
- **Then:** response_deadline이 현재 시각 + 6시간으로 설정됨
- **선행 Scenario:** M3-018

---

### Scenario M3-021: 응답 대기 시간 계산 - 1일 전 이후 (2시간)

- **Given:** 모임까지 12시간 남음
- **When:** 대기자에게 알림이 발송됨
- **Then:** response_deadline이 현재 시각 + 2시간으로 설정됨
- **선행 Scenario:** M3-018

---

### Scenario M3-022: 대기자 상태 업데이트 (notified)

- **Given:** 대기자에게 알림이 발송됨
- **When:** waitlists를 확인함
- **Then:** status='notified', notified_at, response_deadline이 설정됨
- **선행 Scenario:** M3-018

---

### Scenario M3-023: 응답 기한 초과 체크 Cron 실행

- **Given:** 대기자가 notified 상태, response_deadline이 지남
- **When:** 매시간 Cron이 실행됨
- **Then:** 해당 대기자는 expired 처리됨
- **선행 Scenario:** M3-022

---

### Scenario M3-024: 응답 기한 초과 시 다음 대기자 알림

- **Given:** 1순위 대기자가 expired 처리됨, 2순위 대기자가 있음
- **When:** Cron이 실행됨
- **Then:** 2순위 대기자에게 알림이 발송되고 1순위가 됨
- **선행 Scenario:** M3-023

---

### Scenario M3-025: 대기자 없는 상태에서 취소

- **Given:** 모임에 대기자가 없음
- **When:** 신청자가 취소함
- **Then:** 대기자 알림 로직이 실행되지 않고 정상 완료됨
- **선행 Scenario:** M2-030

---

### Scenario M3-026: 대기자가 기한 내 결제 완료

- **Given:** 대기자가 알림을 받고 결제함
- **When:** 결제가 완료됨
- **Then:** waitlists에서 삭제, registrations에 confirmed로 기록됨
- **선행 Scenario:** M3-018

---

## Phase 4: 월말 독려 & 세그먼트별 알림 & 운영자 수동 발송

### Scenario M3-027: 월말 독려 대상 조회

- **Given:** 이번 달에 신청한 모임이 없는 회원이 있음
- **When:** getMonthlyReminderTargets()을 호출함
- **Then:** 해당 회원 목록이 반환됨
- **선행 Scenario:** M2-014

---

### Scenario M3-028: 월말 독려 알림 자동 발송

- **Given:** 매월 25일, 미신청 회원이 있음
- **When:** monthly Cron이 실행됨
- **Then:** 대상자에게 "이번 달 모임은 어떠세요?" 알림 발송됨
- **선행 Scenario:** M3-027

---

### Scenario M3-029: 이번 달 신청한 회원 제외

- **Given:** 회원이 이번 달에 이미 모임을 신청함
- **When:** 월말 독려 대상을 조회함
- **Then:** 해당 회원은 대상에서 제외됨
- **선행 Scenario:** M3-027

---

### Scenario M3-030: 운영자 수동 알림 발송 화면 접근

- **Given:** 운영자가 로그인됨
- **When:** `/admin/notifications`에 접속함
- **Then:** 수동 알림 발송 화면이 표시됨
- **선행 Scenario:** M1-033

---

### Scenario M3-031: 운영자 수동 알림 - 전체 회원 발송

- **Given:** 운영자가 수동 발송 화면에서 "전체 회원" 선택
- **When:** 메시지를 입력하고 발송 버튼을 클릭함
- **Then:** 전체 회원에게 알림이 발송되고 기록됨
- **선행 Scenario:** M3-030

---

### Scenario M3-032: 운영자 수동 알림 - 특정 모임 참가자

- **Given:** 운영자가 특정 모임 참가자를 선택함
- **When:** 메시지를 입력하고 발송 버튼을 클릭함
- **Then:** 해당 모임 참가자에게만 알림이 발송됨
- **선행 Scenario:** M3-030

---

### Scenario M3-033: 운영자 수동 알림 - 발송 기록 확인

- **Given:** 수동 알림이 발송됨
- **When:** 운영자가 발송 이력을 조회함
- **Then:** 발송 시각, 대상 수, 성공/실패 수가 표시됨
- **선행 Scenario:** M3-031

---

### Scenario M3-034: 운영자 권한 없이 수동 발송 시도

- **Given:** notification_send 권한이 없는 admin이 로그인됨
- **When:** 수동 알림 발송을 시도함
- **Then:** 403 Forbidden 또는 권한 없음 메시지 표시
- **선행 Scenario:** M1-034

---

### Scenario M3-035: 온보딩 이탈 위험 회원 조회

- **Given:** 첫 정기모임 참여 완료 후 45일이 경과하고 두 번째 참여가 없는 회원이 있음
- **When:** 세그먼트별 리마인드 Cron이 실행됨
- **Then:** 해당 회원이 온보딩 이탈 위험 대상으로 조회됨
- **선행 Scenario:** M4-003

---

### Scenario M3-036: 휴면 위험 회원 알림 발송

- **Given:** 마지막 참여 완료 후 3개월이 경과한 회원이 있음
- **When:** 세그먼트별 리마인드 Cron이 실행됨
- **Then:** 해당 회원에게 "지독해가 그리워요" 복귀 유도 알림 발송
- **선행 Scenario:** M3-035

---

### Scenario M3-037: 자격 만료 임박 회원 알림 발송

- **Given:** 마지막 정기모임 참여 완료 후 5개월이 경과한 회원이 있음
- **When:** 세그먼트별 리마인드 Cron이 실행됨
- **Then:** 해당 회원에게 "자격이 곧 만료돼요" 긴급 복귀 유도 알림 발송
- **선행 Scenario:** M3-035

---

### Scenario M3-038: 리마인드 우선순위 적용 (중복 방지)

- **Given:** 같은 회원이 "자격 만료 임박"과 "휴면 위험" 조건을 모두 충족함
- **When:** 세그먼트별 리마인드 Cron이 실행됨
- **Then:** 우선순위가 높은 "자격 만료 임박" 알림만 발송됨 (중복 발송 없음)
- **선행 Scenario:** M3-037

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 | 6 | 2 | 8 |
| Phase 2 | 8 | 1 | 9 |
| Phase 3 | 8 | 1 | 9 |
| Phase 4 | 11 | 1 | 12 |
| **총계** | **33** | **5** | **38** |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | SC-M3 최초 작성 |
| 2026-01-14 | 1.1 | 세그먼트별 알림 Scenario 4개 추가 (M3-035~M3-038) |

