# Scenario: M5 - 운영자 도구

---

**Work Package:** WP-M5  
**총 Scenario 수:** 42개  
**작성일:** 2026-01-14

---

## Phase 1: 대시보드

### Scenario M5-001: 대시보드 페이지 접근 성공

- **Given:** 운영자(admin/super_admin)가 로그인됨
- **When:** `/admin/dashboard`에 접속함
- **Then:** 대시보드 레이아웃이 표시됨
- **선행 Scenario:** M1-033

---

### Scenario M5-002: 이번 달 참가 현황 표시

- **Given:** 이번 달에 확정 42건, 취소 5건이 있음
- **When:** 대시보드를 확인함
- **Then:** "확정: 42건, 취소: 5건"이 표시됨
- **선행 Scenario:** M2-014

---

### Scenario M5-003: 이번 달 수입 표시

- **Given:** 이번 달 결제 금액 합계가 420,000원임
- **When:** 대시보드를 확인함
- **Then:** "💰 수입: 420,000콩"이 표시됨
- **선행 Scenario:** M2-014

---

### Scenario M5-004: 환불 내역 표시

- **Given:** 이번 달 환불 금액 합계가 30,000원(3건)임
- **When:** 대시보드를 확인함
- **Then:** "🔄 환불: 30,000콩 (3건)"이 표시됨
- **선행 Scenario:** M2-024

---

### Scenario M5-005: 재참여율 표시

- **Given:** 이번 달 재참여 회원 비율이 68%임
- **When:** 대시보드를 확인함
- **Then:** "🔁 재참여율: 68%"가 표시됨
- **선행 Scenario:** M4-003

---

### Scenario M5-006: 세그먼트별 회원 수 표시

- **Given:** 회원 세그먼트가 계산됨
- **When:** 대시보드를 확인함
- **Then:** 신규/성장/충성/이탈위험 등 세그먼트별 회원 수가 표시됨
- **선행 Scenario:** M1-011

---

### Scenario M5-007: 모임별 현황 테이블 표시

- **Given:** 이번 달에 3개 모임이 있음
- **When:** 대시보드를 확인함
- **Then:** 모임명, 일시, 참가/정원, 상태가 테이블로 표시됨
- **선행 Scenario:** M1-035

---

### Scenario M5-008: 월 필터로 과거 데이터 조회

- **Given:** 대시보드가 표시됨
- **When:** 월 선택을 "2025년 12월"로 변경함
- **Then:** 12월 데이터가 로드되어 표시됨
- **선행 Scenario:** M5-001

---

### Scenario M5-009: 데이터 없는 월 조회

- **Given:** 2024년 1월에 데이터가 없음
- **When:** 해당 월을 선택함
- **Then:** 0건/0원 등 빈 상태가 정상 표시됨
- **선행 Scenario:** M5-008

---

### Scenario M5-010: 통계 API 응답 시간 확인

- **Given:** 대시보드 페이지 로드
- **When:** `/api/admin/stats` API가 호출됨
- **Then:** 3초 이내에 응답됨
- **선행 Scenario:** M5-001

---

## Phase 2: 알림 템플릿 관리

### Scenario M5-011: notification_templates 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** notification_templates 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 9개 기본 템플릿이 삽입됨
- **선행 Scenario:** M1-009

---

### Scenario M5-012: 템플릿 목록 화면 접근

- **Given:** 운영자가 로그인됨
- **When:** `/admin/templates`에 접속함
- **Then:** 모든 알림 템플릿 목록이 표시됨
- **선행 Scenario:** M5-011

---

### Scenario M5-013: 템플릿 문구 수정 성공

- **Given:** 템플릿 수정 화면에 접속함
- **When:** 문구를 수정하고 저장함
- **Then:** 변경된 문구가 저장되고 updated_at이 갱신됨
- **선행 Scenario:** M5-012

---

### Scenario M5-014: 변수 치환 미리보기 표시

- **Given:** 템플릿 수정 화면에서 문구를 입력함
- **When:** "미리보기" 버튼을 클릭함
- **Then:** #{회원명} → "김독서" 등 변수가 치환된 결과가 표시됨
- **선행 Scenario:** M5-013

---

### Scenario M5-015: 발송 on/off 토글 동작

- **Given:** 템플릿이 is_active=true 상태임
- **When:** 비활성화 토글을 클릭함
- **Then:** is_active=false로 변경되고 해당 알림은 발송되지 않음
- **선행 Scenario:** M5-012

---

### Scenario M5-016: 비활성화된 템플릿으로 알림 발송 안 됨

- **Given:** "휴면 위험" 템플릿이 비활성화됨
- **When:** 휴면 위험 알림 Cron이 실행됨
- **Then:** 해당 알림은 발송되지 않음
- **선행 Scenario:** M5-015

---

### Scenario M5-017: 발송 시점 변경 (3일 전 → 2일 전)

- **Given:** 리마인드 템플릿의 send_days_before가 3임
- **When:** 2로 변경하고 저장함
- **Then:** 이후 리마인드는 2일 전에 발송됨
- **선행 Scenario:** M5-013

---

### Scenario M5-018: 수정된 템플릿으로 알림 발송 확인

- **Given:** 템플릿 문구를 수정함
- **When:** 실제 알림이 발송됨
- **Then:** 수정된 문구로 알림톡이 발송됨
- **선행 Scenario:** M5-013, M3-011

---

## Phase 3: 권한 관리

### Scenario M5-019: admin_permissions 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** admin_permissions 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성됨
- **선행 Scenario:** M1-009

---

### Scenario M5-020: 운영자 목록 화면 접근 (super_admin)

- **Given:** super_admin이 로그인됨
- **When:** `/admin/permissions`에 접속함
- **Then:** 모든 운영자 목록과 권한 상태가 표시됨
- **선행 Scenario:** M5-019

---

### Scenario M5-021: 권한 관리 화면 접근 차단 (admin)

- **Given:** 일반 admin이 로그인됨
- **When:** `/admin/permissions`에 접속함
- **Then:** 403 Forbidden 또는 접근 불가 안내 표시
- **선행 Scenario:** M5-019

---

### Scenario M5-022: 다른 운영자에게 권한 부여

- **Given:** super_admin이 권한 관리 화면에 있음
- **When:** 특정 admin에게 "모임 관리" 권한을 부여함
- **Then:** admin_permissions 테이블에 기록됨
- **선행 Scenario:** M5-020

---

### Scenario M5-023: 권한별 체크박스 선택적 부여

- **Given:** 6개 권한 체크박스가 표시됨
- **When:** "대시보드 열람"만 체크하고 저장함
- **Then:** 해당 권한만 부여됨
- **선행 Scenario:** M5-022

---

### Scenario M5-024: 권한 없는 기능 접근 차단

- **Given:** admin에게 "배너 관리" 권한이 없음
- **When:** `/admin/banners`에 접속함
- **Then:** 403 Forbidden 표시
- **선행 Scenario:** M5-022

---

### Scenario M5-025: 부여된 권한으로 기능 접근 성공

- **Given:** admin에게 "모임 관리" 권한이 있음
- **When:** `/admin/meetings`에 접속함
- **Then:** 정상적으로 모임 관리 화면이 표시됨
- **선행 Scenario:** M5-022

---

### Scenario M5-026: 운영자 추가 (역할 변경)

- **Given:** 일반 회원이 있음
- **When:** super_admin이 해당 회원을 admin으로 변경함
- **Then:** users.role이 'admin'으로 변경됨
- **선행 Scenario:** M5-020

---

### Scenario M5-027: 운영자 삭제 (역할 변경)

- **Given:** admin이 있음
- **When:** super_admin이 해당 회원을 member로 변경함
- **Then:** users.role이 'member'로 변경되고 권한이 삭제됨
- **선행 Scenario:** M5-020

---

### Scenario M5-028: super_admin은 모든 권한 자동 보유

- **Given:** super_admin이 로그인됨
- **When:** hasPermission() 함수를 호출함
- **Then:** 모든 권한에 대해 true 반환
- **선행 Scenario:** M5-019

---

## Phase 4: 요청함 & 배너 관리

### Scenario M5-029: 요청함 목록 조회

- **Given:** suggestions 테이블에 문의가 3건 있음
- **When:** `/admin/requests`에 접속함
- **Then:** 3건의 문의가 목록으로 표시됨
- **선행 Scenario:** M4-022

---

### Scenario M5-030: 미답변/답변완료 상태 구분 표시

- **Given:** 2건 미답변, 1건 답변완료 상태
- **When:** 요청함 목록을 확인함
- **Then:** 미답변에 [미답변] 뱃지, 답변완료에 [답변완료] 뱃지 표시
- **선행 Scenario:** M5-029

---

### Scenario M5-031: 문의에 답변 작성 성공

- **Given:** 미답변 문의 상세 화면에 접속함
- **When:** 답변을 입력하고 저장함
- **Then:** answer, answered_by, answered_at이 저장되고 상태가 'answered'로 변경됨
- **선행 Scenario:** M5-029

---

### Scenario M5-032: banners 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** banners 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성됨
- **선행 Scenario:** M1-009

---

### Scenario M5-033: 배너 목록 화면 접근

- **Given:** 운영자가 로그인됨
- **When:** `/admin/banners`에 접속함
- **Then:** 등록된 배너 목록이 순서대로 표시됨
- **선행 Scenario:** M5-032

---

### Scenario M5-034: 배너 등록 성공

- **Given:** 배너 추가 버튼을 클릭함
- **When:** 제목, 이미지 URL을 입력하고 저장함
- **Then:** banners 테이블에 저장되고 목록에 표시됨
- **선행 Scenario:** M5-033

---

### Scenario M5-035: 배너 순서 드래그로 변경

- **Given:** 2개 이상의 배너가 있음
- **When:** 드래그로 순서를 변경함
- **Then:** position 값이 업데이트되어 새 순서가 반영됨
- **선행 Scenario:** M5-034

---

### Scenario M5-036: 배너 활성/비활성 토글

- **Given:** 활성 상태의 배너가 있음
- **When:** 비활성화 버튼을 클릭함
- **Then:** is_active=false로 변경되고 홈 화면에 표시되지 않음
- **선행 Scenario:** M5-034

---

### Scenario M5-037: 배너 삭제 성공

- **Given:** 등록된 배너가 있음
- **When:** 삭제 버튼을 클릭하고 확인함
- **Then:** banners 테이블에서 삭제됨
- **선행 Scenario:** M5-034

---

### Scenario M5-038: 홈 화면에 활성 배너 표시

- **Given:** 2개의 활성 배너, 1개의 비활성 배너가 있음
- **When:** 홈 화면에 접속함
- **Then:** 2개의 활성 배너만 슬라이드로 표시됨
- **선행 Scenario:** M5-034, M5-036

---

### Scenario M5-039: 배너 클릭 시 링크 이동

- **Given:** link_url이 설정된 배너가 표시됨
- **When:** 배너를 클릭함
- **Then:** 해당 URL로 이동함
- **선행 Scenario:** M5-038

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 | 9 | 1 | 10 |
| Phase 2 | 8 | 0 | 8 |
| Phase 3 | 9 | 1 | 10 |
| Phase 4 | 10 | 1 | 11 |
| **총계** | **36** | **3** | **39** |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | SC-M5 최초 작성 |

