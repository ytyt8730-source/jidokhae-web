# 테스트 발견 이슈 목록

> **테스트 일시:** 2026-01-28  
> **테스터:** 사용자 (수동 테스트)  
> **환경:** 로컬 (localhost:3000) + Supabase Cloud

---

## 🔴 Critical (기능 미구현)

### ISSUE-001: 대기자 취소 기능 없음
- **위치:** 모임 상세 페이지 (`/meetings/[id]`)
- **현상:** 대기 등록한 모임에서 "마감되었습니다" 버튼만 표시되고 취소 불가
- **기대 동작:** 대기자가 대기 취소 버튼을 통해 대기 목록에서 빠질 수 있어야 함
- **영향:** 대기자가 다른 모임 신청을 원할 때 기존 대기를 취소할 수 없음

### ISSUE-002: 입금대기 상태에서 취소 불가
- **위치:** 마이페이지 → 입금대기 모임
- **현상:** 입금대기 상태의 모임을 취소할 수 없음
- **기대 동작:** 입금 전 취소 가능해야 함

### ISSUE-003: 참여 완료 시 사용자 통계 자동 업데이트 안 됨
- **위치:** DB 트리거 / 백엔드 로직
- **현상:** `participation_status = 'completed'`로 변경해도 `users.total_participations`가 자동 증가하지 않음
- **기대 동작:** 참여 완료 처리 시 자동으로 사용자 통계 업데이트
- **조치:** 트리거 추가 또는 API에서 처리 필요

## 🟡 High (기능 개선)

### ISSUE-003: 참여 완료 모임 마이페이지에 표시 안 됨
- **위치:** 마이페이지 (`/mypage`)
- **현상:** "내 신청 모임"에 다가오는 모임만 표시, 참여 완료 모임 없음
- **기대 동작:** 참여 완료 모임 섹션 추가 (후기 작성, 칭찬 보내기 링크 포함)
- **관련 코드:** `src/app/mypage/page.tsx` 62-64줄

### ISSUE-004: 모임 수정 시 모달 사용 요청
- **위치:** 운영자 페이지 → 모임 관리 (`/admin/meetings`)
- **현상:** 모임 수정 클릭 시 새 페이지로 이동
- **요청:** 모달 형태로 수정 UI 제공 (모바일 UX 개선)

---

## 🟢 Medium (UI/UX)

### ISSUE-005: 토스페이 문구 제거
- **위치:** 결제 모달 → 간편결제 탭
- **현상:** 토스페이 문구/아이콘이 표시되나 실제로는 미사용
- **조치:** 토스페이 관련 문구 제거 필요

### ISSUE-006: 배너 관리 페이지 모바일 깨짐
- **위치:** `/admin/banners` (360px)
- **현상:** 레이아웃이 깨짐
- **조치:** 반응형 레이아웃 수정 필요

### ISSUE-007: 배너 이미지 업로드 기능 요청
- **위치:** 배너 관리 페이지
- **현상:** URL 입력만 가능
- **요청:** 이미지 파일 직접 업로드 기능 추가

### ISSUE-008: 모임별 필터 UI 문제
- **위치:** 운영자 → 입금 관리 (`/admin/transfers`)
- **현상:** 모임별 필터가 보이지 않거나 동작하지 않음
- **기대 동작:** 드롭다운으로 모임 선택 시 해당 모임의 입금대기만 필터링

---

## 🔵 Low (디자인 요청)

### ISSUE-009: 콩 아이콘 색상 변경 요청
- **위치:** 모임 상세 페이지 → 참가비 영역
- **현상:** 콩 아이콘이 갈색
- **요청:** 초록색 계열로 변경 희망

### ISSUE-010: 회원가입 폼에 닉네임 필드 추가
- **위치:** 회원가입 페이지 (`/auth/signup`)
- **현상:** 이름만 입력받고 닉네임 필드 없음
- **요청:** 이름과 닉네임 둘 다 입력받도록 변경

### ISSUE-011: 브랜드 색상 문서 확인 필요
- **현상:** 테스트 가이드에 브랜드 색상이 `#c77654`로 명시되었으나 실제와 다름
- **조치:** 실제 사용 중인 브랜드 색상으로 문서 업데이트 필요

---

## ✅ 수정 완료

### FIXED-001: transfer_deadline null 오류
- **위치:** `/admin/transfers`
- **수정일:** 2026-01-28
- **수정 내용:** `getRemainingTime()` 함수에 null 체크 추가
- **파일:** `src/lib/transfer.ts`

### FIXED-002: Badge 테스트 실패
- **위치:** Unit Tests
- **수정일:** 2026-01-28
- **수정 내용:** Design System v3.3에 맞게 테스트 기대값 업데이트
- **파일:** `src/__tests__/components/ui/Badge.test.tsx`

---

## 📝 참고: 테스트 데이터 정리 SQL

테스트 완료 후 아래 쿼리로 테스트 데이터 정리:

```sql
-- 테스트 모임 삭제
DELETE FROM registrations WHERE meeting_id IN (
  SELECT id FROM meetings WHERE title LIKE '%테스트%' OR title LIKE '%1월%' OR title LIKE '%2월%' OR title LIKE '%3월%'
);
DELETE FROM waitlists WHERE meeting_id IN (
  SELECT id FROM meetings WHERE title LIKE '%테스트%' OR title LIKE '%1월%' OR title LIKE '%2월%' OR title LIKE '%3월%'
);
DELETE FROM meetings WHERE title LIKE '%테스트%' OR title LIKE '%1월%' OR title LIKE '%2월%' OR title LIKE '%3월%';

-- 테스트 계정 데이터 정리 (계정 자체는 유지)
DELETE FROM registrations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM waitlists WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM badges WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM praises WHERE from_user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
```

---

**문서 작성:** Claude  
**최종 수정:** 2026-01-28
