-- ===========================================
-- M9: Commitment Ritual - 티켓 시스템
-- ===========================================
-- 실행 순서: Supabase Dashboard > SQL Editor
-- 실행 시점: M9 Phase 9.1 시작 전
-- ===========================================

-- 1. registrations 테이블 확장
-- -----------------------------------------
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS seat_number INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS participation_count INTEGER;

-- 인덱스 추가 (좌석 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_registrations_seat
ON registrations(meeting_id, seat_number)
WHERE status IN ('confirmed', 'pending_payment', 'pending_transfer');

-- 2. 좌석 번호 자동 부여 함수
-- -----------------------------------------
CREATE OR REPLACE FUNCTION assign_seat_number()
RETURNS TRIGGER AS $$
DECLARE
  next_seat INTEGER;
BEGIN
  -- 이미 좌석이 있으면 스킵
  IF NEW.seat_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 해당 모임의 다음 좌석 번호 계산
  SELECT COALESCE(MAX(seat_number), 0) + 1
  INTO next_seat
  FROM registrations
  WHERE meeting_id = NEW.meeting_id
    AND status IN ('confirmed', 'pending_payment', 'pending_transfer');

  NEW.seat_number := next_seat;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS tr_assign_seat_number ON registrations;

CREATE TRIGGER tr_assign_seat_number
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION assign_seat_number();

-- 3. 참여 횟수 계산 함수
-- -----------------------------------------
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

-- 4. 참여 횟수 자동 업데이트 함수
-- -----------------------------------------
CREATE OR REPLACE FUNCTION update_participation_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 참여 횟수 계산하여 저장
  NEW.participation_count := calculate_participation_count(NEW.user_id) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (신규 등록 시)
DROP TRIGGER IF EXISTS tr_update_participation_count ON registrations;

CREATE TRIGGER tr_update_participation_count
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_participation_count();

-- 5. 기존 데이터 마이그레이션 (선택)
-- -----------------------------------------
-- 기존 등록에 좌석 번호 부여 (필요시 주석 해제)
-- UPDATE registrations r
-- SET seat_number = (
--   SELECT COUNT(*) + 1
--   FROM registrations r2
--   WHERE r2.meeting_id = r.meeting_id
--     AND r2.created_at < r.created_at
--     AND r2.status IN ('confirmed', 'pending_payment', 'pending_transfer')
-- )
-- WHERE seat_number IS NULL
--   AND status IN ('confirmed', 'pending_payment', 'pending_transfer');

-- 6. RLS 정책 업데이트 (필요시)
-- -----------------------------------------
-- 기존 정책이 seat_number, participation_count 컬럼 접근 허용하도록 확인
-- 별도 정책 추가 불필요 (기존 정책 재사용)

-- ===========================================
-- 완료 확인
-- ===========================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'registrations'
--   AND column_name IN ('seat_number', 'participation_count');
