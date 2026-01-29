-- =============================================
-- 추가 테스트 시드 데이터 (E2E 테스트용)
-- 실행일: 2026-01-28
-- =============================================

-- =============================================
-- 다양한 상태의 모임 데이터
-- =============================================

-- 기존 추가 테스트 모임 삭제 (중복 방지)
DELETE FROM meetings WHERE title LIKE '%3월%' OR title LIKE '%마감%';

-- 마감 임박 모임 (정원 12/14)
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('3월 정기모임 - 마감 임박', 'regular', NOW() + INTERVAL '7 days', '경주시 황성동 스타벅스', 14, 5000, 
   '테스트용 마감 임박 모임입니다.', 'open', 12);

-- 정원 마감 모임 (대기 가능)
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('3월 토론모임 - 정원 마감', 'discussion', NOW() + INTERVAL '14 days', '포항시 북구 카페', 10, 10000, 
   '정원이 가득 찬 모임입니다. 대기 신청 테스트용.', 'open', 10)
ON CONFLICT DO NOTHING;

-- 과거 모임 (참여 완료 테스트용)
INSERT INTO meetings (title, meeting_type, datetime, location, capacity, fee, description, status, current_participants) VALUES
  ('1월 2주차 정기모임 - 완료', 'regular', NOW() - INTERVAL '14 days', '경주시 동천동', 14, 5000, 
   '이미 완료된 모임입니다. 피드백/칭찬 테스트용.', 'closed', 5)
ON CONFLICT DO NOTHING;

-- =============================================
-- 환불 정책 데이터 (없으면 추가)
-- =============================================

INSERT INTO refund_policies (name, meeting_type, rules) VALUES
  ('정기모임 환불 규정', 'regular', '[{"days_before": 3, "refund_percent": 100}, {"days_before": 2, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]'::jsonb),
  ('토론모임 환불 규정', 'discussion', '[{"days_before": 14, "refund_percent": 100}, {"days_before": 7, "refund_percent": 50}, {"days_before": 0, "refund_percent": 0}]'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================
-- 신규회원 테스트 계정 (is_new_member = true)
-- =============================================
-- Auth에서 newbie@test.com 계정 생성 후 실행

UPDATE users SET is_new_member = true WHERE email = 'newbie@test.com';

-- =============================================
-- 기존회원 테스트 계정 (is_new_member = false)
-- =============================================

UPDATE users SET is_new_member = false, last_regular_meeting_at = NOW() - INTERVAL '30 days' 
WHERE email = 'member@test.com';

-- =============================================
-- 입금대기 등록 데이터 (운영자 테스트용)
-- =============================================

-- member@test.com이 계좌이체로 입금대기 상태
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, transfer_sender_name)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '3월 정기모임%' LIMIT 1),
  'pending_transfer', 'pending', 'transfer', 5000, '0128_테스트'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '3월 정기모임%')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- =============================================
-- 환불대기 데이터 (운영자 테스트용)
-- =============================================

-- 취소된 등록 데이터 (refund_status 컬럼이 없으면 건너뜀)
INSERT INTO registrations (user_id, meeting_id, status, payment_status, payment_method, payment_amount, refund_amount, cancelled_at, cancel_reason)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '3월 토론모임%' LIMIT 1),
  'cancelled', 'refund_pending', 'transfer', 10000, 5000, NOW(), '일정 변경'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '3월 토론모임%')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- =============================================
-- 대기자 데이터
-- =============================================

INSERT INTO waitlists (user_id, meeting_id, position)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '%정원 마감%' LIMIT 1),
  1
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '%정원 마감%')
ON CONFLICT (user_id, meeting_id) DO NOTHING;

-- 배지 데이터는 badges 테이블 구조가 user_id, badge_type 형식이므로 별도 정의 테이블 없음
-- 스키마: badges(user_id, badge_type)

-- member@test.com에게 first_step 배지 부여
INSERT INTO badges (user_id, badge_type)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  'first_step'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- =============================================
-- 칭찬 데이터
-- =============================================

-- member@test.com이 admin@test.com을 칭찬 (message_type 사용)
INSERT INTO praises (from_user_id, to_user_id, meeting_id, message_type)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '1월 2주차%' LIMIT 1),
  'good_listener'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '1월 2주차%')
ON CONFLICT (from_user_id, meeting_id) DO NOTHING;

-- =============================================
-- 후기 데이터 (공개 동의)
-- =============================================

INSERT INTO reviews (user_id, meeting_id, content, is_public)
SELECT
  (SELECT id FROM users WHERE email = 'member@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '1월 2주차%' LIMIT 1),
  '정말 좋은 시간이었습니다. 다양한 관점의 이야기를 들을 수 있어서 좋았어요.',
  true
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'member@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '1월 2주차%')
ON CONFLICT DO NOTHING;

INSERT INTO reviews (user_id, meeting_id, content, is_public)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test.com' LIMIT 1),
  (SELECT id FROM meetings WHERE title LIKE '1월 2주차%' LIMIT 1),
  '책에 대한 깊은 대화를 나눌 수 있어서 뜻깊었습니다.',
  true
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com')
  AND EXISTS (SELECT 1 FROM meetings WHERE title LIKE '1월 2주차%')
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료! 확인 쿼리
-- =============================================
-- SELECT * FROM meetings ORDER BY datetime DESC;
-- SELECT * FROM registrations;
-- SELECT * FROM waitlist;
-- SELECT * FROM badges;
-- SELECT * FROM user_badges;
-- SELECT * FROM praises;
-- SELECT * FROM reviews WHERE is_public = true;
-- =============================================
