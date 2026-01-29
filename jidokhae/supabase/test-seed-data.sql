-- =============================================
-- 지독해 테스트용 시드 데이터 (통합 버전)
-- 버전: 3.0.0
-- 최종 수정: 2026-01-29
-- =============================================
--
-- 사용법:
-- 1. Supabase SQL Editor에서 이 파일 전체를 실행
-- 2. 테스트 완료 후 test-seed-cleanup.sql 실행하여 삭제
--
-- 생성되는 테스트 계정:
-- - super@test.com / test1234 (최고관리자)
-- - admin@test.com / test1234 (운영자)
-- - member@test.com / test1234 (일반회원)
--
-- =============================================

-- =============================================
-- STEP 0: 테스트 계정 생성 (auth.users)
-- =============================================
-- 참고: Supabase auth.users에 직접 삽입합니다.
-- 비밀번호 'test1234'의 bcrypt 해시를 사용합니다.

DO $$
DECLARE
  super_uid UUID;
  admin_uid UUID;
  member_uid UUID;
BEGIN
  -- 기존 테스트 계정이 있으면 건너뛰기
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'super@test.com') THEN
    super_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      super_uid,
      '00000000-0000-0000-0000-000000000000',
      'super@test.com',
      crypt('test1234', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "최고관리자"}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Created super@test.com';
  ELSE
    RAISE NOTICE 'super@test.com already exists, skipping...';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com') THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('test1234', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "운영자"}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Created admin@test.com';
  ELSE
    RAISE NOTICE 'admin@test.com already exists, skipping...';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member@test.com') THEN
    member_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      member_uid,
      '00000000-0000-0000-0000-000000000000',
      'member@test.com',
      crypt('test1234', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "테스트회원"}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Created member@test.com';
  ELSE
    RAISE NOTICE 'member@test.com already exists, skipping...';
  END IF;
END $$;

-- auth.users 생성 후 trigger가 public.users에 동기화할 시간을 줌
-- (Supabase의 handle_new_user trigger)

-- =============================================
-- STEP 1: 테스트 계정 역할 및 프로필 설정
-- =============================================

-- 잠시 대기 후 users 테이블 업데이트 (trigger 동기화 대기)
DO $$
BEGIN
  PERFORM pg_sleep(1);
END $$;

UPDATE users SET
  role = 'super_admin',
  name = '최고관리자',
  phone = '010-0000-0001',
  is_new_member = false,
  total_participations = 50
WHERE email = 'super@test.com';

UPDATE users SET
  role = 'admin',
  name = '운영자',
  phone = '010-0000-0002',
  is_new_member = false,
  total_participations = 30
WHERE email = 'admin@test.com';

UPDATE users SET
  role = 'member',
  name = '테스트회원',
  phone = '010-0000-0003',
  is_new_member = false,
  total_participations = 5,
  last_regular_meeting_at = NOW() - INTERVAL '7 days'
WHERE email = 'member@test.com';

-- admin에게 권한 부여
INSERT INTO admin_permissions (user_id, permission, granted_by)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  permission,
  (SELECT id FROM users WHERE email = 'super@test.com')
FROM unnest(ARRAY[
  'meeting_manage',
  'payment_manage',
  'dashboard_view',
  'banner_manage',
  'notification_send',
  'request_respond'
]) AS permission
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
ON CONFLICT (user_id, permission) DO NOTHING;

-- =============================================
-- STEP 2: 테스트 모임 데이터 (다양한 상태)
-- =============================================

-- 기존 테스트 모임 삭제
DELETE FROM meetings WHERE title LIKE '[TEST]%';

-- 다양한 상태의 모임 생성
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants, refund_policy_id) VALUES
  -- 예정된 모임들 (신청 가능)
  ('[TEST] 2월 1주차 정기모임', 'regular', NOW() + INTERVAL '7 days', '경주시 황성동 스타벅스 2층', 14, 5000,
   '테스트용 정기모임입니다. 신청 테스트에 사용하세요.', 'open', 0,
   (SELECT id FROM refund_policies WHERE meeting_type = 'regular' LIMIT 1)),

  -- 마감임박 모임 (정원 거의 참)
  ('[TEST] 2월 2주차 정기모임 (마감임박)', 'regular', NOW() + INTERVAL '14 days', '포항시 북구 양덕동 카페', 14, 5000,
   '마감임박 테스트용. 현재 12명 참여 중.', 'open', 12,
   (SELECT id FROM refund_policies WHERE meeting_type = 'regular' LIMIT 1)),

  -- 마감된 모임 (대기자 테스트용)
  ('[TEST] 2월 독서토론 (마감)', 'discussion', NOW() + INTERVAL '21 days', '경주시 동천동 북카페', 10, 10000,
   '정원 마감 테스트용. 대기 신청 테스트에 사용하세요.', 'open', 10,
   (SELECT id FROM refund_policies WHERE meeting_type = 'discussion' LIMIT 1)),

  -- 과거 모임 (참여 완료 테스트용)
  ('[TEST] 1월 4주차 정기모임 (종료)', 'regular', NOW() - INTERVAL '7 days', '경주시 황성동 스타벅스 2층', 14, 5000,
   '종료된 모임. 참여 완료, 칭찬하기 테스트에 사용하세요.', 'closed', 5,
   (SELECT id FROM refund_policies WHERE meeting_type = 'regular' LIMIT 1)),

  -- 먼 미래 모임 (환불 규정 테스트용)
  ('[TEST] 3월 독서토론', 'discussion', NOW() + INTERVAL '45 days', '포항시 남구 효자동', 8, 15000,
   '먼 미래 모임. 100% 환불 테스트에 사용하세요.', 'open', 0,
   (SELECT id FROM refund_policies WHERE meeting_type = 'discussion' LIMIT 1));

-- =============================================
-- STEP 3: 테스트 등록 데이터 (다양한 상태)
-- =============================================

-- member@test.com의 등록 데이터

-- 1. 참여 완료 상태 (칭찬하기/후기 테스트용)
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, participation_status, participation_method, seat_number, participation_count)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 1월 4주차 정기모임 (종료)'),
  'confirmed', 'paid', 'card', 5000, 'completed', 'confirm', 1, 5
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 2. 확정 상태 (예정된 모임)
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, seat_number, participation_count)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 2월 1주차 정기모임'),
  'confirmed', 'paid', 'card', 5000, 1, 6
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 3. 입금대기 상태 (입금대기 취소 테스트용) - admin 계정으로
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, transfer_sender_name, transfer_deadline, seat_number, participation_count)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 3월 독서토론'),
  'pending_transfer', 'pending', 'transfer', 15000, '0129_운영자', NOW() + INTERVAL '24 hours', 1, 31
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 마감임박 모임에 더미 참가자 추가 (12명)
-- super, admin을 마감임박 모임에 등록
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount)
SELECT
  (SELECT id FROM users WHERE email = 'super@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 2월 2주차 정기모임 (마감임박)'),
  'confirmed', 'paid', 'card', 5000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'super@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 마감 모임에 더미 참가자 채우기 (정원 10명 - super, admin 포함)
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount)
SELECT
  (SELECT id FROM users WHERE email = 'super@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 2월 독서토론 (마감)'),
  'confirmed', 'paid', 'card', 10000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'super@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 2월 독서토론 (마감)'),
  'confirmed', 'paid', 'card', 10000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- =============================================
-- STEP 4: 대기자 데이터 (대기 취소 테스트용)
-- =============================================

INSERT INTO waitlists (user_id, meeting_id, position, status)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  (SELECT id FROM meetings WHERE title = '[TEST] 2월 독서토론 (마감)'),
  1, 'waiting'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- =============================================
-- STEP 5: 배너 데이터
-- =============================================

DELETE FROM banners WHERE title LIKE '[TEST]%';

INSERT INTO banners (title, image_url, link_url, is_active, display_order, start_date, end_date) VALUES
  ('[TEST] 2월 모임 안내', 'https://picsum.photos/1200/400?random=101', '/meetings', true, 1, '2026-01-01', '2026-12-31'),
  ('[TEST] 신규 회원 환영', 'https://picsum.photos/1200/400?random=102', '/about', true, 2, '2026-01-01', '2026-12-31'),
  ('[TEST] 비활성 배너', 'https://picsum.photos/1200/400?random=103', '/meetings', false, 3, NULL, NULL);

-- =============================================
-- STEP 6: 요청함 데이터
-- =============================================

DELETE FROM suggestions WHERE content LIKE '[TEST]%';

INSERT INTO suggestions (user_id, content, status)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  '[TEST] 포항에서도 모임을 열어주세요!',
  'pending'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com');

INSERT INTO suggestions (user_id, content, status, answer, answered_by, answered_at)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  '[TEST] 주말 오전 모임도 가능할까요?',
  'answered',
  '좋은 의견 감사합니다! 검토해보겠습니다.',
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  NOW()
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com');

-- =============================================
-- STEP 7: 참가자 수 동기화
-- =============================================

UPDATE meetings SET current_participants = (
  SELECT COUNT(*) FROM registrations
  WHERE meeting_id = meetings.id AND status IN ('confirmed', 'pending_transfer')
) WHERE title LIKE '[TEST]%';

-- =============================================
-- 완료!
-- =============================================
--
-- 생성된 테스트 계정:
-- +-------------------+----------+-------------+
-- | 이메일            | 비밀번호 | 역할        |
-- +-------------------+----------+-------------+
-- | super@test.com    | test1234 | 최고관리자  |
-- | admin@test.com    | test1234 | 운영자      |
-- | member@test.com   | test1234 | 일반회원    |
-- +-------------------+----------+-------------+
--
-- 생성된 테스트 데이터:
-- - 모임 5개 (예정/마감임박/마감/종료/먼미래)
-- - 등록 다양한 상태 (confirmed, pending_transfer, completed)
-- - 대기자 1명 (member@test.com)
-- - 배너 3개
-- - 요청함 2개
--
-- 삭제 시: test-seed-cleanup.sql 실행
-- =============================================
