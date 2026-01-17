-- =============================================
-- 지독해 웹서비스 - 데이터베이스 스키마
-- 버전: 1.1.0
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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refunded')),
  payment_amount INTEGER,
  refund_amount INTEGER DEFAULT 0,
  cancel_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  participation_status VARCHAR(20) CHECK (participation_status IN ('completed', 'no_show')),
  participation_method VARCHAR(20) CHECK (participation_method IN ('praise', 'review', 'confirm', 'auto', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_meeting_id ON registrations(meeting_id);
CREATE INDEX idx_registrations_status ON registrations(status);

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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. notification_templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  message_template TEXT NOT NULL,
  send_timing VARCHAR(100),
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
    'meeting_manage', 'notification_send', 'banner_manage',
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
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- =============================================
-- RLS 정책
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for signup" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view refund policies" ON refund_policies FOR SELECT USING (true);
CREATE POLICY "Admins can manage refund policies" ON refund_policies FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Admins can manage meetings" ON meetings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registrations" ON registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all registrations" ON registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- =============================================
-- 함수
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_meeting_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE meetings SET current_participants = current_participants + 1 WHERE id = NEW.meeting_id;
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE meetings SET current_participants = GREATEST(current_participants - 1, 0) WHERE id = NEW.meeting_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, is_new_member, created_at, updated_at)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
    NEW.raw_user_meta_data->>'phone',
    'member', true, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 추가 함수 (M3 알림시스템)
-- =============================================

-- 휴면 위험 회원 조회 (마지막 참여가 3~5개월 전)
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

-- 대기자 순번 조정 (결제 완료 또는 만료 시 뒤의 대기자 순번 감소)
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

-- =============================================
-- 트리거
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_on_registration_change AFTER INSERT OR UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_meeting_participants();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();