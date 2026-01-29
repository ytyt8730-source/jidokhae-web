-- =============================================
-- 지독해 테스트 데이터 삭제 (Cleanup)
-- 버전: 3.0.0
-- 최종 수정: 2026-01-29
-- =============================================
--
-- 사용법:
-- test-seed-data.sql로 생성한 테스트 데이터를 모두 삭제합니다.
-- 프로덕션 배포 전 또는 테스트 완료 후 실행하세요.
--
-- 삭제되는 항목:
-- - 테스트 계정 3개 (auth.users + public.users)
-- - [TEST] 접두사가 붙은 모든 데이터
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
-- STEP 7: 테스트 계정 삭제 (public.users)
-- =============================================
-- 참고: auth.users 삭제 시 trigger로 자동 삭제되지만, 명시적으로 처리
DELETE FROM users WHERE email IN ('super@test.com', 'admin@test.com', 'member@test.com');

-- =============================================
-- STEP 8: 테스트 계정 삭제 (auth.users)
-- =============================================
DELETE FROM auth.users WHERE email IN ('super@test.com', 'admin@test.com', 'member@test.com');

-- =============================================
-- 완료!
--
-- 삭제된 항목:
-- - 테스트 계정 3개 (super, admin, member)
-- - 테스트 모임 5개
-- - 테스트 등록/대기자
-- - 테스트 배너 3개
-- - 테스트 요청함 2개
--
-- 프로덕션 배포 준비 완료!
-- =============================================
