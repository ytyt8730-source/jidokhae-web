-- =============================================
-- 지독해 테스트용 시드 데이터
-- 실행일: 2026-01-21
-- =============================================
-- 주의: 테스트 계정은 Supabase Auth에서 먼저 생성해야 합니다!
-- =============================================

-- =============================================
-- STEP 1: 테스트 사용자 (Auth 생성 후 ID 확인 필요)
-- =============================================
-- Supabase 대시보드 > Authentication > Users에서 생성:
-- 1. super@test.com / test1234 (super_admin)
-- 2. admin@test.com / test1234 (admin)
-- 3. member@test.com / test1234 (member)
--
-- 생성 후 아래 UUID를 실제 값으로 교체하세요!
-- =============================================

-- 플레이스홀더 (실제 Auth User ID로 교체 필요)
-- 아래 쿼리로 생성된 사용자 ID 확인:
-- SELECT id, email FROM auth.users;

-- =============================================
-- STEP 2: 사용자 역할 및 권한 설정
-- =============================================
-- Auth에서 계정 생성 후, 아래 쿼리 실행하여 역할 부여

-- super_admin 역할 부여 (이메일로 찾아서 업데이트)
UPDATE users SET role = 'super_admin' WHERE email = 'super@test.com';

-- admin 역할 부여
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- admin에게 권한 부여 (super@test.com이 부여한 것으로)
INSERT INTO admin_permissions (user_id, permission, granted_by)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com'),
  permission,
  (SELECT id FROM users WHERE email = 'super@test.com')
FROM unnest(ARRAY['meeting_manage', 'payment_manage', 'dashboard_view']) AS permission
ON CONFLICT (user_id, permission) DO NOTHING;

-- =============================================
-- STEP 3: 테스트 모임 데이터
-- =============================================

-- 환불 정책 ID 조회 (정기모임용)
-- SELECT id FROM refund_policies WHERE meeting_type = 'regular';

-- 다가오는 모임 3개
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('1월 4주차 정기모임', 'regular', '2026-01-25 14:00:00+09', '경주시 황성동 스타벅스 2층', 14, 5000, '이번 주 함께 읽을 책: "데미안" - 헤르만 헤세

각자 읽고 온 부분에서 인상 깊었던 구절을 나눠봐요.', 'open', 0),
  ('2월 1주차 정기모임', 'regular', '2026-02-01 14:00:00+09', '포항시 북구 양덕동 카페베네', 14, 5000, '이번 주 함께 읽을 책: "1984" - 조지 오웰

디스토피아 문학의 고전을 함께 읽어봅니다.', 'open', 0),
  ('2월 독서토론: 인공지능과 인간', 'discussion', '2026-02-15 15:00:00+09', '경주시 동천동 북카페', 10, 10000, '주제: AI 시대의 인간성
추천 도서: "라이프 3.0", "호모 데우스"

깊이 있는 토론을 위해 최소 1권 이상 읽어오시면 좋습니다.', 'open', 0);

-- 지난 모임 1개 (참여 완료 테스트용)
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('1월 3주차 정기모임', 'regular', '2026-01-18 14:00:00+09', '경주시 황성동 스타벅스 2층', 14, 5000, '지난 모임 - 참여 완료 테스트용', 'closed', 3);

-- =============================================
-- STEP 4: 테스트 배너 데이터
-- =============================================

INSERT INTO banners (title, image_url, link_url, is_active, display_order, start_date, end_date) VALUES
  ('2월 모임 일정 안내', 'https://picsum.photos/1200/400?random=1', '/meetings', true, 1, '2026-01-01', '2026-02-28'),
  ('신규 회원 환영 이벤트', 'https://picsum.photos/1200/400?random=2', '/about', true, 2, '2026-01-01', '2026-03-31'),
  ('독서토론 참가자 모집', 'https://picsum.photos/1200/400?random=3', '/meetings', false, 3, NULL, NULL);

-- =============================================
-- STEP 5: 테스트 등록 데이터 (member 계정용)
-- =============================================
-- member@test.com 계정이 생성된 후 실행

-- 지난 모임에 참여 완료 상태로 등록
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, participation_status, participation_method)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  (SELECT id FROM meetings WHERE title = '1월 3주차 정기모임'),
  'confirmed', 'paid', 'card', 5000, 'completed', 'confirm'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 다가오는 모임에 결제 완료 상태로 등록
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  (SELECT id FROM meetings WHERE title = '1월 4주차 정기모임'),
  'confirmed', 'paid', 'card', 5000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 모임 참가자 수 업데이트
UPDATE meetings SET current_participants = (
  SELECT COUNT(*) FROM registrations
  WHERE meeting_id = meetings.id AND status IN ('confirmed', 'pending_transfer')
);

-- =============================================
-- STEP 6: 테스트 건의사항 데이터
-- =============================================

INSERT INTO suggestions (user_id, content, status)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  '모임 장소를 포항에서도 더 자주 열어주세요!',
  'pending'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO suggestions (user_id, content, status)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com'),
  '온라인 모임도 가끔 있으면 좋겠어요.',
  'pending'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료!
-- =============================================
-- 확인 쿼리:
-- SELECT * FROM users;
-- SELECT * FROM meetings;
-- SELECT * FROM banners WHERE is_active = true;
-- SELECT * FROM registrations;
-- SELECT * FROM suggestions;
-- =============================================
