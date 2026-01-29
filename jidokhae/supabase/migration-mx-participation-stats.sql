-- MX-C03: 참여 완료 시 사용자 통계 자동 업데이트 트리거
--
-- 이 마이그레이션은 다음을 수행합니다:
-- 1. participation_status가 'completed'로 변경될 때 users.total_participations 증가
-- 2. 정기모임(meeting_type='regular') 완료 시 users.last_regular_meeting_at 갱신

-- 기존 트리거 및 함수 삭제 (있는 경우)
DROP TRIGGER IF EXISTS update_participation_stats_trigger ON registrations;
DROP FUNCTION IF EXISTS update_user_participation_stats();

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_user_participation_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_meeting_type text;
BEGIN
  -- participation_status가 'completed'로 변경될 때만 실행
  IF NEW.participation_status = 'completed' AND
     (OLD.participation_status IS NULL OR OLD.participation_status != 'completed') THEN

    -- 모임 타입 조회
    SELECT meeting_type INTO v_meeting_type
    FROM meetings
    WHERE id = NEW.meeting_id;

    -- 사용자 통계 업데이트
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

-- 트리거 연결
CREATE TRIGGER update_participation_stats_trigger
AFTER UPDATE OF participation_status ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_user_participation_stats();

-- 권한 부여
GRANT EXECUTE ON FUNCTION update_user_participation_stats() TO service_role;

-- 검증 쿼리 (실행 확인용)
-- UPDATE registrations
-- SET participation_status = 'completed'
-- WHERE id = 'test-id';
