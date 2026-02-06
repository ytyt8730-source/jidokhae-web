-- =============================================
-- OTP 인증 테이블 추가
-- 버전: 1.0.0
-- 날짜: 2026-02-06
-- =============================================
-- Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- otp_verifications 테이블 생성
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- 만료된 OTP 자동 삭제 (24시간 이상 지난 레코드)
-- Cron job이나 Supabase Edge Function으로 주기적 실행 권장
-- DELETE FROM otp_verifications WHERE created_at < NOW() - INTERVAL '24 hours';

-- RLS 정책 (공개 접근 허용 - 회원가입 전 사용)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT 가능 (OTP 발송 시)
CREATE POLICY "Anyone can insert OTP" ON otp_verifications
  FOR INSERT WITH CHECK (true);

-- 누구나 SELECT 가능 (OTP 검증 시)
CREATE POLICY "Anyone can select OTP" ON otp_verifications
  FOR SELECT USING (true);

-- 누구나 UPDATE 가능 (attempts 증가, verified_at 설정)
CREATE POLICY "Anyone can update OTP" ON otp_verifications
  FOR UPDATE USING (true);

-- 누구나 DELETE 가능 (인증 완료 후 삭제)
CREATE POLICY "Anyone can delete OTP" ON otp_verifications
  FOR DELETE USING (true);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'OTP verifications table created successfully!';
END $$;
