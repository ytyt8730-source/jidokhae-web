-- =============================================
-- Migration: Add nickname column to users table
-- Date: 2026-02-16
-- Description: 닉네임 필드 추가 (필수, 2-6자, UNIQUE)
--              + handle_new_user() 트리거 업데이트
-- Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- =============================================
-- Part 1: 닉네임 컬럼 추가
-- =============================================

-- 1. nickname 컬럼 추가 (기존 사용자를 위해 initially nullable)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(6);

-- 2. 기존 사용자에게 이름의 첫 2글자로 기본 닉네임 설정 (중복 방지)
-- 예: 김영희→'김영', 김영수→'김영1', 김영호→'김영2'
DO $$
DECLARE
  r RECORD;
  base_nick VARCHAR(6);
  final_nick VARCHAR(6);
  suffix INT;
BEGIN
  FOR r IN SELECT id, name FROM public.users WHERE nickname IS NULL ORDER BY created_at ASC
  LOOP
    base_nick := SUBSTRING(r.name FROM 1 FOR 2);
    IF LENGTH(base_nick) < 2 THEN
      base_nick := r.name || '0';
    END IF;

    -- 중복 체크 후 숫자 접미사 추가
    final_nick := base_nick;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM public.users WHERE nickname = final_nick AND id != r.id)
    LOOP
      final_nick := base_nick || suffix::text;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.users SET nickname = final_nick WHERE id = r.id;
  END LOOP;
END $$;

-- 3. NOT NULL 제약조건 추가
ALTER TABLE public.users
  ALTER COLUMN nickname SET NOT NULL;

-- 4. 길이 제약조건 추가 (2-6자)
ALTER TABLE public.users
  ADD CONSTRAINT chk_nickname_length CHECK (
    LENGTH(nickname) >= 2 AND LENGTH(nickname) <= 6
  );

-- 5. UNIQUE 제약조건 추가
ALTER TABLE public.users
  ADD CONSTRAINT uq_users_nickname UNIQUE (nickname);

-- =============================================
-- Part 2: handle_new_user() 트리거 업데이트
-- 신규 가입 시 닉네임 자동 생성 포함
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_base_nick VARCHAR(6);
  v_nickname VARCHAR(6);
  v_suffix INT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '회원');
  v_base_nick := SUBSTRING(v_name FROM 1 FOR 2);
  IF LENGTH(v_base_nick) < 2 THEN
    v_base_nick := v_name || '0';
  END IF;

  v_nickname := v_base_nick;
  v_suffix := 1;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE nickname = v_nickname)
  LOOP
    v_nickname := v_base_nick || v_suffix::text;
    v_suffix := v_suffix + 1;
    IF v_suffix > 999 THEN EXIT; END IF;
  END LOOP;

  INSERT INTO public.users (id, email, name, nickname, phone, role, is_new_member, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_nickname,
    NEW.raw_user_meta_data->>'phone',
    'member',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 검증 쿼리 (실행 후 확인용)
-- =============================================
-- SELECT id, name, nickname FROM public.users ORDER BY created_at;
-- SELECT COUNT(*) AS total, COUNT(DISTINCT nickname) AS unique_nicks FROM public.users;

-- =============================================
-- Rollback:
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS uq_users_nickname;
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_nickname_length;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS nickname;
-- (handle_new_user 롤백은 schema-complete.sql의 이전 버전으로 복원)
-- =============================================
