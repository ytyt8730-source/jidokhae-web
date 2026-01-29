-- =============================================
-- 지독해 테스트 데이터 삭제 (Cleanup)
-- 버전: 2.0.0
-- 최종 수정: 2026-01-29
-- =============================================
--
-- 사용법:
-- test-seed-data.sql로 생성한 테스트 데이터를 모두 삭제합니다.
-- 프로덕션 배포 전 또는 테스트 완료 후 실행하세요.
--
-- 주의: 테스트 계정(super/admin/member@test.com)은
--       Supabase Auth에서 직접 삭제해야 합니다.
--
-- =============================================

-- =============================================
-- STEP 1: 테스트 요청함 삭제
-- =============================================
DELETE FROM suggestions WHERE content LIKE '[TEST]%';

-- =============================================
-- STEP 2: 테스트 대기자 삭제
-- =============================================
DELETE FROM waitlists WHERE meeting_id IN (
  SELECT id FROM meetings WHERE title LIKE '[TEST]%'
);

-- =============================================
-- STEP 3: 테스트 등록 삭제
-- =============================================
DELETE FROM registrations WHERE meeting_id IN (
  SELECT id FROM meetings WHERE title LIKE '[TEST]%'
);

-- =============================================
-- STEP 4: 테스트 모임 삭제
-- =============================================
DELETE FROM meetings WHERE title LIKE '[TEST]%';

-- =============================================
-- STEP 5: 테스트 배너 삭제
-- =============================================
DELETE FROM banners WHERE title LIKE '[TEST]%';

-- =============================================
-- STEP 6: 테스트 계정 권한 삭제
-- =============================================
DELETE FROM admin_permissions WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('super@test.com', 'admin@test.com', 'member@test.com')
);

-- =============================================
-- STEP 7: 테스트 계정 역할 초기화 (선택)
-- =============================================
-- 계정은 유지하되 역할만 초기화하려면 아래 주석 해제
-- UPDATE users SET role = 'member' WHERE email IN ('super@test.com', 'admin@test.com');

-- =============================================
-- 완료!
--
-- 테스트 계정 자체를 삭제하려면:
-- Supabase Dashboard > Authentication > Users에서 직접 삭제
-- =============================================
