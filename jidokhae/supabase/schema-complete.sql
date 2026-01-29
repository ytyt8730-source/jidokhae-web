-- =============================================
-- 지독해 웹서비스 - 통합 스키마
-- 버전: 2.0.0
-- 최종 업데이트: 2026-01-29
-- =============================================
-- 이 파일 하나로 전체 DB 초기화 가능
-- 실행: Supabase Dashboard > SQL Editor > 이 파일 전체 실행
-- =============================================
-- 주의: 모든 기존 데이터가 삭제됩니다!
-- =============================================

-- #############################################
-- PART 1: 스키마 초기화 (테이블, 인덱스)
-- #############################################

-- =============================================
-- STEP 1: 기존 테이블 삭제 (외래키 의존성 순서)
-- =============================================

DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS suggestions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookshelf CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS praises CASCADE;
DROP TABLE IF EXISTS waitlists CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS refund_policies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_meeting_participants() CASCADE;
DROP FUNCTION IF EXISTS check_and_reserve_capacity(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_dormant_risk_users(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_waitlist_positions(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS assign_seat_number() CASCADE;
DROP FUNCTION IF EXISTS calculate_participation_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_participation_count() CASCADE;
DROP FUNCTION IF EXISTS update_user_participation_stats() CASCADE;

-- =============================================
-- STEP 2: 테이블 생성
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'super_admin')),
  auth_provider VARCHAR(20) DEFAULT 'email',
  profile_image_url TEXT,
  is_new_member BOOLEAN DEFAULT true,
  first_regular_meeting_at TIMESTAMP WITH TIME ZONE,
  last_regular_meeting_at TIMESTAMP WITH TIME ZONE,
  total_participations INTEGER DEFAULT 0,
  consecutive_weeks INTEGER DEFAULT 0,
  total_praises_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. refund_policies
CREATE TABLE refund_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('regular', 'discussion', 'other')),
  rules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO refund_policies (name, meeting_type, rules) VALUES
  ('정기모임', 'regular', '[{"days_before": 3, "refund_percent": 100}, {"days_before": 2, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]'::jsonb),
  ('토론모임', 'discussion', '[{"days_before": 14, "refund_percent": 100}, {"days_before": 7, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]'::jsonb);

-- 3. meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('regular', 'discussion', 'other')),
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200) NOT NULL,
  capacity INTEGER DEFAULT 14,
  fee INTEGER NOT NULL,
  description TEXT,
  refund_policy_id UUID REFERENCES refund_policies(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meetings_datetime ON meetings(datetime);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);

-- 4. registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'pending_transfer', 'confirmed', 'cancelled')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refunded', 'refund_pending')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'transfer')),
  payment_amount INTEGER,
  refund_amount INTEGER DEFAULT 0,
  cancel_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  -- 계좌이체 전용 필드
  transfer_sender_name VARCHAR(100),
  transfer_deadline TIMESTAMP WITH TIME ZONE,
  -- 환불 계좌 정보
  refund_info JSONB,
  refund_completed_at TIMESTAMP WITH TIME ZONE,
  -- 참여 완료 관련
  participation_status VARCHAR(20) CHECK (participation_status IN ('completed', 'no_show')),
  participation_method VARCHAR(20) CHECK (participation_method IN ('praise', 'review', 'confirm', 'auto', 'admin')),
  -- M9: 티켓 시스템
  seat_number INTEGER,
  participation_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_meeting_id ON registrations(meeting_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_pending_transfer ON registrations(status, transfer_deadline)
  WHERE status = 'pending_transfer';
CREATE INDEX idx_registrations_refund_pending ON registrations(payment_status)
  WHERE payment_status = 'refund_pending';
CREATE INDEX idx_registrations_seat ON registrations(meeting_id, seat_number)
  WHERE status IN ('confirmed', 'pending_payment', 'pending_transfer');

-- 5. waitlists
CREATE TABLE waitlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired', 'converted')),
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

CREATE INDEX idx_waitlists_meeting_id ON waitlists(meeting_id);
CREATE INDEX idx_waitlists_status ON waitlists(status);

-- 6. praises
CREATE TABLE praises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, meeting_id)
);

CREATE INDEX idx_praises_to_user_id ON praises(to_user_id);

-- 7. badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- 8. bookshelf
CREATE TABLE bookshelf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100),
  one_line_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title, author)
);

CREATE INDEX idx_bookshelf_user_id ON bookshelf(user_id);

-- 9. reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

-- 10. suggestions
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  answer TEXT,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. notification_templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  send_timing VARCHAR(100),
  send_days_before INTEGER,
  send_time TIME,
  kakao_template_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. notification_logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_code VARCHAR(50),
  phone_number VARCHAR(20),
  status VARCHAR(20) CHECK (status IN ('sent', 'failed', 'pending')),
  message_id VARCHAR(100),
  error_message TEXT,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

-- 13. admin_permissions
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission VARCHAR(50) NOT NULL CHECK (permission IN (
    'meeting_manage', 'payment_manage', 'notification_send', 'banner_manage',
    'request_respond', 'dashboard_view', 'template_manage'
  )),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- 14. banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. payment_logs
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  payment_id VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50),
  amount INTEGER NOT NULL,
  status VARCHAR(20) CHECK (status IN ('paid', 'cancelled', 'failed')),
  raw_data JSONB,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_idempotency_key ON payment_logs(idempotency_key);

-- #############################################
-- PART 2: 헬퍼 함수 (RLS 무한 재귀 방지)
-- #############################################

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- #############################################
-- PART 3: RLS 정책
-- #############################################

-- 1. users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (public.is_admin());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_signup" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. refund_policies
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refund_policies_select_all" ON refund_policies FOR SELECT USING (true);
CREATE POLICY "refund_policies_admin_all" ON refund_policies FOR ALL USING (public.is_admin());

-- 3. meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings_select_all" ON meetings FOR SELECT USING (true);
CREATE POLICY "meetings_admin_all" ON meetings FOR ALL USING (public.is_admin());

-- 4. registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations_select_own" ON registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "registrations_insert_own" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "registrations_update_own" ON registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "registrations_admin_all" ON registrations FOR ALL USING (public.is_admin());

-- 5. waitlists
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlists_select_own" ON waitlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "waitlists_insert_own" ON waitlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "waitlists_delete_own" ON waitlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "waitlists_admin_all" ON waitlists FOR ALL USING (public.is_admin());

-- 6. praises
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "praises_select_all" ON praises FOR SELECT USING (true);
CREATE POLICY "praises_insert_own" ON praises FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 7. badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_insert_system" ON badges FOR INSERT WITH CHECK (public.is_admin());

-- 8. bookshelf
ALTER TABLE bookshelf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookshelf_select_own" ON bookshelf FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookshelf_insert_own" ON bookshelf FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookshelf_update_own" ON bookshelf FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookshelf_delete_own" ON bookshelf FOR DELETE USING (auth.uid() = user_id);

-- 9. reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- 10. suggestions
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions_select_own" ON suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suggestions_insert_own" ON suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suggestions_admin_all" ON suggestions FOR ALL USING (public.is_admin());

-- 11. notification_templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates_select_all" ON notification_templates FOR SELECT USING (true);
CREATE POLICY "notification_templates_admin_all" ON notification_templates FOR ALL USING (public.is_admin());

-- 12. notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_logs_select_own" ON notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_logs_admin_select" ON notification_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "notification_logs_insert_admin" ON notification_logs FOR INSERT WITH CHECK (public.is_admin());

-- 13. admin_permissions
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_permissions_select_admin" ON admin_permissions FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_permissions_super_admin_all" ON admin_permissions FOR ALL USING (public.is_super_admin());

-- 14. banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_select_active" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "banners_admin_all" ON banners FOR ALL USING (public.is_admin());

-- 15. payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_logs_admin_select" ON payment_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "payment_logs_insert_admin" ON payment_logs FOR INSERT WITH CHECK (public.is_admin());

-- #############################################
-- PART 4: 비즈니스 로직 함수
-- #############################################

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 참가자 수 관리
CREATE OR REPLACE FUNCTION update_meeting_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- 참가 확정 시 정원 증가
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'pending_transfer')) THEN
    UPDATE meetings SET current_participants = current_participants + 1 WHERE id = NEW.meeting_id;
  END IF;

  -- 계좌이체 입금대기 시 정원 즉시 예약
  IF NEW.status = 'pending_transfer' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE meetings SET current_participants = current_participants + 1 WHERE id = NEW.meeting_id;
  END IF;

  -- 취소 시 정원 복구
  IF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'pending_transfer') THEN
    UPDATE meetings SET current_participants = GREATEST(current_participants - 1, 0) WHERE id = NEW.meeting_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 정원 확인 및 예약
CREATE OR REPLACE FUNCTION check_and_reserve_capacity(p_meeting_id UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_current_count INTEGER;
  v_capacity INTEGER;
  v_meeting_status VARCHAR(20);
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing FROM registrations
  WHERE meeting_id = p_meeting_id AND user_id = p_user_id AND status != 'cancelled';
  IF v_existing IS NOT NULL THEN RETURN QUERY SELECT FALSE, 'ALREADY_REGISTERED'::TEXT; RETURN; END IF;

  SELECT current_participants, capacity, status INTO v_current_count, v_capacity, v_meeting_status
  FROM meetings WHERE id = p_meeting_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'MEETING_NOT_FOUND'::TEXT; RETURN; END IF;
  IF v_meeting_status != 'open' THEN RETURN QUERY SELECT FALSE, 'MEETING_CLOSED'::TEXT; RETURN; END IF;
  IF v_current_count >= v_capacity THEN RETURN QUERY SELECT FALSE, 'CAPACITY_EXCEEDED'::TEXT; RETURN; END IF;

  INSERT INTO registrations (user_id, meeting_id, status) VALUES (p_user_id, p_meeting_id, 'pending');
  RETURN QUERY SELECT TRUE, 'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 신규 회원 동기화
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

-- 휴면 위험 회원 조회
CREATE OR REPLACE FUNCTION public.get_dormant_risk_users(
  three_months_ago TIMESTAMP WITH TIME ZONE,
  five_months_ago TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  phone VARCHAR,
  last_participation_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.phone,
    u.last_regular_meeting_at as last_participation_at
  FROM users u
  WHERE u.is_new_member = false
    AND u.phone IS NOT NULL
    AND u.last_regular_meeting_at <= three_months_ago
    AND u.last_regular_meeting_at > five_months_ago;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 대기자 순번 조정
CREATE OR REPLACE FUNCTION public.adjust_waitlist_positions(
  p_meeting_id UUID,
  p_removed_position INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE waitlists
  SET position = position - 1
  WHERE meeting_id = p_meeting_id
    AND position > p_removed_position
    AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- M9: 좌석 번호 자동 부여
CREATE OR REPLACE FUNCTION assign_seat_number()
RETURNS TRIGGER AS $$
DECLARE
  next_seat INTEGER;
BEGIN
  IF NEW.seat_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(seat_number), 0) + 1
  INTO next_seat
  FROM registrations
  WHERE meeting_id = NEW.meeting_id
    AND status IN ('confirmed', 'pending_payment', 'pending_transfer');

  NEW.seat_number := next_seat;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- M9: 참여 횟수 계산
CREATE OR REPLACE FUNCTION calculate_participation_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM registrations r
    JOIN meetings m ON r.meeting_id = m.id
    WHERE r.user_id = p_user_id
      AND r.status = 'confirmed'
      AND m.datetime < NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- M9: 참여 횟수 자동 업데이트
CREATE OR REPLACE FUNCTION update_participation_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.participation_count := calculate_participation_count(NEW.user_id) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- MX: 참여 완료 시 사용자 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_participation_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_meeting_type text;
BEGIN
  IF NEW.participation_status = 'completed' AND
     (OLD.participation_status IS NULL OR OLD.participation_status != 'completed') THEN

    SELECT meeting_type INTO v_meeting_type
    FROM meetings
    WHERE id = NEW.meeting_id;

    UPDATE users SET
      total_participations = COALESCE(total_participations, 0) + 1,
      last_regular_meeting_at = CASE
        WHEN v_meeting_type = 'regular' THEN NOW()
        ELSE last_regular_meeting_at
      END,
      updated_at = NOW()
    WHERE id = NEW.user_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION update_user_participation_stats() TO service_role;

-- #############################################
-- PART 5: 트리거
-- #############################################

-- updated_at 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 참가자 수 트리거
CREATE TRIGGER update_participants_on_registration_change AFTER INSERT OR UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_meeting_participants();

-- auth.users 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- M9: 좌석 번호 트리거
CREATE TRIGGER tr_assign_seat_number
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION assign_seat_number();

-- M9: 참여 횟수 트리거
CREATE TRIGGER tr_update_participation_count
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_participation_count();

-- MX: 참여 완료 통계 트리거
CREATE TRIGGER update_participation_stats_trigger
AFTER UPDATE OF participation_status ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_user_participation_stats();

-- #############################################
-- PART 6: 초기 데이터 (알림 템플릿)
-- #############################################

INSERT INTO notification_templates (code, name, description, message_template, variables, send_timing, send_days_before, send_time, is_active) VALUES
  -- 모임 리마인드 (3종)
  ('REMINDER_3D', '모임 리마인드 (3일 전)', '모임 3일 전 리마인드 알림', '[지독해] #{모임명} 리마인드

안녕하세요, #{이름}님!

#{날짜} #{시간}에 #{모임명}이 있어요.

장소: #{장소}
참가비: #{참가비}콩

즐거운 모임 되세요!', '["이름", "모임명", "날짜", "시간", "장소", "참가비"]'::jsonb, '모임 3일 전 오전 7시', 3, '07:00:00', true),

  ('REMINDER_1D', '모임 리마인드 (1일 전)', '모임 1일 전 리마인드 알림', '[지독해] #{모임명} 내일이에요!

안녕하세요, #{이름}님!

내일 #{시간}에 #{모임명}이 있어요.
#{티저_문구}

장소: #{장소}

내일 뵙겠습니다!', '["모임명", "이름", "시간", "장소", "티저_문구"]'::jsonb, '모임 1일 전 오전 7시', 1, '07:00:00', true),

  ('REMINDER_0D', '모임 리마인드 (당일)', '모임 당일 리마인드 알림', '[지독해] 오늘 #{모임명}!

안녕하세요, #{이름}님!

오늘 #{시간}에 #{장소}에서 만나요!

즐거운 시간 되세요!', '["이름", "모임명", "시간", "장소"]'::jsonb, '모임 당일 오전 7시', 0, '07:00:00', true),

  -- 대기자 알림
  ('WAITLIST_AVAILABLE', '대기자 자리 발생', '대기자에게 자리 발생 알림', '[지독해] #{모임명} 자리가 났어요!

#{이름}님, #{모임명}에 자리가 발생했습니다.

#{응답시간}까지 결제를 완료해주세요.
기한 내 결제하지 않으면 다음 대기자에게 기회가 넘어갑니다.

지금 바로 확인하기: #{링크}', '["이름", "모임명", "응답시간", "링크"]'::jsonb, '자리 발생 즉시', NULL, NULL, true),

  -- 월말 참여 독려
  ('MONTHLY_ENCOURAGE', '월말 참여 독려', '월말에 아직 참여하지 않은 회원 독려', '[지독해] #{월}월도 함께해요!

#{이름}님, #{월}월 모임에 아직 참여하지 않으셨네요.

이번 달 모임:
#{모임목록}

함께 독서의 즐거움을 나눠요!', '["이름", "월", "모임목록"]'::jsonb, '매월 15일, 25일', NULL, '10:00:00', true),

  -- 모임 후 피드백 요청
  ('POST_MEETING', '모임 후 어떠셨어요', '모임 종료 후 피드백 요청', '[지독해] #{모임명} 어떠셨나요?

#{이름}님, #{모임명}에 함께해주셔서 감사합니다!

다른 분께 칭찬을 보내거나, 후기를 남겨주세요.

피드백 남기기: #{링크}', '["이름", "모임명", "링크"]'::jsonb, '모임 종료 3일 후', -3, '10:00:00', true),

  -- 신규 회원 환영
  ('WELCOME', '첫 모임 환영', '신규 회원 첫 모임 전날 환영 알림', '[지독해] #{이름}님 환영합니다!

내일 #{시간}에 #{모임명}에서 처음 만나뵙네요.

장소: #{장소}

함께하게 되어 기뻐요. 편하게 오세요!', '["이름", "모임명", "시간", "장소"]'::jsonb, '첫 모임 1일 전 저녁 8시', 1, '20:00:00', true),

  -- 자격 만료 임박
  ('ELIGIBILITY_WARNING', '자격 만료 임박', '정기모임 자격 만료 임박 알림', '[지독해] #{회원명}님, 자격 만료가 임박했어요!

안녕하세요!

토론모임 등 특별 모임 참가 자격이
#{남은일수}일 후 만료됩니다.

정기모임에 참여하시면 자격이 갱신됩니다!
지금 바로 모임 일정을 확인해보세요.

[정기모임 보러가기]', '["회원명", "남은일수"]'::jsonb, '매주 월요일', NULL, '10:00:00', true),

  -- 휴면 위험
  ('DORMANT_RISK', '휴면 위험 알림', '3개월 이상 미참여 회원 알림', '[지독해] #{이름}님 보고싶어요!

지독해 모임에 오신 지 오래되었네요.
마지막 참여: #{마지막참여일}

이번 달 모임:
#{모임목록}

다시 만나요!', '["이름", "마지막참여일", "모임목록"]'::jsonb, '마지막 참여 3개월 후', NULL, '10:00:00', true),

  -- 계좌이체 알림 (4종)
  ('TRANSFER_PENDING', '계좌이체 입금대기 안내', '계좌이체 신청 후 입금 안내', '#{이름}님, #{모임명} 신청이 접수되었습니다.

입금 계좌: #{은행} #{계좌번호}
입금액: #{금액}콩
입금자명: #{입금자명형식}
입금 기한: #{기한}

입금 확인 후 참가가 확정됩니다.', '["이름", "모임명", "은행", "계좌번호", "금액", "입금자명형식", "기한"]'::jsonb, '입금대기 등록 시', NULL, NULL, true),

  ('TRANSFER_CONFIRMED', '계좌이체 입금확인 완료', '운영자 입금 확인 후 참가 확정 알림', '#{이름}님, #{모임명} 입금이 확인되었습니다.

참가가 확정되었습니다. 즐거운 모임 되세요!', '["이름", "모임명"]'::jsonb, '운영자 입금 확인 시', NULL, NULL, true),

  ('TRANSFER_EXPIRED', '계좌이체 입금기한 만료', '24시간 미입금 자동 취소 알림', '#{이름}님, #{모임명} 입금 기한이 만료되어 신청이 자동 취소되었습니다.

다시 신청하시려면 지독해 웹사이트를 방문해주세요.', '["이름", "모임명"]'::jsonb, '24시간 미입금 자동 취소 시', NULL, NULL, true),

  ('REFUND_ACCOUNT_RECEIVED', '환불 계좌 접수 완료', '환불 계좌 수집 완료 알림', '#{이름}님, #{모임명} 취소 요청이 접수되었습니다.

환불 예정 금액: #{환불금액}콩
환불 계좌: #{은행} #{계좌번호}

영업일 기준 2-3일 내 환불됩니다.', '["이름", "모임명", "환불금액", "은행", "계좌번호"]'::jsonb, '환불 계좌 수집 완료 시', NULL, NULL, true),

  -- M6: 신규 회원 알림
  ('NEW_MEMBER_WELCOME', '신규 회원 첫 모임 환영', '신규 회원의 첫 정기모임 전날 발송되는 환영 알림', '[지독해] #{회원명}님, 내일 첫 모임이에요!

안녕하세요! 지독해에 오신 걸 환영해요.

내일 #{시간}에 #{장소}에서 만나요.

준비물: 읽고 있는 책 (없어도 괜찮아요!)
장소: #{장소}
참가비: #{참가비}콩 (이미 결제 완료!)

처음이라 걱정되시죠?
걱정 마세요, 모두 친절하게 맞이해 드릴게요.

모임에서 만나요!', '["회원명", "시간", "장소", "참가비", "모임명"]'::jsonb, '모임 1일 전', 1, '10:00:00', true),

  ('FIRST_MEETING_FOLLOWUP', '첫 모임 후 후기 요청', '첫 정기모임 참여 완료 3일 후 후기 요청 및 다음 모임 안내', '[지독해] #{회원명}님, 첫 모임은 어떠셨어요?

안녕하세요! 첫 모임에 와주셔서 감사해요.

#{모임명}에서 어떤 시간을 보내셨는지 궁금해요!
후기를 남겨주시면 다른 분들에게도 큰 도움이 됩니다.

[후기 남기기]

---
다음 정기모임도 함께해요!
#{다음모임명}: #{다음모임일시}

[다음 모임 신청하기]', '["회원명", "모임명", "다음모임명", "다음모임일시"]'::jsonb, '첫 모임 종료 3일 후', NULL, '10:00:00', true),

  ('LAUNCH_ANNOUNCEMENT', '정식 출시 안내', '전체 회원에게 발송하는 웹서비스 정식 출시 안내', '[지독해] 새로운 웹서비스가 오픈했어요!

안녕하세요, #{회원명}님!

지독해의 새로운 웹서비스가 오픈했습니다!

이제 더 편하게 모임을 신청하고
취소할 때 자동으로 환불받고
알림으로 모임을 잊지 않을 수 있어요

[지금 확인하기]', '["회원명"]'::jsonb, '수동 발송', NULL, NULL, true),

  -- M7: 여운 메시지
  ('AFTERGLOW', '여운 메시지', '모임 종료 후 발송되는 여운 메시지', '#{이름}님, 오늘 나눈 이야기 중 마음에 남은 단어 하나는 무엇인가요?

따뜻한 밤 되세요.

- 지독해', '["이름"]'::jsonb, '모임 종료 30분 후', NULL, NULL, true)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  send_timing = EXCLUDED.send_timing,
  send_days_before = EXCLUDED.send_days_before,
  send_time = EXCLUDED.send_time,
  updated_at = NOW();

-- =============================================
-- 완료!
-- 스키마 버전: 2.0.0
-- =============================================
-- 포함 내역:
-- - v1.3.0 기본 스키마
-- - v1.3.0 RLS 수정 (헬퍼 함수)
-- - M9 티켓 시스템 (seat_number, participation_count)
-- - MX 참여 통계 트리거
-- - M6 알림 템플릿
-- - M7 알림 템플릿
-- =============================================
