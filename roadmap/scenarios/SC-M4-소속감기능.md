# Scenario: M4 - 소속감 기능

---

**Work Package:** WP-M4  
**총 Scenario 수:** 52개  
**작성일:** 2026-01-14

---

## Phase 1: 참여 완료 시스템

### Scenario M4-001: 모임 종료 3일 후 알림 발송

- **Given:** 3일 전에 종료된 모임이 있고, confirmed 상태 신청자가 있음
- **When:** post-meeting Cron이 실행됨
- **Then:** "어떠셨어요?" 알림이 발송됨
- **선행 Scenario:** M2-014, M3-006

---

### Scenario M4-002: 참여 완료 선택 화면 표시

- **Given:** 알림톡의 링크를 클릭함
- **When:** `/meetings/[id]/feedback` 페이지가 로드됨
- **Then:** [칭찬하기], [참여했어요], [후기 남기기] 3가지 선택지가 표시됨
- **선행 Scenario:** M4-001

---

### Scenario M4-003: [참여했어요] 선택 시 참여 완료 처리

- **Given:** 참여 완료 선택 화면이 표시됨
- **When:** [참여했어요] 버튼을 클릭함
- **Then:** participation_status='completed', participation_method='confirm'으로 업데이트됨
- **선행 Scenario:** M4-002

---

### Scenario M4-004: [칭찬하기] 선택 시 참여 완료 + 칭찬 화면 이동

- **Given:** 참여 완료 선택 화면이 표시됨
- **When:** [칭찬하기] 버튼을 클릭함
- **Then:** 참여 완료 처리 후 칭찬하기 화면(`/meetings/[id]/praise`)으로 이동
- **선행 Scenario:** M4-002

---

### Scenario M4-005: [후기 남기기] 선택 시 참여 완료 + 후기 화면 이동

- **Given:** 참여 완료 선택 화면이 표시됨
- **When:** [후기 남기기] 버튼을 클릭함
- **Then:** 참여 완료 처리 후 후기 작성 화면(`/meetings/[id]/review`)으로 이동
- **선행 Scenario:** M4-002

---

### Scenario M4-006: 7일 미응답 시 자동 참여 완료 처리

- **Given:** 알림 발송 후 7일이 경과됨, 아무 응답 없음
- **When:** auto-complete Cron이 실행됨
- **Then:** participation_status='completed', participation_method='auto'로 업데이트됨
- **선행 Scenario:** M4-001

---

### Scenario M4-007: 운영자 노쇼 처리

- **Given:** 운영자가 참가자 목록을 확인함
- **When:** 특정 회원을 "미참여"로 처리함
- **Then:** participation_status='no_show', participation_method='admin'으로 업데이트됨
- **선행 Scenario:** M2-014

---

### Scenario M4-008: 이미 참여 완료된 건 중복 처리 방지

- **Given:** 이미 participation_status='completed'인 상태
- **When:** 다시 선택 화면에 접근함
- **Then:** "이미 처리된 모임입니다" 안내 표시
- **선행 Scenario:** M4-003

---

## Phase 2: 칭찬하기 & 후기

### Scenario M4-009: praises 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** praises 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 UNIQUE 제약조건이 적용됨
- **선행 Scenario:** M1-009

---

### Scenario M4-010: 칭찬하기 화면 - 참가자 목록 표시

- **Given:** 칭찬하기 화면에 접속함
- **When:** 페이지가 로드됨
- **Then:** 같은 모임 참가자 목록이 표시됨 (본인 제외)
- **선행 Scenario:** M4-004

---

### Scenario M4-011: 칭찬 문구 5개 선택 가능

- **Given:** 칭찬하기 화면에서 참가자를 선택함
- **When:** 문구 선택 영역을 확인함
- **Then:** 5개 선택형 문구가 라디오 버튼으로 표시됨
- **선행 Scenario:** M4-010

---

### Scenario M4-012: 칭찬 저장 성공

- **Given:** 참가자와 문구를 선택함
- **When:** [칭찬 보내기] 버튼을 클릭함
- **Then:** praises 테이블에 기록되고 완료 메시지 표시됨
- **선행 Scenario:** M4-011

---

### Scenario M4-013: 칭찬 후 수신자 누적 칭찬 수 증가

- **Given:** 칭찬이 저장됨
- **When:** 수신자의 users 테이블을 확인함
- **Then:** total_praises_received가 +1 증가함
- **선행 Scenario:** M4-012

---

### Scenario M4-014: 모임당 1명만 칭찬 가능 (중복 시도)

- **Given:** 이미 해당 모임에서 칭찬을 보냄
- **When:** 다시 칭찬하기를 시도함
- **Then:** "이 모임에서 이미 칭찬을 보냈습니다" 에러 표시
- **선행 Scenario:** M4-012

---

### Scenario M4-015: 같은 사람에게 3개월 내 중복 칭찬 불가

- **Given:** 1개월 전에 같은 사람에게 칭찬을 보냄
- **When:** 다른 모임에서 같은 사람에게 칭찬을 시도함
- **Then:** "최근 3개월 내 이미 칭찬한 회원입니다" 에러 표시
- **선행 Scenario:** M4-012

---

### Scenario M4-016: 3개월 지난 후 같은 사람 칭찬 가능

- **Given:** 4개월 전에 같은 사람에게 칭찬을 보냄
- **When:** 다른 모임에서 같은 사람에게 칭찬을 시도함
- **Then:** 정상적으로 칭찬이 저장됨
- **선행 Scenario:** M4-015

---

### Scenario M4-017: reviews 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** reviews 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 UNIQUE 제약조건이 적용됨
- **선행 Scenario:** M1-009

---

### Scenario M4-018: 후기 작성 화면 표시

- **Given:** 후기 남기기 화면에 접속함
- **When:** 페이지가 로드됨
- **Then:** 텍스트 입력 필드와 공개 동의 체크박스가 표시됨
- **선행 Scenario:** M4-005

---

### Scenario M4-019: 후기 저장 성공 (공개 미동의)

- **Given:** 후기를 작성하고 공개 동의는 체크하지 않음
- **When:** 저장 버튼을 클릭함
- **Then:** reviews 테이블에 is_public=false로 저장됨
- **선행 Scenario:** M4-018

---

### Scenario M4-020: 후기 저장 성공 (공개 동의)

- **Given:** 후기를 작성하고 "후킹페이지에 공개" 체크함
- **When:** 저장 버튼을 클릭함
- **Then:** reviews 테이블에 is_public=true로 저장됨
- **선행 Scenario:** M4-018

---

### Scenario M4-021: 같은 모임 중복 후기 작성 불가

- **Given:** 이미 해당 모임에 후기를 작성함
- **When:** 다시 후기 작성을 시도함
- **Then:** "이미 후기를 작성한 모임입니다" 에러 표시
- **선행 Scenario:** M4-019

---

### Scenario M4-022: 건의하기 제출 성공

- **Given:** 건의하기 화면 또는 섹션에 접근함
- **When:** 건의 내용을 입력하고 제출함
- **Then:** suggestions 테이블에 저장됨
- **선행 Scenario:** M4-002

---

## Phase 3: 배지 시스템

### Scenario M4-023: badges, user_badges 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** badges, user_badges 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 기본 배지 6개가 삽입됨
- **선행 Scenario:** M1-009

---

### Scenario M4-024: 첫 참여 완료 시 "첫 발자국" 배지 부여

- **Given:** 회원의 첫 번째 참여 완료 처리
- **When:** checkAndAwardBadges()가 실행됨
- **Then:** "첫 발자국" 배지가 user_badges에 추가됨
- **선행 Scenario:** M4-003, M4-023

---

### Scenario M4-025: 10회 참여 완료 시 "10회 참여" 배지 부여

- **Given:** 회원의 total_participations가 10이 됨
- **When:** checkAndAwardBadges()가 실행됨
- **Then:** "10회 참여" 배지가 부여됨
- **선행 Scenario:** M4-023

---

### Scenario M4-026: 4주 연속 참여 시 "연속 4주" 배지 부여

- **Given:** 회원의 consecutive_weeks가 4가 됨
- **When:** checkAndAwardBadges()가 실행됨
- **Then:** "연속 4주" 배지가 부여됨
- **선행 Scenario:** M4-023

---

### Scenario M4-027: 칭찬 10개 수신 시 "칭찬 10개" 배지 부여

- **Given:** 회원의 total_praises_received가 10이 됨
- **When:** checkAndAwardBadges()가 실행됨
- **Then:** "칭찬 10개" 배지가 부여됨
- **선행 Scenario:** M4-013, M4-023

---

### Scenario M4-028: 이미 보유한 배지 중복 부여 방지

- **Given:** 이미 "첫 발자국" 배지를 보유함
- **When:** checkAndAwardBadges()가 다시 실행됨
- **Then:** 중복 삽입 없이 정상 완료됨
- **선행 Scenario:** M4-024

---

### Scenario M4-029: 배지 조건 미충족 시 부여 안 됨

- **Given:** total_participations가 5임
- **When:** checkAndAwardBadges()가 실행됨
- **Then:** "10회 참여" 배지가 부여되지 않음
- **선행 Scenario:** M4-023

---

## Phase 4: 마이페이지 강화

### Scenario M4-030: 총 참여 횟수 표시

- **Given:** 회원의 total_participations가 12임
- **When:** 마이페이지에 접속함
- **Then:** "총 참여: 12회"가 표시됨
- **선행 Scenario:** M4-003

---

### Scenario M4-031: 연속 참여 주 수 표시

- **Given:** 회원의 consecutive_weeks가 3임
- **When:** 마이페이지에 접속함
- **Then:** "연속: 3주"가 표시됨
- **선행 Scenario:** M4-030

---

### Scenario M4-032: "함께한 지 OOO일째" 표시

- **Given:** 회원 가입이 127일 전임
- **When:** 마이페이지에 접속함
- **Then:** "지독해와 함께한 지 127일째"가 표시됨
- **선행 Scenario:** M1-016

---

### Scenario M4-033: 획득한 배지 목록 표시

- **Given:** 회원이 "첫 발자국", "10회 참여" 배지를 보유함
- **When:** 마이페이지에 접속함
- **Then:** 해당 배지 아이콘(👣, 🎯)이 표시됨
- **선행 Scenario:** M4-024, M4-025

---

### Scenario M4-034: 누적 칭찬 수 표시

- **Given:** 회원의 total_praises_received가 5임
- **When:** 마이페이지에 접속함
- **Then:** "칭찬 받은: 5개 💛"가 표시됨
- **선행 Scenario:** M4-013

---

### Scenario M4-035: 정기모임 자격 상태 표시 (active)

- **Given:** 마지막 정기모임 참여가 2개월 전임
- **When:** 마이페이지에 접속함
- **Then:** "마지막 참여: 2024년 11월 15일" 표시, 경고 없음
- **선행 Scenario:** M2-014

---

### Scenario M4-036: 정기모임 자격 만료 임박 경고

- **Given:** 마지막 정기모임 참여가 5개월 전임
- **When:** 마이페이지에 접속함
- **Then:** "⚠️ 자격 만료 예정: 2025년 6월 15일 → 1개월 남았어요" 경고 표시
- **선행 Scenario:** M4-035

---

### Scenario M4-037: 정기모임 자격 만료 상태 표시

- **Given:** 마지막 정기모임 참여가 7개월 전임
- **When:** 마이페이지에 접속함
- **Then:** "자격 만료됨" 상태와 정기모임 참여 안내 표시
- **선행 Scenario:** M4-035

---

## Phase 5: 책장 & 참가자 목록

### Scenario M4-038: bookshelf 테이블 생성

- **Given:** Supabase 연결이 완료됨
- **When:** bookshelf 테이블 생성 마이그레이션을 실행함
- **Then:** 테이블이 생성되고 UNIQUE 제약조건이 적용됨
- **선행 Scenario:** M1-009

---

### Scenario M4-039: 책 등록 성공

- **Given:** 내 책장 화면에 접속함
- **When:** 제목과 저자를 입력하고 등록함
- **Then:** bookshelf 테이블에 저장되고 목록에 표시됨
- **선행 Scenario:** M4-038

---

### Scenario M4-040: 책 등록 시 한 문장 기록 (선택)

- **Given:** 책 등록 화면에서 "한 문장 기록"을 입력함
- **When:** 등록 버튼을 클릭함
- **Then:** one_line 필드에 저장되고 목록에 함께 표시됨
- **선행 Scenario:** M4-039

---

### Scenario M4-041: 같은 책 중복 등록 방지

- **Given:** 이미 "아몬드, 손원평"이 등록됨
- **When:** 동일한 제목과 저자로 등록을 시도함
- **Then:** "이미 등록된 책입니다" 에러 표시
- **선행 Scenario:** M4-039

---

### Scenario M4-042: 내 책장 목록 조회

- **Given:** 3권의 책이 등록됨
- **When:** `/mypage/bookshelf`에 접속함
- **Then:** 3권의 책이 목록으로 표시되고 "📚 내 책장 (3권)" 타이틀
- **선행 Scenario:** M4-039

---

### Scenario M4-043: 총 등록 책 수 표시

- **Given:** 12권의 책이 등록됨
- **When:** 마이페이지에 접속함
- **Then:** "내 책장: 12권"이 표시됨
- **선행 Scenario:** M4-042

---

### Scenario M4-044: 참가자 목록 클릭 시 일부 공개

- **Given:** 모임에 10명이 참가 확정됨
- **When:** 모임 상세에서 "10명 참여"를 클릭함
- **Then:** 참가자 일부(5명)가 표시되고 나머지는 흐릿하게 처리됨
- **선행 Scenario:** M2-014

---

### Scenario M4-045: 칭찬 10개 이상 참가자 우선 표시

- **Given:** 참가자 중 3명이 total_praises_received >= 10
- **When:** 참가자 목록을 열음
- **Then:** 해당 3명이 우선 표시됨
- **선행 Scenario:** M4-044

---

### Scenario M4-046: 참가자 3명 미만 시 목록 비공개

- **Given:** 모임에 2명만 참가 확정됨
- **When:** "2명 참여"를 클릭함
- **Then:** 참가자 목록이 표시되지 않거나 "곧 만나요!" 안내
- **선행 Scenario:** M4-044

---

### Scenario M4-047: 나머지 참가자 흐릿하게 처리 UI

- **Given:** visible 5명, hidden 5명인 상태
- **When:** 참가자 목록 모달을 확인함
- **Then:** 5명은 이름 표시, 5명은 흐릿한 플레이스홀더로 표시됨
- **선행 Scenario:** M4-044

---

## 애니메이션 시나리오

### Scenario M4-048: 칭찬 완료 시 하트 애니메이션

- **Given:** 칭찬 대상과 문구를 선택함
- **When:** [칭찬 보내기] 버튼을 클릭함
- **Then:** 하트가 버튼에서 화면 상단으로 날아가는 애니메이션 재생 (0.5초)
- **선행 Scenario:** M4-012

---

### Scenario M4-049: 배지 획득 시 Confetti 효과

- **Given:** 배지 조건을 충족함 (예: 첫 참여)
- **When:** checkAndAwardBadges()가 실행되어 배지가 부여됨
- **Then:** 화면에 Confetti(꽃가루) 효과가 3초간 재생됨
- **선행 Scenario:** M4-024

---

### Scenario M4-050: 배지 획득 모달 회전 등장

- **Given:** 배지가 부여됨
- **When:** 배지 획득 모달이 표시됨
- **Then:** 배지 카드가 Y축으로 360도 회전하며 등장함 (0.8초)
- **선행 Scenario:** M4-049

---

### Scenario M4-051: 배지 획득 모달 자동 닫힘

- **Given:** 배지 획득 모달이 표시됨
- **When:** 3초가 경과하거나 아무 곳을 클릭함
- **Then:** 모달이 페이드아웃으로 닫힘
- **선행 Scenario:** M4-050

---

### Scenario M4-052: 연속 참여 프로그레스 바 표시

- **Given:** 회원의 consecutive_weeks가 2임
- **When:** 마이페이지에 접속함
- **Then:** "연속 참여" 영역에 4주 기준 50% 채워진 게이지 표시
- **선행 Scenario:** M4-031

---

### Scenario M4-053: 프로그레스 바 로드 애니메이션

- **Given:** 마이페이지가 로드됨
- **When:** 연속 참여 게이지가 렌더링됨
- **Then:** 게이지가 0%에서 현재값까지 0.5초간 채워지는 애니메이션
- **선행 Scenario:** M4-052

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 | 7 | 1 | 8 |
| Phase 2 | 13 | 2 | 15 |
| Phase 3 | 9 | 1 | 10 |
| Phase 4 | 10 | 0 | 10 |
| Phase 5 | 9 | 1 | 10 |
| **총계** | **48** | **5** | **53** |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | SC-M4 최초 작성 |
| 2026-01-15 | 1.1 | 애니메이션 시나리오 추가 (M4-048~053: 칭찬 하트, 배지 Confetti/회전, 프로그레스 바), 총 53개 |

