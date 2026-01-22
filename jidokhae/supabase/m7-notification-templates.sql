-- M7 알림 템플릿 업데이트
-- M7-010: 참여자 티저 알림
-- M7-011: 여운 메시지

-- 기존 REMINDER_1D 템플릿 업데이트 (티저 문구 변수 추가)
UPDATE notification_templates
SET 
  message_template = '[지독해] #{모임명} 내일이에요!

안녕하세요, #{이름}님!

내일 #{시간}에 #{모임명}이 있어요.
#{티저_문구}

📍 장소: #{장소}

내일 뵙겠습니다!',
  variables = '["모임명", "이름", "시간", "장소", "티저_문구"]'::jsonb,
  updated_at = NOW()
WHERE code = 'REMINDER_1D';

-- M7-011: 여운 메시지 템플릿 추가
INSERT INTO notification_templates (code, name, message_template, variables, send_timing, is_active)
VALUES (
  'AFTERGLOW',
  '여운 메시지',
  '#{이름}님, 오늘 나눈 이야기 중 마음에 남은 단어 하나는 무엇인가요?

따뜻한 밤 되세요. 🌙

- 지독해',
  '["이름"]'::jsonb,
  '모임 종료 30분 후',
  true
)
ON CONFLICT (code) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  send_timing = EXCLUDED.send_timing,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
