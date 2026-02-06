/**
 * SMS OTP 유틸리티
 * 전화번호 인증을 위한 OTP 생성, 저장, 검증
 */

// OTP 저장소 타입
type OtpStoreType = Map<string, { otp: string; expiresAt: number; attempts: number }>

// 개발 환경에서는 global 객체를 사용하여 hot reload 시에도 데이터 유지
// 프로덕션에서는 Redis 권장
const globalForOtp = globalThis as unknown as {
  otpStore: OtpStoreType | undefined
}

const otpStore: OtpStoreType = globalForOtp.otpStore ?? new Map()

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore
}

// OTP 만료 시간 (5분)
const OTP_EXPIRY_MS = 5 * 60 * 1000

/**
 * 6자리 OTP 생성
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * OTP 저장
 */
export function storeOtp(phone: string, otp: string): void {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  })
}

/**
 * OTP 검증
 */
export function verifyOtp(
  phone: string,
  inputOtp: string
): { valid: boolean; error?: string } {
  const stored = otpStore.get(phone)

  if (!stored) {
    return { valid: false, error: '인증번호를 먼저 요청해주세요.' }
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone)
    return { valid: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }
  }

  // 최대 시도 횟수 (5회)
  if (stored.attempts >= 5) {
    otpStore.delete(phone)
    return { valid: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' }
  }

  stored.attempts++

  if (stored.otp !== inputOtp) {
    return { valid: false, error: '인증번호가 일치하지 않습니다.' }
  }

  // 인증 성공 시 삭제
  otpStore.delete(phone)
  return { valid: true }
}

/**
 * 전화번호 정규화 (하이픈 제거)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}
