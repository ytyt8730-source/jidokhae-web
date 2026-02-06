/**
 * 회원가입용 SMS OTP 발송 API
 * 로그인 없이 전화번호 인증번호 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, rateLimitExceededResponse, createRateLimiter } from '@/lib/rate-limit'
import { createHmac, randomBytes } from 'crypto'
import { generateOtp, storeOtp, normalizePhone } from '@/lib/otp'

const logger = authLogger

// 솔라피 설정
const SOLAPI_API_URL = 'https://api.solapi.com'

const getConfig = () => ({
  apiKey: process.env.SOLAPI_API_KEY || '',
  apiSecret: process.env.SOLAPI_API_SECRET || '',
  sender: process.env.SOLAPI_SENDER || '',
})

// 솔라피 인증 헤더 생성
function createAuthHeader(): string {
  const { apiKey, apiSecret } = getConfig()

  if (!apiKey || !apiSecret) {
    throw new Error('SOLAPI API credentials not configured')
  }

  const date = new Date().toISOString()
  const salt = randomBytes(32).toString('hex')
  const signature = createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

// SMS 발송
async function sendSms(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const config = getConfig()

  // 개발 환경에서는 실제 발송하지 않음
  if (process.env.NODE_ENV === 'development' || !config.apiKey) {
    logger.info('sms_mock_send', { phone: phone.slice(0, 7) + '****', message })
    return { success: true }
  }

  try {
    const response = await fetch(`${SOLAPI_API_URL}/messages/v4/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: createAuthHeader(),
      },
      body: JSON.stringify({
        message: {
          to: phone,
          from: config.sender,
          text: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('sms_send_failed', { phone: phone.slice(0, 7) + '****', error: data })
      return { success: false, error: data.errorMessage || 'SMS 발송 실패' }
    }

    return { success: true }
  } catch (error) {
    logger.error('sms_send_error', { error: error instanceof Error ? error.message : 'Unknown' })
    return { success: false, error: '네트워크 오류' }
  }
}

// Rate limiter for signup OTP (분당 3회, IP 기반)
const signupOtpRateLimiter = createRateLimiter({ interval: 60 * 1000, limit: 3 })

export async function POST(request: NextRequest) {
  // Rate limit 체크
  const rateLimitResult = checkRateLimit(request, signupOtpRateLimiter)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: '전화번호를 입력해주세요.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length !== 11) {
      return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 })
    }

    // OTP 생성
    const otp = generateOtp()

    // OTP 저장
    storeOtp(normalizedPhone, otp)

    // SMS 발송
    const message = `[낮과 밤의 서재] 인증번호 [${otp}]를 입력해주세요.`
    const result = await sendSms(normalizedPhone, message)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'SMS 발송에 실패했습니다.' }, { status: 500 })
    }

    logger.info('signup_otp_sent', {
      phone: normalizedPhone.slice(0, 7) + '****',
    })

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다.',
      // 개발 환경에서만 OTP 노출 (테스트용)
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    })
  } catch (error) {
    logger.error('send_signup_otp_error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
