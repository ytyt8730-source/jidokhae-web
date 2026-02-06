/**
 * 회원가입용 SMS OTP 검증 API
 * 로그인 없이 전화번호 인증번호 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { authLogger } from '@/lib/logger'
import { verifyOtp, normalizePhone } from '@/lib/otp'

const logger = authLogger

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json({ error: '전화번호와 인증번호를 입력해주세요.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length !== 11) {
      return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 })
    }

    // OTP 검증
    const verifyResult = verifyOtp(normalizedPhone, otp)
    if (!verifyResult.valid) {
      return NextResponse.json({ error: verifyResult.error }, { status: 400 })
    }

    logger.info('signup_phone_verified', {
      phone: normalizedPhone.slice(0, 7) + '****',
    })

    return NextResponse.json({
      success: true,
      message: '전화번호 인증이 완료되었습니다.',
    })
  } catch (error) {
    logger.error('verify_signup_otp_error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
