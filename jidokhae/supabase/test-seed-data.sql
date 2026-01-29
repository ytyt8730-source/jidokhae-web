-- =============================================
-- 지독해 테스트용 시드 데이터 (수정본)
-- 실행일: 2026-01-28
-- =============================================
-- 주의: 테스트 계정은 Supabase Auth에서 먼저 생성해야 합니다!
-- =============================================

-- =============================================
-- STEP 1: 사용자 역할 및 권한 설정
-- =============================================

-- super_admin 역할 부여
UPDATE users SET role = 'super_admin' WHERE email = 'super@test.com';

-- admin 역할 부여
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- admin에게 권한 부여
INSERT INTO admin_permissions (user_id, permission, granted_by)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com' LIMIT 1),
  permission,
  (SELECT id FROM users WHERE email = 'super@test.com' LIMIT 1)
FROM unnest(ARRAY['meeting_manage', 'payment_manage', 'dashboard_view']) AS permission
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'super@test.com')
ON CONFLICT (user_id, permission) DO NOTHING;

-- =============================================
-- STEP 2: 기존 테스트 모임 삭제 (중복 방지)
-- =============================================

DELETE FROM meetings WHERE title LIKE '%테스트%' OR title LIKE '%1월%' OR title LIKE '%2월%';

-- =============================================
-- STEP 3: 테스트 모임 데이터
-- =============================================

INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('1월 4주차 정기모임', 'regular', '2026-01-25 14:00:00+09', '경주시 황성동 스타벅스 2층', 14, 5000, '이번 주 함께 읽을 책: "데미안" - 헤르만 헤세

각자 읽고 온 부분에서 인상 깊었던 구절을 나눠봐요.', 'open', 0),
  ('2월 1주차 정기모임', 'regular', '2026-02-01 14:00:00+09', '포항시 북구 양덕동 카페베네', 14, 5000, '이번 주 함께 읽을 책: "1984" - 조지 오웰

디스토피아 문학의 고전을 함께 읽어봅니다.', 'open', 0),
  ('2월 독서토론: 인공지능과 인간', 'discussion', '2026-02-15 15:00:00+09', '경주시 동천동 북카페', 10, 10000, '주제: AI 시대의 인간성
추천 도서: "라이프 3.0", "호모 데우스"

깊이 있는 토론을 위해 최소 1권 이상 읽어오시면 좋습니다.', 'open', 0),
  ('1월 3주차 정기모임', 'regular', '2026-01-18 14:00:00+09', '경주시 황성동 스타벅스 2층', 14, 5000, '지난 모임 - 참여 완료 테스트용', 'closed', 3);

-- 모임에 환불 정책 연결 (환불 규정 섹션 표시용)
UPDATE meetings SET refund_policy_id = (
  SELECT id FROM refund_policies WHERE meeting_type = 'regular' LIMIT 1
) WHERE meeting_type = 'regular';

UPDATE meetings SET refund_policy_id = (
  SELECT id FROM refund_policies WHERE meeting_type = 'discussion' LIMIT 1
) WHERE meeting_type = 'discussion';

-- =============================================
-- STEP 4: 테스트 배너 데이터
-- =============================================

INSERT INTO banners (title, image_url, link_url, is_active, display_order, start_date, end_date) VALUES
  ('2월 모임 일정 안내', 'https://picsum.photos/1200/400?random=1', '/meetings', true, 1, '2026-01-01', '2026-02-28'),
  ('신규 회원 환영 이벤트', 'https://picsum.photos/1200/400?random=2', '/about', true, 2, '2026-01-01', '2026-03-31'),
  ('독서토론 참가자 모집', 'https://picsum.photos/1200/400?random=3', '/meetings', false, 3, NULL, NULL)
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 5: 테스트 등록 데이터 (member 계정용)
-- =============================================

-- 지난 모임에 참여 완료 상태로 등록
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, participation_status, participation_method)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title = '1월 3주차 정기모임' LIMIT 1),
  'confirmed', 'paid', 'card', 5000, 'completed', 'confirm'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title = '1월 3주차 정기모임')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 다가오는 모임에 결제 완료 상태로 등록
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title = '1월 4주차 정기모임' LIMIT 1),
  'confirmed', 'paid', 'card', 5000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title = '1월 4주차 정기모임')
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
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  '모임 장소를 포항에서도 더 자주 열어주세요!',
  'pending'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료!
-- =============================================
