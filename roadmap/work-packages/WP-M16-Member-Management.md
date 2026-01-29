# Work Package: M16 - Member Management (회원 관리)

---

**문서 버전:** 1.0
**작성일:** 2026-01-28
**Milestone:** M16
**예상 기간:** 1.5주
**선행 조건:** M15 완료 (참여 이력 연동)

---

## 1. 개요

운영자가 회원 문의 시 즉시 상태를 파악하고 예외 처리를 할 수 있는 회원 관리 시스템입니다. "왜 신청이 안 되나요?" 문의에 30초 내 답변할 수 있도록 자격 상태를 최상단에 표시하고, 참여 이력과 수동 조정 기능을 제공합니다.

**핵심 목표:**
- 회원 조회 및 검색 (이름/연락처)
- 자격 상태 즉시 파악 (Active/Warning/Expired)
- 참여 이력 및 통계 조회
- 자격 수동 조정 (예외 처리용)
- 운영자 메모 기능
- 자격 만료 예정 회원 대시보드 위젯

---

## 2. Phase 구성 개요

```
[M15 완료: 모임 관리]
    |
    v
[Phase 16.1] 회원 목록 + 검색/필터
    |
    v
[Phase 16.2] 회원 상세 + 자격 상태 표시
    |
    v
[Phase 16.3] 참여 이력 + 통계
    |
    v
[Phase 16.4] 자격 수동 조정 + 메모 + 대시보드 위젯
    |
    v
[M16 완료] -> M17 시작 가능
```

---

## 3. Phase 상세

### Phase 16.1: 회원 목록 + 검색/필터

**목표:** 회원 목록을 빠르게 검색하고 자격 상태별로 필터링

**예상 소요:** 3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 16.1.1 | 회원 목록 페이지 생성 | `/app/admin/members/page.tsx` | 회원 목록 테이블 렌더링 |
| 16.1.2 | 검색 기능 구현 | SearchInput 컴포넌트 | 이름/연락처로 실시간 검색 |
| 16.1.3 | 자격 상태 필터 구현 | FilterSelect 컴포넌트 | Active/Warning/Expired 필터 |
| 16.1.4 | 정렬 기능 구현 | SortSelect 컴포넌트 | 최근 활동순/가입일순/이름순 |
| 16.1.5 | 회원 목록 API 엔드포인트 | `/api/admin/members/route.ts` | 검색/필터/정렬 쿼리 처리 |
| 16.1.6 | 자격 상태 계산 로직 | `lib/member-eligibility.ts` | Active/Warning/Expired 판정 |
| 16.1.7 | 페이지네이션 구현 | Pagination 컴포넌트 | 20명씩 페이지 분할 |

#### 자격 상태 정의

```typescript
// lib/member-eligibility.ts
export type EligibilityStatus = 'active' | 'warning' | 'expired';

export interface EligibilityResult {
  status: EligibilityStatus;
  daysUntilExpiry: number | null;
  lastRegularMeetingAt: Date | null;
  expiryDate: Date | null;
}

// 자격 유지 기간: 6개월 (app_settings에서 조회)
// Warning: 만료 30일 이내
// Expired: 만료됨

export function calculateEligibility(
  lastRegularMeetingAt: Date | null,
  eligibilityPeriodMonths: number = 6,
  warningDays: number = 30
): EligibilityResult {
  if (!lastRegularMeetingAt) {
    return {
      status: 'expired',
      daysUntilExpiry: null,
      lastRegularMeetingAt: null,
      expiryDate: null,
    };
  }

  const expiryDate = addMonths(lastRegularMeetingAt, eligibilityPeriodMonths);
  const now = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, now);

  if (daysUntilExpiry < 0) {
    return { status: 'expired', daysUntilExpiry: 0, lastRegularMeetingAt, expiryDate };
  }
  if (daysUntilExpiry <= warningDays) {
    return { status: 'warning', daysUntilExpiry, lastRegularMeetingAt, expiryDate };
  }
  return { status: 'active', daysUntilExpiry, lastRegularMeetingAt, expiryDate };
}
```

#### 회원 목록 UI 요구사항

```
+---------------------------------------------------------------+
| 회원 관리                                    [+ 수동 추가]     |
+---------------------------------------------------------------+
| [검색: 이름 또는 연락처]    [상태: 전체 v]  [정렬: 최근활동 v] |
+---------------------------------------------------------------+
| 이름      | 연락처         | 상태    | 마지막 참여  | 총 참여 |
+---------------------------------------------------------------+
| 김지독    | 010-1234-5678  | Active  | 2024.12.15  | 12회   |
| 이독서    | 010-2345-6789  | Warning | 2024.10.01  | 8회    |
| 박책방    | 010-3456-7890  | Expired | 2024.06.15  | 3회    |
+---------------------------------------------------------------+
|                    < 1 2 3 4 5 >                               |
+---------------------------------------------------------------+
```

#### Scenario (검증 기준)

:red_circle: **SC-M16-001: 회원 이름 검색**
- Given: 회원 목록 페이지 접속
- When: 검색창에 "김지독" 입력
- Then: 이름에 "김지독"이 포함된 회원만 필터링되어 표시

:red_circle: **SC-M16-002: 자격 상태 필터**
- Given: 회원 목록 페이지 접속
- When: 상태 필터에서 "Warning" 선택
- Then: 자격 만료 30일 이내 회원만 표시됨

:yellow_circle: **SC-M16-003: 최근 활동순 정렬**
- Given: 회원 목록이 표시된 상태
- When: 정렬 옵션에서 "최근 활동순" 선택
- Then: last_regular_meeting_at 기준 내림차순 정렬

:yellow_circle: **SC-M16-004: 연락처 검색**
- Given: 회원 목록 페이지 접속
- When: 검색창에 "010-1234" 입력
- Then: 해당 번호가 포함된 회원만 필터링

#### 사용자 가치
> "운영자가 회원 이름이나 연락처로 빠르게 검색하고, 자격 상태별로 필터링할 수 있다"

---

### Phase 16.2: 회원 상세 + 자격 상태 표시

**목표:** 회원 상세 페이지에서 자격 상태를 최상단에 표시하여 즉시 파악 가능

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 16.2.1 | 회원 상세 페이지 생성 | `/app/admin/members/[id]/page.tsx` | 회원 상세 정보 렌더링 |
| 16.2.2 | 자격 상태 카드 컴포넌트 | `EligibilityStatusCard.tsx` | 상태 + D-Day 최상단 표시 |
| 16.2.3 | 기본 정보 섹션 | `MemberBasicInfo.tsx` | 이름, 연락처, 가입일, 이메일 |
| 16.2.4 | 참여 통계 요약 섹션 | `MemberStatsSummary.tsx` | 총 참여/노쇼/취소 횟수 |
| 16.2.5 | 회원 상세 API 엔드포인트 | `/api/admin/members/[id]/route.ts` | 회원 + 통계 조회 |
| 16.2.6 | D-Day 계산 및 표시 | `formatDDay()` 함수 | "D-45" 또는 "만료됨" |

#### 회원 상세 UI 요구사항

```
+---------------------------------------------------------------+
| < 회원 목록                                          [수정]    |
+---------------------------------------------------------------+
| 김지독 님                                           [Active]   |
+---------------------------------------------------------------+
| +-----------------------------------------------------------+ |
| |  자격 만료까지: D-45                                       | |
| |  마지막 참여: 2024.12.15 (정기모임 #127)                   | |
| +-----------------------------------------------------------+ |
+---------------------------------------------------------------+
| 기본 정보                                                     |
| - 이메일: kim@example.com                                     |
| - 연락처: 010-1234-5678                                       |
| - 가입일: 2023.06.01                                          |
+---------------------------------------------------------------+
| 참여 통계                                                     |
| 총 참여: 12회 | 노쇼: 0회 | 취소: 2회                         |
+---------------------------------------------------------------+
| [참여 이력] [결제 내역] [메모 (2)]                             |
+---------------------------------------------------------------+
```

#### 자격 상태별 스타일

```typescript
// components/admin/EligibilityStatusCard.tsx
const statusStyles = {
  active: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: 'CheckCircle',
    text: '자격 유지 중',
  },
  warning: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'AlertTriangle',
    text: '만료 임박',
  },
  expired: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: 'XCircle',
    text: '자격 만료',
  },
};
```

#### Scenario (검증 기준)

:red_circle: **SC-M16-005: 자격 상태 최상단 표시**
- Given: 회원 상세 페이지 접속
- When: 페이지 로드 완료
- Then: 자격 상태 카드가 페이지 최상단에 표시됨 (스크롤 없이 확인 가능)

:red_circle: **SC-M16-006: D-Day 정확한 계산**
- Given: 회원의 마지막 참여일이 2024.12.15
- When: 자격 유지 기간 6개월 기준으로 계산
- Then: 만료일 2025.06.15 기준 D-Day 표시

:yellow_circle: **SC-M16-007: 참여 통계 정확성**
- Given: 회원이 12회 참여, 0회 노쇼, 2회 취소
- When: 회원 상세 페이지 조회
- Then: "총 참여: 12회 | 노쇼: 0회 | 취소: 2회" 정확히 표시

:yellow_circle: **SC-M16-008: 만료된 회원 상태 표시**
- Given: 회원의 자격이 만료됨
- When: 회원 상세 페이지 조회
- Then: "자격 만료" 배지 + "만료됨" 표시 (D-Day 대신)

#### 사용자 가치
> "운영자가 회원 상세 페이지 진입 즉시 자격 상태를 파악하고 문의에 빠르게 답변할 수 있다"

---

### Phase 16.3: 참여 이력 + 통계

**목표:** 회원의 모임 참여 내역을 시간순으로 조회하고 상태별로 구분

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 16.3.1 | 참여 이력 탭 컴포넌트 | `MemberHistoryTab.tsx` | 시간순 참여 내역 표시 |
| 16.3.2 | 이력 아이템 컴포넌트 | `HistoryItem.tsx` | 결제/취소/노쇼 상태 배지 |
| 16.3.3 | 참여 이력 API | `/api/admin/members/[id]/history/route.ts` | 페이지네이션 포함 |
| 16.3.4 | 이력 필터 구현 | FilterTabs 컴포넌트 | 전체/결제/취소/노쇼 |
| 16.3.5 | 모임 상세 링크 연결 | 링크 컴포넌트 | 클릭 시 모임 상세로 이동 |
| 16.3.6 | 결제 내역 탭 컴포넌트 | `MemberPaymentsTab.tsx` | 결제/환불 금액 표시 |

#### 참여 이력 UI 요구사항

```
+---------------------------------------------------------------+
| 참여 이력                                [전체] [결제] [취소]  |
+---------------------------------------------------------------+
| 2024.12.15 | 정기모임 #127 - 경주      | 결제완료 |  [상세]  |
| 2024.11.20 | 토론모임 #45 - 포항       | 결제완료 |  [상세]  |
| 2024.10.05 | 정기모임 #125 - 경주      | 취소     |  [상세]  |
| 2024.09.18 | 정기모임 #123 - 경주      | 결제완료 |  [상세]  |
| ...                                                           |
+---------------------------------------------------------------+
|                    < 1 2 3 4 5 >                               |
+---------------------------------------------------------------+
```

#### 상태별 배지 스타일

```typescript
const statusBadgeStyles = {
  confirmed: { label: '결제완료', class: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', class: 'bg-gray-100 text-gray-700' },
  no_show: { label: '노쇼', class: 'bg-red-100 text-red-700' },
  pending_transfer: { label: '입금대기', class: 'bg-yellow-100 text-yellow-700' },
  refunded: { label: '환불완료', class: 'bg-blue-100 text-blue-700' },
};
```

#### Scenario (검증 기준)

:red_circle: **SC-M16-009: 참여 이력 시간순 표시**
- Given: 회원이 여러 모임에 참여함
- When: 참여 이력 탭 클릭
- Then: 최신 참여부터 시간순으로 정렬되어 표시

:yellow_circle: **SC-M16-010: 이력 필터 동작**
- Given: 참여 이력이 표시된 상태
- When: "취소" 필터 선택
- Then: 취소된 신청 건만 필터링되어 표시

:yellow_circle: **SC-M16-011: 모임 상세 링크**
- Given: 참여 이력 목록이 표시된 상태
- When: 특정 이력의 [상세] 버튼 클릭
- Then: 해당 모임의 관리 상세 페이지로 이동

#### 사용자 가치
> "운영자가 회원의 참여 패턴과 히스토리를 파악하여 맞춤형 케어를 제공할 수 있다"

---

### Phase 16.4: 자격 수동 조정 + 메모 + 대시보드 위젯

**목표:** 예외 상황에서 자격을 수동으로 조정하고, 운영자 메모를 기록하며, 만료 예정 회원을 대시보드에서 확인

**예상 소요:** 3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 16.4.1 | 자격 조정 모달 컴포넌트 | `EligibilityAdjustModal.tsx` | 마지막 참여일 수정 폼 |
| 16.4.2 | 변경 사유 입력 필드 | 필수 입력 처리 | 빈 값이면 저장 불가 |
| 16.4.3 | 자격 조정 API | `/api/admin/members/[id]/eligibility/route.ts` | 변경 + 이력 기록 |
| 16.4.4 | 변경 이력 조회 UI | `EligibilityChangeHistory.tsx` | 누가 언제 왜 변경했는지 |
| 16.4.5 | 회원 메모 테이블 생성 | `migration-m16-member-notes.sql` | member_notes 테이블 |
| 16.4.6 | 메모 CRUD API | `/api/admin/members/[id]/notes/route.ts` | 작성/조회/삭제 |
| 16.4.7 | 메모 탭 컴포넌트 | `MemberNotesTab.tsx` | 메모 목록 + 작성 폼 |
| 16.4.8 | 자격 만료 예정 위젯 | `ExpiringMembersWidget.tsx` | 30일 내 만료 예정 목록 |
| 16.4.9 | 대시보드에 위젯 추가 | 대시보드 레이아웃 수정 | 위젯 렌더링 |
| 16.4.10 | 만료 예정 회원 API | `/api/admin/members/expiring/route.ts` | 30일 내 만료 회원 조회 |

#### DB 스키마 추가

```sql
-- migration-m16-member-notes.sql

-- 회원 메모 테이블
CREATE TABLE member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_member_notes_user_id ON member_notes(user_id);
CREATE INDEX idx_member_notes_created_at ON member_notes(created_at DESC);

-- RLS
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage member notes"
  ON member_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 자격 변경 이력 테이블
CREATE TABLE eligibility_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  old_date DATE,
  new_date DATE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_eligibility_changes_user_id ON eligibility_changes(user_id);

-- RLS
ALTER TABLE eligibility_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage eligibility changes"
  ON eligibility_changes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### 자격 조정 모달 UI

```
+---------------------------------------------------------------+
|               마지막 참여일 수정                      [X]      |
+---------------------------------------------------------------+
| 현재 마지막 참여일: 2024.06.15                                |
|                                                               |
| 새 마지막 참여일: [2024.12.01     ] [달력]                    |
|                                                               |
| 변경 사유: (필수)                                             |
| +-----------------------------------------------------------+ |
| | 운영상 예외로 인한 자격 연장                                | |
| | (예: 장기 출장으로 인한 불참 인정)                          | |
| +-----------------------------------------------------------+ |
|                                                               |
| [취소]                                       [변경 저장]      |
+---------------------------------------------------------------+
```

#### 메모 탭 UI

```
+---------------------------------------------------------------+
| 메모 (2)                                                      |
+---------------------------------------------------------------+
| [새 메모 작성]                                                |
| +-----------------------------------------------------------+ |
| |                                                           | |
| +-----------------------------------------------------------+ |
|                                             [저장]            |
+---------------------------------------------------------------+
| 2024.12.20 14:30 - 홍운영                                     |
| 전화 상담 진행. 장기 출장으로 인해 자격 연장 요청.            |
| 2025.01.15까지 자격 유지로 조정함.                            |
|                                              [삭제]           |
+---------------------------------------------------------------+
| 2024.11.05 10:15 - 홍운영                                     |
| 첫 모임 참여 후 적극적으로 활동 중. 칭찬 많이 받는 회원.      |
|                                              [삭제]           |
+---------------------------------------------------------------+
```

#### 대시보드 위젯 UI

```
+---------------------------------------------------------------+
| 자격 만료 예정 (30일 내)                            [더보기]  |
+---------------------------------------------------------------+
| 김지독      | D-15 | 2024.02.01 만료 예정                     |
| 이독서      | D-22 | 2024.02.08 만료 예정                     |
| 박책방      | D-28 | 2024.02.14 만료 예정                     |
+---------------------------------------------------------------+
| 총 5명의 회원이 30일 내 자격 만료 예정입니다.                  |
+---------------------------------------------------------------+
```

#### Scenario (검증 기준)

:red_circle: **SC-M16-012: 마지막 참여일 수동 수정**
- Given: 회원 상세 페이지에서 자격 조정 버튼 클릭
- When: 새 날짜와 사유 입력 후 저장
- Then: last_regular_meeting_at 업데이트 + eligibility_changes에 이력 기록

:red_circle: **SC-M16-013: 변경 사유 필수 입력**
- Given: 자격 조정 모달이 열린 상태
- When: 사유를 입력하지 않고 저장 시도
- Then: "변경 사유를 입력해주세요" 에러 표시, 저장 불가

:red_circle: **SC-M16-014: 자격 만료 예정 위젯**
- Given: 관리자 대시보드 접속
- When: 페이지 로드 완료
- Then: 30일 내 만료 예정 회원 목록이 위젯에 표시됨

:yellow_circle: **SC-M16-015: 회원 메모 작성**
- Given: 회원 상세 페이지의 메모 탭
- When: 메모 작성 후 저장
- Then: 메모가 저장되고 목록에 표시 (작성자, 시간 포함)

:yellow_circle: **SC-M16-016: 변경 이력 조회**
- Given: 자격이 수동 조정된 회원
- When: 변경 이력 확인
- Then: 이전 날짜, 새 날짜, 변경 사유, 변경자, 변경 시간 모두 표시

:green_circle: **SC-M16-017: 메모 삭제**
- Given: 메모가 작성된 상태
- When: 삭제 버튼 클릭 후 확인
- Then: 메모가 삭제되고 목록에서 제거됨

#### 사용자 가치
> "운영자가 예외 상황에서 회원 자격을 수동으로 조정하고, 케어 내역을 메모로 기록하며, 만료 예정 회원을 사전에 파악할 수 있다"

---

## 4. 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| UI | Tailwind CSS | 스타일링 |
| 테이블 | Custom Table Component | 회원 목록 |
| 검색 | debounce | 실시간 검색 최적화 |
| 날짜 | date-fns | D-Day 계산, 날짜 포맷 |
| 모달 | Radix Dialog | 자격 조정 모달 |
| API | Next.js Route Handlers | CRUD 엔드포인트 |
| DB | Supabase | 회원 데이터, 메모, 이력 |

---

## 5. 파일 구조

```
/app/admin/members
├── page.tsx                    # 회원 목록 페이지
└── [id]
    └── page.tsx                # 회원 상세 페이지

/components/admin/members
├── MemberListTable.tsx         # 회원 목록 테이블
├── MemberSearchFilter.tsx      # 검색 + 필터 컴포넌트
├── EligibilityStatusCard.tsx   # 자격 상태 카드
├── MemberBasicInfo.tsx         # 기본 정보 섹션
├── MemberStatsSummary.tsx      # 참여 통계 요약
├── MemberHistoryTab.tsx        # 참여 이력 탭
├── MemberPaymentsTab.tsx       # 결제 내역 탭
├── MemberNotesTab.tsx          # 메모 탭
├── HistoryItem.tsx             # 이력 아이템
├── EligibilityAdjustModal.tsx  # 자격 조정 모달
└── EligibilityChangeHistory.tsx # 변경 이력

/components/admin/dashboard
└── ExpiringMembersWidget.tsx   # 만료 예정 위젯

/app/api/admin/members
├── route.ts                    # GET 회원 목록
├── [id]
│   ├── route.ts                # GET 회원 상세
│   ├── eligibility
│   │   └── route.ts            # PATCH 자격 조정
│   ├── history
│   │   └── route.ts            # GET 참여 이력
│   └── notes
│       └── route.ts            # GET/POST/DELETE 메모
└── expiring
    └── route.ts                # GET 만료 예정 회원

/lib
├── member-eligibility.ts       # 자격 상태 계산 로직
└── admin/members.ts            # 회원 관리 서비스 함수

/types
└── member.ts                   # 회원 관련 타입 정의

/supabase
└── migration-m16-member-notes.sql  # DB 마이그레이션
```

---

## 6. 전체 완료 검증

### Phase 16.1 완료 조건
- [ ] 회원 목록 페이지 렌더링
- [ ] 이름/연락처 검색 동작
- [ ] 자격 상태 필터 동작
- [ ] 최근 활동순 정렬 동작
- [ ] 페이지네이션 동작

### Phase 16.2 완료 조건
- [ ] 회원 상세 페이지 렌더링
- [ ] 자격 상태 카드 최상단 표시
- [ ] D-Day 정확한 계산 및 표시
- [ ] 기본 정보 + 참여 통계 표시

### Phase 16.3 완료 조건
- [ ] 참여 이력 시간순 표시
- [ ] 상태별 필터 동작
- [ ] 모임 상세 링크 연결
- [ ] 결제 내역 탭 동작

### Phase 16.4 완료 조건
- [ ] 마지막 참여일 수동 수정 가능
- [ ] 변경 사유 필수 입력 검증
- [ ] 변경 이력 기록 및 조회
- [ ] 회원 메모 CRUD 동작
- [ ] 자격 만료 예정 위젯 대시보드 표시

### 전체 M16 완료 조건
- [ ] 모든 Phase 완료
- [ ] 모든 Scenario 통과
- [ ] "왜 신청이 안 되나요?" 문의에 **30초 내** 답변 가능
- [ ] TypeScript 에러 0개
- [ ] 빌드 성공
- [ ] main 머지 완료

---

## 7. 의존성 다이어그램

```
[M15 완료: 모임 관리]
├── 참가자 명단 데이터
├── 노쇼 처리 데이터
└── 모임-회원 연결 데이터
    |
    v
[Phase 16.1] 회원 목록 + 검색/필터
    |
    v
[Phase 16.2] 회원 상세 + 자격 상태 (Phase 16.1 완료 후)
    |
    v
[Phase 16.3] 참여 이력 + 통계 (Phase 16.2 완료 후)
    |
    v
[Phase 16.4] 자격 수동 조정 + 메모 + 위젯 (Phase 16.3 완료 후)
    |
    v
[M16 완료] -> M17 시작 가능
```

---

## 8. 위험 관리

| 위험 | 영향 | 대응 방안 |
|------|------|----------|
| 회원 수 증가 시 검색 성능 저하 | 응답 지연 | DB 인덱스 최적화, 검색 debounce 적용 |
| 자격 수동 조정 남용 | 데이터 무결성 | 변경 이력 필수 기록, 사유 필수 입력 |
| D-Day 계산 오류 | 잘못된 안내 | 타임존 처리 주의, date-fns 활용 |
| 메모 데이터 누적 | 스토리지 증가 | 오래된 메모 아카이빙 검토 (Post-MVP) |
| 권한 없는 접근 | 보안 이슈 | Admin 권한 미들웨어 체크 강화 |

---

## 9. API 명세 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/admin/members` | 회원 목록 (검색/필터/정렬/페이지) |
| GET | `/api/admin/members/[id]` | 회원 상세 + 통계 |
| GET | `/api/admin/members/[id]/history` | 참여 이력 |
| GET | `/api/admin/members/[id]/notes` | 메모 목록 |
| POST | `/api/admin/members/[id]/notes` | 메모 작성 |
| DELETE | `/api/admin/members/[id]/notes/[noteId]` | 메모 삭제 |
| PATCH | `/api/admin/members/[id]/eligibility` | 자격 조정 |
| GET | `/api/admin/members/expiring` | 만료 예정 회원 목록 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | 최초 작성 |
