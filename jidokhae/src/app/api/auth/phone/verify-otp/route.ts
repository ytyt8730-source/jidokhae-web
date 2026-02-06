/**
 * SMS OTP 검증 API
 * 전화번호 인증번호 확인 및 전화번호 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { authLogger } from '@/lib/logger'
import { verifyOtp, normalizePhone } from '@/lib/otp'
import { sendAndLogNotification } from '@/lib/notification'
import { getMostPopularMeeting } from '@/lib/onboarding/reminder'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const logger = authLogger

// 환영 알림 템플릿 코드
const WELCOME_TEMPLATE = 'WELCOME'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증된 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json({ error: '전화번호와 인증번호를 입력해주세요.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length !== 11) {
      return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 })
    }

    // OTP 검증 (Supabase)
    const verifyResult = await verifyOtp(normalizedPhone, otp)
    if (!verifyResult.valid) {
      return NextResponse.json({ error: verifyResult.error }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // 기존 사용자 정보 확인
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id, name, phone, welcome_sent_at')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 전화번호가 있고 환영 알림을 보냈으면 그냥 업데이트만
    const isFirstPhoneSave = !existingUser.phone
    const shouldSendWelcome = isFirstPhoneSave && !existingUser.welcome_sent_at

    // 전화번호 저장 (검증됨)
    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        phone: normalizedPhone,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('phone_update_failed', { userId: user.id, error: updateError.message })
      return NextResponse.json({ error: '전화번호 저장에 실패했습니다.' }, { status: 500 })
    }

    logger.info('phone_verified_and_saved', {
      userId: user.id,
      phone: normalizedPhone.slice(0, 7) + '****',
      isFirstSave: isFirstPhoneSave,
    })

    // 신규 가입자에게 환영 알림 발송
    if (shouldSendWelcome) {
      try {
        const popularMeeting = await getMostPopularMeeting()

        const variables: Record<string, string> = {
          이름: existingUser.name || '회원',
        }

        if (popularMeeting) {
          const meetingDate = new Date(popularMeeting.datetime)
          const formattedDate = format(meetingDate, 'M월 d일 EEEE', { locale: ko })

          variables.모임명 = popularMeeting.title
          variables.모임일시 = formattedDate
          variables.남은자리 = String(popularMeeting.remainingSpots)
        }

        const result = await sendAndLogNotification({
          templateCode: WELCOME_TEMPLATE,
          phone: normalizedPhone,
          variables,
          userId: user.id,
          meetingId: popularMeeting?.id,
        })

        if (result.success) {
          await serviceClient
            .from('users')
            .update({ welcome_sent_at: new Date().toISOString() })
            .eq('id', user.id)

          logger.info('welcome_notification_sent', {
            userId: user.id,
            phone: normalizedPhone.slice(0, -4) + '****',
          })
        }
      } catch (notificationError) {
        logger.error('welcome_notification_error', {
          userId: user.id,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '전화번호 인증이 완료되었습니다.',
      welcomeSent: shouldSendWelcome,
    })
  } catch (error) {
    logger.error('verify_otp_error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
