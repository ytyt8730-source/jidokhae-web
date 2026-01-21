-- =============================================
-- M6 신규회원 & 출시 준비 - 알림 템플릿
-- 버전: 1.0.0
-- 실행일: 2026-01-21
-- =============================================

-- M6-001: 신규 회원 첫 모임 환영 알림 (D-1)
INSERT INTO notification_templates (code, name, description, message_template, variables, send_timing, send_days_before, send_time, is_active)
VALUES (
  'NEW_MEMBER_WELCOME',
  '신규 회원 첫 모임 환영',
  '신규 회원의 첫 정기모임 전날 발송되는 환영 알림',
  '[지독해] #{회원명}님, 내일 첫 모임이에요!

안녕하세요! 지독해에 오신 걸 환영해요.

내일 #{시간}에 #{장소}에서 만나요.

준비물: 읽고 있는 책 (없어도 괜찮아요!)
장소: #{장소}
참가비: #{참가비}콩 (이미 결제 완료!)

처음이라 걱정되시죠?
걱정 마세요, 모두 친절하게 맞이해 드릴게요.

모임에서 만나요!',
  '["회원명", "시간", "장소", "참가비", "모임명"]',
  '모임 1일 전',
  1,
  '10:00',
  true
)
ON CONFLICT (code) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- M6-002: 첫 모임 후 후기 요청 알림 (D+3)
INSERT INTO notification_templates (code, name, description, message_template, variables, send_timing, send_days_before, send_time, is_active)
VALUES (
  'FIRST_MEETING_FOLLOWUP',
  '첫 모임 후 후기 요청',
  '첫 정기모임 참여 완료 3일 후 후기 요청 및 다음 모임 안내',
  '[지독해] #{회원명}님, 첫 모임은 어떠셨어요?

안녕하세요! 첫 모임에 와주셔서 감사해요.

#{모임명}에서 어떤 시간을 보내셨는지 궁금해요!
후기를 남겨주시면 다른 분들에게도 큰 도움이 됩니다.

[후기 남기기]

---
다음 정기모임도 함께해요!
#{다음모임명}: #{다음모임일시}

[다음 모임 신청하기]',
  '["회원명", "모임명", "다음모임명", "다음모임일시"]',
  '첫 모임 종료 3일 후',
  null,
  '10:00',
  true
)
ON CONFLICT (code) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- M6-003: 자격 만료 임박 알림
INSERT INTO notification_templates (code, name, description, message_template, variables, send_timing, send_days_before, send_time, is_active)
VALUES (
  'ELIGIBILITY_WARNING',
  '자격 만료 임박 알림',
  '정기모임 자격 만료 30일 이내 회원에게 발송',
  '[지독해] #{회원명}님, 자격 만료가 임박했어요!

안녕하세요!

토론모임 등 특별 모임 참가 자격이
#{남은일수}일 후 만료됩니다.

정기모임에 참여하시면 자격이 갱신됩니다!
지금 바로 모임 일정을 확인해보세요.

[정기모임 보러가기]',
  '["회원명", "남은일수"]',
  '매주 월요일',
  null,
  '10:00',
  true
)
ON CONFLICT (code) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- M6-004: 정식 출시 안내 알림
INSERT INTO notification_templates (code, name, description, message_template, variables, send_timing, send_days_before, send_time, is_active)
VALUES (
  'LAUNCH_ANNOUNCEMENT',
  '정식 출시 안내',
  '전체 회원에게 발송하는 웹서비스 정식 출시 안내',
  '[지독해] 새로운 웹서비스가 오픈했어요!

안녕하세요, #{회원명}님!

지독해의 새로운 웹서비스가 오픈했습니다!

이제 더 편하게 모임을 신청하고
취소할 때 자동으로 환불받고
알림으로 모임을 잊지 않을 수 있어요

[지금 확인하기]',
  '["회원명"]',
  '수동 발송',
  null,
  null,
  true
)
ON CONFLICT (code) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 완료!
-- SELECT code, name, is_active FROM notification_templates WHERE code LIKE '%MEMBER%' OR code LIKE '%ELIGIBILITY%' OR code LIKE '%LAUNCH%';
