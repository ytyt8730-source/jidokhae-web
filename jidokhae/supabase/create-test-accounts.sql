-- =============================================
-- 테스트 계정 생성 (Supabase Auth Admin 방식)
-- =============================================
--
-- 방법 1: 아래 SQL 실행 (Supabase에서 지원하는 경우)
-- 방법 2: 실패 시 Dashboard에서 수동 생성
--
-- =============================================

-- Supabase auth.users 삽입 (instance_id 없이)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token
)
SELECT
  gen_random_uuid(),
  'super@test.com',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "최고관리자"}',
  'authenticated',
  'authenticated',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'super@test.com');

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token
)
SELECT
  gen_random_uuid(),
  'admin@test.com',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "운영자"}',
  'authenticated',
  'authenticated',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com');

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token
)
SELECT
  gen_random_uuid(),
  'member@test.com',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "테스트회원"}',
  'authenticated',
  'authenticated',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member@test.com');

-- 확인
SELECT email, created_at FROM auth.users
WHERE email IN ('super@test.com', 'admin@test.com', 'member@test.com');
