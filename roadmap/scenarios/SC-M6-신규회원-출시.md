# Scenario: M6 - 신규 회원 & 출시 준비

---

**Work Package:** WP-M6  
**총 Scenario 수:** 45개  
**작성일:** 2026-01-14

---

## Phase 1: 후킹 랜딩페이지

### Scenario M6-001: 랜딩페이지 접근 성공

- **Given:** 서버가 정상 동작 중
- **When:** `/about` 페이지에 접속함
- **Then:** 랜딩페이지가 정상적으로 로드됨
- **선행 Scenario:** M1-006

---

### Scenario M6-002: 브랜드 스토리 섹션 표시

- **Given:** 랜딩페이지가 로드됨
- **When:** 페이지를 스크롤함
- **Then:** "우리의 이야기" 섹션에 지독해 소개 문구가 표시됨
- **선행 Scenario:** M6-001

---

### Scenario M6-003: 분위기 갤러리 표시

- **Given:** 랜딩페이지가 로드됨
- **When:** "이런 분위기예요" 섹션을 확인함
- **Then:** 모임 사진/일러스트가 갤러리로 표시됨
- **선행 Scenario:** M6-001

---

### Scenario M6-004: 공개 동의 후기만 표시

- **Given:** reviews 테이블에 is_public=true 2건, false 3건 있음
- **When:** "회원분들의 이야기" 섹션을 확인함
- **Then:** 2건의 공개 동의 후기만 표시됨
- **선행 Scenario:** M4-020

---

### Scenario M6-005: 후기 없는 경우 섹션 처리

- **Given:** 공개 동의 후기가 없음
- **When:** 랜딩페이지를 확인함
- **Then:** 후기 섹션이 숨겨지거나 "곧 후기가 올라와요" 표시
- **선행 Scenario:** M6-004

---

### Scenario M6-006: CTA 버튼 클릭 - 비로그인 상태

- **Given:** 비로그인 상태에서 랜딩페이지를 봄
- **When:** "지금 시작하기" 버튼을 클릭함
- **Then:** 로그인/회원가입 페이지로 이동함
- **선행 Scenario:** M6-001

---

### Scenario M6-007: CTA 버튼 클릭 - 로그인 상태

- **Given:** 로그인 상태에서 랜딩페이지를 봄
- **When:** "정기모임 신청하기" 버튼을 클릭함
- **Then:** 정기모임 필터가 적용된 모임 목록으로 이동함
- **선행 Scenario:** M1-019

---

### Scenario M6-008: SEO 메타데이터 확인

- **Given:** 랜딩페이지가 배포됨
- **When:** 페이지 소스를 확인함
- **Then:** title, description, og:image 등 메타태그가 설정됨
- **선행 Scenario:** M6-001

---

### Scenario M6-009: 모바일 반응형 UI

- **Given:** 모바일 디바이스로 랜딩페이지 접속
- **When:** 화면을 확인함
- **Then:** UI가 깨지지 않고 가독성이 유지됨
- **선행 Scenario:** M6-001

---

### Scenario M6-010: 스크롤 애니메이션 동작

- **Given:** 랜딩페이지가 로드됨
- **When:** 페이지를 스크롤함
- **Then:** 섹션별로 페이드인/슬라이드 애니메이션이 동작함
- **선행 Scenario:** M6-001

---

## Phase 2: 신규 회원 플로우

### Scenario M6-011: 신규 회원 판별 (is_new_member=true)

- **Given:** 회원가입 직후, is_new_member=true 상태
- **When:** 일정 페이지에 접속함
- **Then:** 신규 회원으로 인식됨
- **선행 Scenario:** M1-016

---

### Scenario M6-012: 신규 회원 일정 클릭 시 안내 팝업 표시

- **Given:** 신규 회원이 로그인됨
- **When:** 모임 카드를 클릭함
- **Then:** "처음이시네요!" 안내 팝업이 표시됨
- **선행 Scenario:** M6-011

---

### Scenario M6-013: 기존 회원은 팝업 없이 바로 상세 이동

- **Given:** 기존 회원(is_new_member=false)이 로그인됨
- **When:** 모임 카드를 클릭함
- **Then:** 팝업 없이 바로 모임 상세 페이지로 이동함
- **선행 Scenario:** M4-003

---

### Scenario M6-014: 팝업에서 "지독해 알아보기" 선택

- **Given:** 신규 회원 안내 팝업이 표시됨
- **When:** "지독해 알아보기" 버튼을 클릭함
- **Then:** `/about` 랜딩페이지로 이동함
- **선행 Scenario:** M6-012

---

### Scenario M6-015: 팝업에서 "바로 신청하기" 선택

- **Given:** 신규 회원 안내 팝업이 표시됨
- **When:** "바로 신청하기" 버튼을 클릭함
- **Then:** 모임 상세 페이지로 이동함
- **선행 Scenario:** M6-012

---

### Scenario M6-016: "다시 보지 않기" 체크 시 팝업 숨김

- **Given:** 안내 팝업에서 "다시 보지 않기"를 체크함
- **When:** 다음에 모임 카드를 클릭함
- **Then:** 팝업이 표시되지 않고 바로 상세 페이지로 이동함
- **선행 Scenario:** M6-012

---

### Scenario M6-017: 첫 모임 전날 환영 알림 발송

- **Given:** 신규 회원이 정기모임에 신청함, 모임이 내일임
- **When:** welcome Cron이 실행됨
- **Then:** "#{회원명}님, 내일 첫 모임이에요!" 알림 발송됨
- **선행 Scenario:** M2-014, M3-006

---

### Scenario M6-018: 환영 알림 - 기존 회원에게는 발송 안 됨

- **Given:** 기존 회원이 모임에 신청함
- **When:** welcome Cron이 실행됨
- **Then:** 환영 알림은 발송되지 않음 (일반 리마인드만)
- **선행 Scenario:** M6-017

---

### Scenario M6-019: 첫 정기모임 참여 완료 시 기존 회원 전환

- **Given:** 신규 회원이 정기모임에 참여 완료됨
- **When:** 참여 완료 처리가 실행됨
- **Then:** is_new_member=false, first_regular_meeting_at이 설정됨
- **선행 Scenario:** M4-003

---

### Scenario M6-020: 토론모임 참여 완료 시 전환 안 됨

- **Given:** 신규 회원이 토론모임에 참여 완료됨
- **When:** 참여 완료 처리가 실행됨
- **Then:** is_new_member는 여전히 true로 유지됨
- **선행 Scenario:** M4-003

---

### Scenario M6-021: 첫 모임 후 알림 (후기 요청)

- **Given:** 신규 회원의 첫 정기모임 종료 3일 후
- **When:** post-meeting Cron이 실행됨
- **Then:** "첫 모임 어떠셨어요? 후기를 남겨주세요!" + 다음 모임 안내 발송
- **선행 Scenario:** M4-001

---

## Phase 3: 자격 체크 & 유도

### Scenario M6-022: 자격 체크 함수 - 신규 회원 (자격 있음)

- **Given:** is_new_member=true인 회원
- **When:** checkRegularMeetingEligibility()를 호출함
- **Then:** { isEligible: true, status: 'new' } 반환
- **선행 Scenario:** M1-016

---

### Scenario M6-023: 자격 체크 함수 - 3개월 전 참여 (자격 있음)

- **Given:** last_regular_meeting_at이 3개월 전인 회원
- **When:** checkRegularMeetingEligibility()를 호출함
- **Then:** { isEligible: true, status: 'active', daysRemaining: 90 } 반환
- **선행 Scenario:** M4-003

---

### Scenario M6-024: 자격 체크 함수 - 5개월 전 참여 (경고)

- **Given:** last_regular_meeting_at이 5개월 전인 회원
- **When:** checkRegularMeetingEligibility()를 호출함
- **Then:** { isEligible: true, status: 'warning', daysRemaining: 30 } 반환
- **선행 Scenario:** M4-003

---

### Scenario M6-025: 자격 체크 함수 - 7개월 전 참여 (만료)

- **Given:** last_regular_meeting_at이 7개월 전인 회원
- **When:** checkRegularMeetingEligibility()를 호출함
- **Then:** { isEligible: false, status: 'expired' } 반환
- **선행 Scenario:** M4-003

---

### Scenario M6-026: 자격 미충족 시 토론모임 신청 차단

- **Given:** 자격 만료된 회원이 토론모임 상세에 접속함
- **When:** "신청하기" 버튼을 클릭함
- **Then:** 자격 미충족 팝업이 표시됨
- **선행 Scenario:** M6-025

---

### Scenario M6-027: 자격 미충족 팝업에서 정기모임 유도

- **Given:** 자격 미충족 팝업이 표시됨
- **When:** "정기모임 보러가기" 버튼을 클릭함
- **Then:** 정기모임 필터가 적용된 목록으로 이동함
- **선행 Scenario:** M6-026

---

### Scenario M6-028: 자격 만료 임박 알림 발송 (5개월 경과)

- **Given:** last_regular_meeting_at이 5개월 전인 회원
- **When:** eligibility_warning Cron이 실행됨
- **Then:** "자격 만료가 임박했어요" 알림 발송됨
- **선행 Scenario:** M6-024

---

### Scenario M6-029: 정기모임 참여로 자격 갱신

- **Given:** 자격 만료 임박 상태의 회원
- **When:** 정기모임 참여 완료됨
- **Then:** last_regular_meeting_at이 갱신되어 자격 active 상태로 복귀
- **선행 Scenario:** M4-003

---

## Phase 4: 안정화 & 출시

### Scenario M6-030: Beta 피드백 수집 및 우선순위 정리

- **Given:** Beta 테스터로부터 피드백을 수집함
- **When:** 피드백을 분류함
- **Then:** P0/P1/P2로 우선순위가 정리됨
- **선행 Scenario:** M4-047

---

### Scenario M6-031: 크리티컬 버그 수정 완료

- **Given:** P0 버그가 발견됨
- **When:** 버그를 수정하고 배포함
- **Then:** P0 버그가 0개인 상태
- **선행 Scenario:** M6-030

---

### Scenario M6-032: LCP 성능 목표 충족

- **Given:** 홈 화면이 배포됨
- **When:** Lighthouse로 성능을 측정함
- **Then:** LCP가 2.5초 이내임
- **선행 Scenario:** M1-006

---

### Scenario M6-033: 이미지 lazy loading 적용

- **Given:** 여러 이미지가 있는 페이지
- **When:** 페이지를 로드함
- **Then:** 뷰포트 밖 이미지는 스크롤 시 로드됨
- **선행 Scenario:** M6-032

---

### Scenario M6-034: 에러 모니터링 설정 (Sentry)

- **Given:** Sentry DSN이 설정됨
- **When:** 에러가 발생함
- **Then:** Sentry 대시보드에 에러가 기록됨
- **선행 Scenario:** M1-006

---

### Scenario M6-035: 에러 발생 시 알림 수신

- **Given:** Sentry가 설정되고 알림 규칙이 있음
- **When:** 크리티컬 에러가 발생함
- **Then:** 이메일 또는 슬랙으로 알림 수신됨
- **선행 Scenario:** M6-034

---

### Scenario M6-036: 최종 QA - 이메일 회원가입

- **Given:** 프로덕션 환경 준비됨
- **When:** 이메일로 회원가입함
- **Then:** 정상적으로 가입 완료됨
- **선행 Scenario:** M1-016

---

### Scenario M6-037: 최종 QA - 전체 결제 흐름

- **Given:** 테스트 계정으로 로그인함
- **When:** 모임 신청 → 결제 → 완료 흐름을 진행함
- **Then:** 모든 단계가 정상 동작함
- **선행 Scenario:** M2-014

---

### Scenario M6-038: 최종 QA - 취소/환불 흐름

- **Given:** 신청 완료된 모임이 있음
- **When:** 취소를 진행함
- **Then:** 환불 규정에 따라 정상 환불됨
- **선행 Scenario:** M2-024

---

### Scenario M6-039: 최종 QA - 알림 발송

- **Given:** 모임 3일 전 대상자가 있음
- **When:** 리마인드 Cron이 실행됨
- **Then:** 알림톡이 정상 발송됨
- **선행 Scenario:** M3-011

---

### Scenario M6-040: 최종 QA - 운영자 대시보드

- **Given:** 운영자가 로그인함
- **When:** 대시보드에 접속함
- **Then:** 통계가 정상 표시됨
- **선행 Scenario:** M5-001

---

### Scenario M6-041: 환경 변수 production 설정

- **Given:** 프로덕션 배포 준비됨
- **When:** Vercel에 환경 변수를 설정함
- **Then:** 모든 필수 환경 변수가 production에 설정됨
- **선행 Scenario:** M1-004

---

### Scenario M6-042: SSL 인증서 확인

- **Given:** 도메인이 연결됨
- **When:** https로 접속함
- **Then:** 유효한 SSL 인증서로 보안 연결됨
- **선행 Scenario:** M1-006

---

### Scenario M6-043: 정식 출시 - 전체 회원 안내 발송

- **Given:** 모든 QA가 통과됨
- **When:** 출시 안내 알림을 발송함
- **Then:** 전체 회원에게 "새로운 웹서비스가 오픈했어요!" 알림 발송됨
- **선행 Scenario:** M3-031

---

### Scenario M6-044: 출시 후 에러율 모니터링

- **Given:** 정식 출시됨
- **When:** 1주일간 모니터링함
- **Then:** 에러율이 1% 미만으로 유지됨
- **선행 Scenario:** M6-034

---

### Scenario M6-045: 롤백 시나리오 - 문제 발생 시 이전 배포로 복귀

- **Given:** 심각한 문제가 발생함
- **When:** Vercel에서 이전 배포로 롤백함
- **Then:** 5분 이내에 이전 버전으로 복구됨
- **선행 Scenario:** M1-006

---

## 검증 요약

| Phase | 성공 케이스 | 실패 케이스 | 합계 |
|-------|------------|------------|------|
| Phase 1 | 9 | 1 | 10 |
| Phase 2 | 10 | 1 | 11 |
| Phase 3 | 8 | 0 | 8 |
| Phase 4 | 15 | 1 | 16 |
| **총계** | **42** | **3** | **45** |

---

## 출시 체크리스트 Scenario

### 필수 통과 항목

| # | Scenario | 상태 |
|---|----------|------|
| M6-031 | 크리티컬 버그 0개 | ⬜ |
| M6-032 | LCP < 2.5s | ⬜ |
| M6-034 | 에러 모니터링 동작 | ⬜ |
| M6-036 | 회원가입 정상 | ⬜ |
| M6-037 | 결제 흐름 정상 | ⬜ |
| M6-038 | 환불 흐름 정상 | ⬜ |
| M6-039 | 알림 발송 정상 | ⬜ |
| M6-040 | 대시보드 정상 | ⬜ |
| M6-041 | 환경 변수 설정 완료 | ⬜ |
| M6-042 | SSL 인증서 유효 | ⬜ |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | SC-M6 최초 작성 |

