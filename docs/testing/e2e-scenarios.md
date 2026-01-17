# E2E 테스트 시나리오

## 테스트 전략 개요

### 계층별 테스트

| 계층 | 도구 | 대상 | 시점 |
|------|------|------|------|
| Unit | Vitest | 순수 함수 (환불 계산 등) | 코드 변경 시 |
| Integration | Playwright | API 엔드포인트 | API 변경 시 |
| E2E | Playwright | 사용자 플로우 | 배포 전 필수 |
| Visual | Storybook | UI 컴포넌트 | 디자인 변경 시 |

---

## 핵심 E2E 시나리오

### 🔴 반드시 통과해야 하는 시나리오 (Critical)

#### C-01: 신규 회원 첫 모임 신청

```gherkin
Feature: 신규 회원 첫 모임 신청

Scenario: 신규 회원이 회원가입 후 모임에 신청한다
  Given 로그아웃 상태에서 홈페이지에 접속
  When "회원가입" 버튼 클릭
  And 이메일, 비밀번호, 이름 입력 후 가입
  Then 홈 화면으로 이동
  
  When 모임 목록에서 정기모임 클릭
  And "신청하기" 버튼 클릭
  And 결제 진행 (테스트 모드)
  Then 신청 완료 화면 표시
  And 마이페이지에서 신청 내역 확인 가능
```

#### C-02: 기존 회원 취소/환불

```gherkin
Feature: 모임 취소 및 환불

Scenario: 3일 전 취소 시 100% 환불
  Given 로그인 상태로 마이페이지 접속
  And 3일 뒤 모임에 신청된 상태
  When 해당 모임의 "취소" 버튼 클릭
  And 취소 사유 입력 후 확인
  Then "100% 환불 처리됨" 메시지 표시
  And 신청 상태가 "취소됨"으로 변경

Scenario: 2일 전 취소 시 50% 환불
  Given 로그인 상태로 마이페이지 접속
  And 2일 뒤 모임에 신청된 상태
  When 해당 모임의 "취소" 버튼 클릭
  Then "50% 환불 처리됨" 메시지 표시
```

#### C-03: 운영자 모임 생성

```gherkin
Feature: 운영자 모임 생성

Scenario: 운영자가 새 정기모임을 생성한다
  Given 운영자 계정으로 로그인
  When 관리자 메뉴에서 "모임 관리" 클릭
  And "새 모임 만들기" 클릭
  And 모임 정보 입력 (제목, 일시, 장소, 참가비, 정원)
  And 환불 규정 선택 ("정기모임")
  And "저장" 클릭
  Then 모임 목록에 새 모임 표시
  And 일반 회원이 해당 모임 조회 가능
```

#### C-04: 로그인/로그아웃

```gherkin
Feature: 인증 플로우

Scenario: 이메일로 로그인
  Given 로그아웃 상태
  When 로그인 페이지에서 이메일/비밀번호 입력
  And "로그인" 클릭
  Then 홈 화면으로 이동
  And 헤더에 사용자 이름 표시

Scenario: 로그아웃
  Given 로그인 상태
  When 헤더의 "로그아웃" 클릭
  Then 홈 화면으로 이동
  And "로그인" 버튼 표시
```

---

### 🟡 중요 시나리오 (High)

#### H-01: 대기자 등록 및 알림

```gherkin
Feature: 대기자 처리

Scenario: 정원 마감 모임에 대기 등록
  Given 정원이 찬 모임 상세 페이지
  When "대기 등록" 버튼 클릭
  Then "대기 1번" 메시지 표시

Scenario: 취소 발생 시 대기자 알림
  Given 대기 1번인 상태
  When 기존 참가자가 취소
  Then 대기자에게 알림톡 발송 (Mock 확인)
```

#### H-02: 칭찬하기

```gherkin
Feature: 칭찬 기능

Scenario: 모임 후 칭찬하기
  Given 참여 완료된 모임이 있음
  When "어떠셨어요?" 알림 수신
  And "칭찬하기" 선택
  And 참가자 1명 선택 + 문구 선택
  Then "칭찬 전달 완료" 메시지
  And 본인 참여 완료 처리
```

#### H-03: 마이페이지 통계

```gherkin
Feature: 마이페이지 정보

Scenario: 참여 통계 확인
  Given 5회 참여한 회원으로 로그인
  When 마이페이지 접속
  Then "총 5회 참여" 표시
  And "함께한 지 OO일째" 표시
  And 배지 목록 표시
```

---

### 🟢 일반 시나리오 (Medium)

#### M-01: 모임 목록 필터링

```gherkin
Feature: 모임 목록

Scenario: 모임 상태별 필터
  Given 모임 목록 페이지
  When "모집중" 필터 선택
  Then 모집중인 모임만 표시

Scenario: 참가 인원 표시
  Given 모임 목록 페이지
  Then 각 모임에 "O명 참여" 표시
  And 정원은 표시하지 않음
```

#### M-02: 책장 등록

```gherkin
Feature: 내 책장

Scenario: 책 등록
  Given 마이페이지 > 내 책장
  When "책 추가" 클릭
  And 제목, 저자 입력
  And "한 문장 기록" 입력 (선택)
  Then 책장에 새 책 표시
```

---

## 테스트 데이터 준비

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 일반 회원 | test.member@example.com | TestMember123! |
| 운영자 | test.admin@example.com | TestAdmin123! |
| 메인 운영자 | test.super@example.com | TestSuper123! |

### 테스트 모임

| 상태 | 제목 | 일시 |
|------|------|------|
| 모집중 | 테스트 정기모임 (여유) | 7일 후 |
| 마감임박 | 테스트 정기모임 (마감임박) | 5일 후, 정원-2 |
| 마감 | 테스트 정기모임 (마감) | 3일 후, 정원 충족 |

---

## 실행 방법

```bash
# Playwright 설치 (최초 1회)
npx playwright install

# 전체 E2E 테스트 실행
npm run test:e2e

# 특정 시나리오만 실행
npm run test:e2e -- --grep "C-01"

# 헤드리스 모드 끄고 실행 (디버깅)
npm run test:e2e -- --headed
```

---

## 관련 파일

- `/tests/e2e/` - E2E 테스트 파일 (추후 생성)
- `/playwright.config.ts` - Playwright 설정 (추후 생성)

