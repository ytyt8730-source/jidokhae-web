/**
 * 프로필 완성 API
 * M6-Onboarding: 신규 가입 시 전화번호 저장 + 환영 알림 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { authLogger } from '@/lib/logger'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone } = body

    // 전화번호 유효성 검사
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const phoneNumbers = phone.replace(/\D/g, '')
    if (phoneNumbers.length !== 11) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // 기존 사용자 정보 확인 (환영 알림 발송 여부 판단)
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id, name, phone, welcome_sent_at')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 이미 전화번호가 있고 환영 알림을 보냈으면 그냥 업데이트만
    const isFirstPhoneSave = !existingUser.phone
    const shouldSendWelcome = isFirstPhoneSave && !existingUser.welcome_sent_at

    // 전화번호 저장
    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        phone: phoneNumbers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('phone_update_failed', { userId: user.id, error: updateError.message })
      return NextResponse.json({ error: 'Failed to update phone' }, { status: 500 })
    }

    logger.info('phone_updated', { userId: user.id, isFirstSave: isFirstPhoneSave })

    // 신규 가입자에게 환영 알림 발송
    if (shouldSendWelcome) {
      try {
        // 인기 모임 정보 가져오기
        const popularMeeting = await getMostPopularMeeting()

        // 변수 준비
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

        // 환영 알림 발송
        const result = await sendAndLogNotification({
          templateCode: WELCOME_TEMPLATE,
          phone: phoneNumbers,
          variables,
          userId: user.id,
          meetingId: popularMeeting?.id,
        })

        if (result.success) {
          // welcome_sent_at 업데이트
          await serviceClient
            .from('users')
            .update({ welcome_sent_at: new Date().toISOString() })
            .eq('id', user.id)

          logger.info('welcome_notification_sent', {
            userId: user.id,
            phone: phoneNumbers.slice(0, -4) + '****',
            meetingId: popularMeeting?.id,
          })
        } else {
          logger.warn('welcome_notification_failed', {
            userId: user.id,
            error: result.error,
          })
        }
      } catch (notificationError) {
        // 알림 실패해도 전화번호 저장은 성공으로 처리
        logger.error('welcome_notification_error', {
          userId: user.id,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile completed',
      welcomeSent: shouldSendWelcome,
    })
  } catch (error) {
    logger.error('complete_profile_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
