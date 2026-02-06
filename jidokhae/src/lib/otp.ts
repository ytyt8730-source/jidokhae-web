/**
 * SMS OTP 유틸리티
 * 전화번호 인증을 위한 OTP 생성, 저장, 검증
 * Supabase 기반 영구 저장소 사용 (서버리스 환경 호환)
 */

import { createServiceClient } from '@/lib/supabase/server'

// OTP 만료 시간 (5분)
const OTP_EXPIRY_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

/**
 * 6자리 OTP 생성
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 전화번호 정규화 (하이픈 제거)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * OTP 저장 (Supabase)
 */
export async function storeOtp(phone: string, otp: string): Promise<void> {
  const supabase = await createServiceClient()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

  // 기존 OTP 삭제 (같은 전화번호)
  await supabase
    .from('otp_verifications')
    .delete()
    .eq('phone', phone)

  // 새 OTP 저장
  await supabase
    .from('otp_verifications')
    .insert({
      phone,
      otp,
      expires_at: expiresAt,
      attempts: 0,
    })
}

/**
 * OTP 검증 (Supabase)
 */
export async function verifyOtp(
  phone: string,
  inputOtp: string
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createServiceClient()

  // OTP 조회
  const { data: stored, error: fetchError } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !stored) {
    return { valid: false, error: '인증번호를 먼저 요청해주세요.' }
  }

  // 만료 체크
  if (new Date() > new Date(stored.expires_at)) {
    await supabase.from('otp_verifications').delete().eq('id', stored.id)
    return { valid: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }
  }

  // 시도 횟수 체크
  if (stored.attempts >= MAX_ATTEMPTS) {
    await supabase.from('otp_verifications').delete().eq('id', stored.id)
    return { valid: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' }
  }

  // 시도 횟수 증가
  await supabase
    .from('otp_verifications')
    .update({ attempts: stored.attempts + 1 })
    .eq('id', stored.id)

  // OTP 일치 확인
  if (stored.otp !== inputOtp) {
    return { valid: false, error: '인증번호가 일치하지 않습니다.' }
  }

  // 인증 성공 - 레코드 삭제
  await supabase
    .from('otp_verifications')
    .delete()
    .eq('id', stored.id)

  return { valid: true }
}
