-- =============================================
-- 지독해 웹서비스 - RLS 무한 재귀 수정
-- 버전: 1.3.0
-- 실행일: 2026-01-22
-- =============================================
-- 문제: users 테이블의 RLS 정책이 자기 자신을 참조하여 무한 재귀 발생
-- 해결: SECURITY DEFINER 함수로 역할 확인 로직 분리
-- =============================================

-- =============================================
-- STEP 1: 역할 확인 헬퍼 함수 생성
-- =============================================
-- SECURITY DEFINER: RLS를 우회하여 실행
-- 이 함수는 현재 로그인한 사용자의 역할을 반환합니다.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 관리자 여부 확인 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 슈퍼 관리자 여부 확인 함수
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- STEP 2: 기존 문제 정책 삭제
-- =============================================

-- users 테이블
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for signup" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- refund_policies 테이블
DROP POLICY IF EXISTS "Anyone can view refund policies" ON refund_policies;
DROP POLICY IF EXISTS "Admins can manage refund policies" ON refund_policies;

-- meetings 테이블
DROP POLICY IF EXISTS "Anyone can view meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can manage meetings" ON meetings;

-- registrations 테이블
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can create own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON registrations;

-- waitlists 테이블
DROP POLICY IF EXISTS "Users can view own waitlist" ON waitlists;
DROP POLICY IF EXISTS "Users can join waitlist" ON waitlists;
DROP POLICY IF EXISTS "Users can leave waitlist" ON waitlists;
DROP POLICY IF EXISTS "Admins can manage waitlists" ON waitlists;

-- praises 테이블
DROP POLICY IF EXISTS "Users can view praises" ON praises;
DROP POLICY IF EXISTS "Users can send praise" ON praises;

-- badges 테이블
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
DROP POLICY IF EXISTS "System can insert badges" ON badges;

-- bookshelf 테이블
DROP POLICY IF EXISTS "Users can view own bookshelf" ON bookshelf;
DROP POLICY IF EXISTS "Users can manage own bookshelf" ON bookshelf;

-- reviews 테이블
DROP POLICY IF EXISTS "Anyone can view public reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- suggestions 테이블
DROP POLICY IF EXISTS "Users can view own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can manage suggestions" ON suggestions;

-- notification_templates 테이블
DROP POLICY IF EXISTS "Admins can manage templates" ON notification_templates;

-- notification_logs 테이블
DROP POLICY IF EXISTS "Users can view own logs" ON notification_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON notification_logs;

-- admin_permissions 테이블
DROP POLICY IF EXISTS "Admins can view permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON admin_permissions;

-- banners 테이블
DROP POLICY IF EXISTS "Anyone can view active banners" ON banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;

-- payment_logs 테이블
DROP POLICY IF EXISTS "Admins can view payment logs" ON payment_logs;

-- =============================================
-- STEP 3: 새로운 RLS 정책 생성 (헬퍼 함수 사용)
-- =============================================

-- ---------------------------------------------
-- 1. users 테이블
-- ---------------------------------------------
-- 자기 프로필 조회 (본인만)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- 관리자는 모든 사용자 조회 (헬퍼 함수 사용으로 재귀 방지)
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (public.is_admin());

-- 자기 프로필 수정
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 회원가입 시 INSERT 허용 (auth.uid()와 id가 일치해야 함)
CREATE POLICY "users_insert_signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------
-- 2. refund_policies 테이블
-- ---------------------------------------------
CREATE POLICY "refund_policies_select_all" ON refund_policies
  FOR SELECT USING (true);

CREATE POLICY "refund_policies_admin_all" ON refund_policies
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 3. meetings 테이블
-- ---------------------------------------------
CREATE POLICY "meetings_select_all" ON meetings
  FOR SELECT USING (true);

CREATE POLICY "meetings_admin_all" ON meetings
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 4. registrations 테이블
-- ---------------------------------------------
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations_update_own" ON registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "registrations_admin_all" ON registrations
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 5. waitlists 테이블
-- ---------------------------------------------
CREATE POLICY "waitlists_select_own" ON waitlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "waitlists_insert_own" ON waitlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "waitlists_delete_own" ON waitlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "waitlists_admin_all" ON waitlists
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 6. praises 테이블
-- ---------------------------------------------
CREATE POLICY "praises_select_all" ON praises
  FOR SELECT USING (true);

CREATE POLICY "praises_insert_own" ON praises
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- ---------------------------------------------
-- 7. badges 테이블
-- ---------------------------------------------
CREATE POLICY "badges_select_all" ON badges
  FOR SELECT USING (true);

-- 배지는 시스템(트리거/함수)에서 부여하므로 service_role 사용
-- 클라이언트에서 직접 INSERT 불가
CREATE POLICY "badges_insert_system" ON badges
  FOR INSERT WITH CHECK (public.is_admin());

-- ---------------------------------------------
-- 8. bookshelf 테이블
-- ---------------------------------------------
CREATE POLICY "bookshelf_select_own" ON bookshelf
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookshelf_insert_own" ON bookshelf
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookshelf_update_own" ON bookshelf
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookshelf_delete_own" ON bookshelf
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 9. reviews 테이블
-- ---------------------------------------------
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 10. suggestions 테이블
-- ---------------------------------------------
CREATE POLICY "suggestions_select_own" ON suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "suggestions_insert_own" ON suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "suggestions_admin_all" ON suggestions
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 11. notification_templates 테이블
-- ---------------------------------------------
CREATE POLICY "notification_templates_admin_all" ON notification_templates
  FOR ALL USING (public.is_admin());

-- 일반 사용자도 템플릿 조회 가능 (알림 미리보기 등)
CREATE POLICY "notification_templates_select_all" ON notification_templates
  FOR SELECT USING (true);

-- ---------------------------------------------
-- 12. notification_logs 테이블
-- ---------------------------------------------
CREATE POLICY "notification_logs_select_own" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_logs_admin_select" ON notification_logs
  FOR SELECT USING (public.is_admin());

-- 로그 INSERT는 서버(service_role)에서만
CREATE POLICY "notification_logs_insert_admin" ON notification_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- ---------------------------------------------
-- 13. admin_permissions 테이블
-- ---------------------------------------------
CREATE POLICY "admin_permissions_select_admin" ON admin_permissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_permissions_super_admin_all" ON admin_permissions
  FOR ALL USING (public.is_super_admin());

-- ---------------------------------------------
-- 14. banners 테이블
-- ---------------------------------------------
CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "banners_admin_all" ON banners
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------
-- 15. payment_logs 테이블
-- ---------------------------------------------
CREATE POLICY "payment_logs_admin_select" ON payment_logs
  FOR SELECT USING (public.is_admin());

-- 결제 로그 INSERT는 서버(service_role)에서만
CREATE POLICY "payment_logs_insert_admin" ON payment_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- =============================================
-- STEP 4: handle_new_user 함수 수정
-- =============================================
-- 회원가입 시 auth.users → public.users 동기화
-- INSERT 정책이 auth.uid() = id를 요구하므로 SECURITY DEFINER 필수

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, is_new_member, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '회원'),
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
-- 완료!
-- 스키마 버전: 1.3.0
-- =============================================
--
-- 변경 사항:
-- 1. get_my_role(), is_admin(), is_super_admin() 헬퍼 함수 추가
-- 2. 모든 RLS 정책을 헬퍼 함수 사용하도록 변경
-- 3. users 테이블 자기 참조 무한 재귀 문제 해결
-- 4. 정책 이름을 더 명확하게 변경 (테이블명_작업_대상)
-- 5. handle_new_user 함수 개선 (이름 기본값 '회원')
--
-- 실행 방법:
-- Supabase Dashboard > SQL Editor에서 이 파일 전체 실행
-- =============================================
