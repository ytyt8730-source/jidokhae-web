# Work Package: MX-Bugfix - 테스트 발견 이슈 수정

---

**Milestone:** MX (임시 버그픽스)
**목표:** 로컬 테스트에서 발견된 이슈 일괄 수정
**기간:** 2~3일
**선행 조건:** 없음
**핵심 가치:** 안정성, 완성도

> ⚠️ **Note:** 이 워크패키지는 테스트에서 발견된 버그 수정을 위한 **임시 문서**입니다.
> 모든 이슈가 해결되면 이 문서와 관련 시나리오는 삭제됩니다.

---

## 1. Work Package 개요

MX는 **3개의 Phase**로 구성됩니다. 각 Phase가 끝나면 동작하는 소프트웨어 상태가 됩니다.

```
Phase 1: Critical 버그 수정
    ↓ [동작 확인: 대기자 취소, 입금대기 취소, 통계 자동 업데이트]
Phase 2: 기능 개선
    ↓ [동작 확인: 마이페이지 참여 완료 섹션, 모임별 필터]
Phase 3: UI/UX 수정
    ↓ [동작 확인: 토스페이 문구 제거, 반응형 수정]
```

---

## 2. 이슈 목록

### 🔴 Critical (3개)

| ID | 이슈 | 위치 | 수정 방향 |
|----|------|------|----------|
| MX-C01 | 대기자 취소 기능 없음 | `/meetings/[id]` | 대기 취소 버튼 및 API 구현 |
| MX-C02 | 입금대기 상태에서 취소 불가 | 마이페이지 | 입금대기 취소 버튼 추가 |
| MX-C03 | 참여 완료 시 통계 자동 업데이트 안 됨 | DB 트리거 | 트리거 또는 API 로직 추가 |

### 🟡 High (2개)

| ID | 이슈 | 위치 | 수정 방향 |
|----|------|------|----------|
| MX-H01 | 참여 완료 모임 마이페이지에 표시 안 됨 | `/mypage` | 참여 완료 섹션 추가 |
| MX-H02 | 입금대기 목록 모임별 필터 동작 안 함 | `/admin/transfers` | 필터 UI 연결 확인 |

### 🟢 Medium (4개)

| ID | 이슈 | 위치 | 수정 방향 |
|----|------|------|----------|
| MX-M01 | 토스페이 문구 제거 | 결제 모달 | 토스페이 관련 문구/아이콘 제거 |
| MX-M02 | 배너 관리 페이지 모바일 깨짐 | `/admin/banners` | 반응형 레이아웃 수정 |
| MX-M03 | 배너 이미지 업로드 기능 요청 | `/admin/banners` | Supabase Storage 연동 (선택) |
| MX-M04 | 모임 수정 모달 사용 요청 | `/admin/meetings` | 모달 형태로 변경 (선택) |

### 🔵 Low (3개)

| ID | 이슈 | 위치 | 수정 방향 |
|----|------|------|----------|
| MX-L01 | 콩 아이콘 색상 변경 | 전역 | 초록색 계열로 변경 |
| MX-L02 | 회원가입 닉네임 필드 추가 | `/auth/signup` | 닉네임 필드 추가 |
| MX-L03 | 브랜드 색상 문서 확인 | 문서 | 실제 사용 색상으로 수정 |

---

## 3. Phase 상세

### Phase 1: Critical 버그 수정

**목표:** 핵심 기능 정상 동작 보장
**예상 소요:** 1일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | 대기 취소 API 생성 | `/api/waitlists/cancel/route.ts` | DELETE 요청으로 대기 취소 |
| 1.2 | 대기 취소 버튼 UI | 모임 상세 페이지 | 대기 상태일 때 취소 버튼 표시 |
| 1.3 | 대기 취소 후 순번 재정렬 | API 로직 | 뒤 대기자 position -1 |
| 1.4 | 입금대기 취소 버튼 추가 | 마이페이지 | pending_transfer 상태에서 취소 가능 |
| 1.5 | 입금대기 취소 시 정원 복구 | API 로직 | current_participants -1 |
| 1.6 | 참여 완료 트리거 생성 | SQL 마이그레이션 | participation_status 변경 시 통계 업데이트 |
| 1.7 | users.total_participations 증가 | 트리거 | 참여 완료 시 +1 |
| 1.8 | users.last_regular_meeting_at 갱신 | 트리거 | 정기모임 완료 시 갱신 |

#### DB 스키마 변경

```sql
-- 참여 완료 시 사용자 통계 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_participation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- participation_status가 'completed'로 변경될 때
  IF NEW.participation_status = 'completed' AND 
     (OLD.participation_status IS NULL OR OLD.participation_status != 'completed') THEN
    
    UPDATE users SET
      total_participations = total_participations + 1,
      last_regular_meeting_at = CASE 
        WHEN (SELECT meeting_type FROM meetings WHERE id = NEW.meeting_id) = 'regular'
        THEN NOW()
        ELSE last_regular_meeting_at
      END
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participation_stats_trigger
AFTER UPDATE OF participation_status ON registrations
FOR EACH ROW EXECUTE FUNCTION update_user_participation_stats();
```

#### 대기 취소 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│ 대기 취소 플로우                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  사용자가 대기 중인 모임 상세 → "대기 취소" 버튼 클릭              │
│       ↓                                                         │
│  확인 모달: "대기를 취소하시겠습니까?"                             │
│       ↓                                                         │
│  API 호출: DELETE /api/waitlists/cancel                          │
│       ↓                                                         │
│  waitlists 테이블에서 해당 레코드 삭제                            │
│       ↓                                                         │
│  뒤 대기자 position 조정 (adjust_waitlist_positions 함수)         │
│       ↓                                                         │
│  성공 메시지: "대기가 취소되었습니다"                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 완료 검증

- [ ] 대기 상태 모임에서 "대기 취소" 버튼 표시
- [ ] 대기 취소 시 waitlists에서 삭제
- [ ] 대기 취소 시 뒤 대기자 순번 자동 조정
- [ ] 입금대기 상태에서 취소 버튼 표시
- [ ] 입금대기 취소 시 정원 복구
- [ ] 참여 완료 시 total_participations 자동 증가
- [ ] 정기모임 참여 완료 시 last_regular_meeting_at 갱신

---

### Phase 2: 기능 개선

**목표:** 누락된 UI 기능 추가
**예상 소요:** 0.5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | 마이페이지 참여 완료 섹션 추가 | `/mypage/page.tsx` | 과거 모임 목록 표시 |
| 2.2 | 참여 완료 모임에서 칭찬/후기 링크 | UI | 칭찬하기, 후기 쓰기 버튼 |
| 2.3 | 입금대기 목록 모임별 필터 연결 | `/admin/transfers` | 드롭다운 → 필터 동작 |
| 2.4 | 모임 선택 시 필터 API 호출 | 클라이언트 | 쿼리 파라미터로 필터 |

#### 마이페이지 참여 완료 섹션 추가

```tsx
// 참여 완료 등록 (과거 모임)
const completedRegistrations = (registrations || []).filter(
  r => r.participation_status === 'completed'
);
```

#### 완료 검증

- [ ] 마이페이지에 "참여 완료" 섹션 표시
- [ ] 참여 완료 모임에서 칭찬하기/후기 링크 동작
- [ ] 입금대기 목록에서 모임 선택 시 필터 동작

---

### Phase 3: UI/UX 수정

**목표:** 사용자 경험 개선
**예상 소요:** 0.5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | 토스페이 문구 제거 | 결제 모달 | 카카오페이만 표시 |
| 3.2 | 배너 관리 모바일 반응형 | CSS | 360px에서 정상 표시 |
| 3.3 | 배너 테이블 → 카드 레이아웃 | UI | 모바일에서 카드형 |
| 3.4 | 콩 아이콘 색상 변경 | 컴포넌트 | 갈색 → 초록색 |

#### 토스페이 문구 제거 위치

```
- 결제 모달 결제수단 선택 섹션
- 토스페이 아이콘
- 토스페이 관련 텍스트
```

#### 완료 검증

- [ ] 결제 모달에 토스페이 관련 내용 없음
- [ ] 배너 관리 페이지 모바일에서 정상 표시
- [ ] 콩 아이콘이 초록색으로 표시

---

## 4. 배포 시 주의사항

### DB 마이그레이션

| 순서 | 작업 | 롤백 가능 |
|------|------|:--------:|
| 1 | 트리거 함수 생성 | ✅ |
| 2 | 트리거 연결 | ✅ |
| 3 | 기존 데이터 통계 동기화 (선택) | ⚠️ |

### 배포 순서

```
1. DB 마이그레이션 (트리거)
2. API 수정 배포
3. 프론트엔드 배포
4. 검증
```

### 롤백 계획

```sql
-- 트리거 롤백
DROP TRIGGER IF EXISTS update_participation_stats_trigger ON registrations;
DROP FUNCTION IF EXISTS update_user_participation_stats();
```

---

## 5. MX 완료 검증 체크리스트

### 기능 검증

- [ ] 대기자가 대기 취소 가능
- [ ] 입금대기에서 취소 가능
- [ ] 참여 완료 시 통계 자동 업데이트
- [ ] 마이페이지에 참여 완료 모임 표시
- [ ] 입금대기 필터 동작

### UI 검증

- [ ] 토스페이 문구 없음
- [ ] 배너 관리 모바일 정상
- [ ] 콩 아이콘 색상 변경 (선택)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | WP-MX-Bugfix 최초 작성 |

