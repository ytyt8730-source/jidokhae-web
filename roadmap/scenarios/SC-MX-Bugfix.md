# Scenario: MX-Bugfix - 테스트 발견 이슈 수정

---

**Work Package:** WP-MX-Bugfix
**총 Scenario 수:** 21개
**작성일:** 2026-01-28

> ⚠️ **Note:** 이 시나리오는 **임시 문서**입니다. 모든 이슈가 해결되면 삭제됩니다.

---

## Phase 1: Critical 버그 수정

### Scenario MX-001: 대기 취소 버튼 표시

- **Given:** 사용자가 대기 상태로 등록된 모임 상세 페이지에 접속함
- **When:** 페이지가 로드됨
- **Then:** "대기 취소" 버튼이 표시됨 ("마감되었습니다" 대신)
- **선행 Scenario:** M2-035

---

### Scenario MX-002: 대기 취소 API 성공

- **Given:** 대기 상태 등록이 있음 (waitlists 테이블)
- **When:** DELETE `/api/waitlists/cancel` API 호출
- **Then:** 해당 waitlist 레코드가 삭제됨
- **선행 Scenario:** MX-001

---

### Scenario MX-003: 대기 취소 후 순번 재정렬

- **Given:** 대기 1번 사용자가 취소함
- **When:** 취소 처리 완료
- **Then:** 기존 2번 → 1번, 3번 → 2번으로 position 조정
- **선행 Scenario:** MX-002

---

### Scenario MX-004: 대기 취소 후 UI 업데이트

- **Given:** 대기 취소 API 성공
- **When:** 성공 응답 수신
- **Then:** "대기가 취소되었습니다" 메시지 표시, 페이지 상태 갱신
- **선행 Scenario:** MX-002

---

### Scenario MX-005: 입금대기 상태에서 취소 버튼 표시

- **Given:** 사용자가 입금대기(pending_transfer) 상태의 모임을 마이페이지에서 확인
- **When:** 해당 모임 상세로 이동
- **Then:** "취소하기" 버튼이 표시됨
- **선행 Scenario:** M5-046

---

### Scenario MX-006: 입금대기 취소 API 성공

- **Given:** 입금대기 상태의 registration이 있음
- **When:** 취소 API 호출
- **Then:** status='cancelled', current_participants -1
- **선행 Scenario:** MX-005

---

### Scenario MX-007: 입금대기 취소 시 환불 계좌 불필요

- **Given:** 입금대기 상태 (실제 결제 안 함)
- **When:** 취소 버튼 클릭
- **Then:** 환불 계좌 모달 표시 없이 바로 취소 처리
- **선행 Scenario:** MX-006

---

### Scenario MX-008: 참여 완료 트리거 동작 확인

- **Given:** 트리거가 생성됨
- **When:** participation_status를 'completed'로 UPDATE
- **Then:** users.total_participations가 +1 증가
- **선행 Scenario:** 없음 (DB)

---

### Scenario MX-009: 정기모임 참여 완료 시 날짜 갱신

- **Given:** 정기모임(meeting_type='regular') 참여 완료
- **When:** participation_status를 'completed'로 UPDATE
- **Then:** users.last_regular_meeting_at이 현재 시간으로 갱신
- **선행 Scenario:** MX-008

---

### Scenario MX-010: 토론모임 완료 시 날짜 갱신 안 함

- **Given:** 토론모임(meeting_type='discussion') 참여 완료
- **When:** participation_status를 'completed'로 UPDATE
- **Then:** users.last_regular_meeting_at은 변경되지 않음
- **선행 Scenario:** MX-008

---

## Phase 2: 기능 개선

### Scenario MX-011: 마이페이지 참여 완료 섹션 표시

- **Given:** 사용자가 참여 완료된 모임이 있음
- **When:** 마이페이지에 접속
- **Then:** "참여 완료" 섹션에 해당 모임들이 표시됨
- **선행 Scenario:** M2-043

---

### Scenario MX-012: 참여 완료 모임에서 칭찬하기 버튼

- **Given:** 참여 완료된 모임 카드가 표시됨
- **When:** 해당 카드 확인
- **Then:** "칭찬하기" 버튼이 표시됨
- **선행 Scenario:** MX-011

---

### Scenario MX-013: 참여 완료 모임에서 후기 쓰기 버튼

- **Given:** 참여 완료된 모임 카드가 표시됨
- **When:** 해당 카드 확인
- **Then:** "후기 쓰기" 버튼이 표시됨
- **선행 Scenario:** MX-011

---

### Scenario MX-014: 입금대기 목록 모임 필터 표시

- **Given:** 운영자가 `/admin/transfers`에 접속
- **When:** 페이지 로드
- **Then:** 모임별 필터 드롭다운이 표시됨
- **선행 Scenario:** M5-051

---

### Scenario MX-015: 모임 필터 선택 시 목록 필터링

- **Given:** 입금대기 목록에 여러 모임의 건이 있음
- **When:** 특정 모임을 필터 드롭다운에서 선택
- **Then:** 해당 모임의 입금대기 건만 표시됨
- **선행 Scenario:** MX-014

---

## Phase 3: UI/UX 수정

### Scenario MX-016: 토스페이 문구 제거 확인

- **Given:** 결제 모달이 열림
- **When:** 간편결제 탭 확인
- **Then:** 토스페이 관련 텍스트/아이콘이 표시되지 않음
- **선행 Scenario:** M5-040

---

### Scenario MX-017: 카카오페이만 표시

- **Given:** 결제 모달 간편결제 탭
- **When:** 결제 수단 확인
- **Then:** 카카오페이만 표시됨
- **선행 Scenario:** MX-016

---

### Scenario MX-018: 배너 관리 모바일 레이아웃 정상

- **Given:** 배너 관리 페이지에 접속 (360px 뷰포트)
- **When:** 페이지 로드
- **Then:** 레이아웃이 깨지지 않고 정상 표시됨
- **선행 Scenario:** M5-033

---

### Scenario MX-019: 배너 목록 카드형 표시 (모바일)

- **Given:** 360px 뷰포트에서 배너 관리 페이지
- **When:** 배너 목록 확인
- **Then:** 테이블 대신 카드형 레이아웃으로 표시됨
- **선행 Scenario:** MX-018

---

### Scenario MX-020: 콩 아이콘 색상 변경 확인

- **Given:** 모임 상세 페이지 참가비 영역
- **When:** 콩 아이콘 확인
- **Then:** 초록색 계열로 표시됨
- **선행 Scenario:** M1-024

---

### Scenario MX-021: 모든 콩 아이콘 일관된 색상

- **Given:** 서비스 전체에서 콩 아이콘 사용 위치
- **When:** 각 위치에서 아이콘 확인
- **Then:** 모든 위치에서 동일한 초록색으로 표시됨
- **선행 Scenario:** MX-020

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 (Critical) | 10 | 0 | 10 |
| Phase 2 (기능 개선) | 5 | 0 | 5 |
| Phase 3 (UI/UX) | 6 | 0 | 6 |
| **총계** | **21** | **0** | **21** |

---

## 배포 환경 검증 체크리스트

### 스테이징 환경

- [ ] 대기 취소 기능 동작 확인
- [ ] 입금대기 취소 기능 동작 확인
- [ ] 참여 완료 트리거 동작 확인
- [ ] 마이페이지 참여 완료 섹션 표시
- [ ] 토스페이 문구 제거 확인

### 프로덕션 환경

- [ ] DB 마이그레이션 완료
- [ ] API 배포 완료
- [ ] 프론트엔드 배포 완료
- [ ] 전체 시나리오 통과

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | SC-MX-Bugfix 최초 작성 |

