import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('auth-callback')

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러 처리 (M2-004: 카카오 로그인 취소 포함)
  if (error) {
    logger.error('Auth callback error', { error, errorDescription })
    // 사용자가 카카오 로그인을 취소한 경우 에러 없이 로그인 페이지로
    if (error === 'access_denied') {
      return NextResponse.redirect(`${origin}/auth/login`)
    }
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      logger.error('Code exchange error', { error: exchangeError.message })
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // 이메일 확인 성공 시 확인 페이지로 이동
    const type = searchParams.get('type')
    if (type === 'signup' || type === 'email') {
      return NextResponse.redirect(`${origin}/auth/confirmed`)
    }

    // OAuth 로그인 (카카오 등) 시 users 테이블에 프로필 저장/업데이트 (M2-002, M2-003, M2-005)
    if (sessionData?.user) {
      const user = sessionData.user
      const provider = user.app_metadata?.provider

      if (provider === 'kakao') {
        const userMetadata = user.user_metadata || {}

        // 카카오에서 받아온 전화번호 (phone_number scope 필요)
        // 카카오 형식: +82 10-1234-5678 → 01012345678로 변환
        let kakaoPhone: string | null = null
        if (userMetadata.phone_number) {
          kakaoPhone = userMetadata.phone_number
            .replace(/^\+82\s*/, '0')  // +82 → 0
            .replace(/[^0-9]/g, '')     // 숫자만 추출
        }

        // 임시 닉네임 생성 (이름 앞 2글자, 중복 시 숫자 접미사)
        const userName = userMetadata.name || userMetadata.full_name || userMetadata.preferred_username || '사용자'
        const baseName = userName.length >= 2 ? userName.substring(0, 2) : userName + '0'
        const { data: similarNicknames } = await supabase
          .from('users')
          .select('nickname')
          .like('nickname', `${baseName}%`)
        const usedSet = new Set(similarNicknames?.map((n: { nickname: string }) => n.nickname) || [])
        let tempNickname = baseName
        if (usedSet.has(tempNickname)) {
          for (let i = 1; i <= 999; i++) {
            const candidate = baseName + String(i)
            if (candidate.length > 6) break
            if (!usedSet.has(candidate)) {
              tempNickname = candidate
              break
            }
          }
        }

        // 카카오에서 받아온 프로필 정보
        const profileData = {
          id: user.id,
          email: user.email || userMetadata.email,
          name: userName,
          nickname: tempNickname,  // 임시 닉네임 (complete-profile에서 변경 가능)
          phone: kakaoPhone,  // 카카오 전화번호 (있는 경우)
          phone_verified: kakaoPhone ? true : false,  // 카카오 인증 전화번호는 검증됨
          profile_image_url: userMetadata.avatar_url || userMetadata.picture,
          auth_provider: 'kakao',
          is_new_member: true, // 신규 회원 여부 (첫 6개월 정기모임 참여 전까지)
        }

        // 기존 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, phone, nickname, is_new_member')
          .eq('id', user.id)
          .single()

        if (existingUser) {
          // 기존 사용자: 프로필 이미지, 이름 업데이트 (M2-003)
          // 전화번호가 없으면 카카오에서 받아온 번호로 업데이트
          const updateData: Record<string, unknown> = {
            name: profileData.name,
            profile_image_url: profileData.profile_image_url,
            updated_at: new Date().toISOString(),
          }

          // 기존 전화번호가 없고, 카카오에서 전화번호를 받아온 경우
          if (!existingUser.phone && kakaoPhone) {
            updateData.phone = kakaoPhone
            updateData.phone_verified = true
          }

          await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id)

          // 전화번호 또는 닉네임이 없으면 프로필 완성 페이지로 리다이렉트
          const needsPhone = !existingUser.phone && !kakaoPhone
          const needsNickname = !existingUser.nickname
          if (needsPhone || needsNickname) {
            return NextResponse.redirect(`${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`)
          }
        } else {
          // 신규 사용자: users 테이블에 새 레코드 생성 (M2-002)
          const { error: insertError } = await supabase
            .from('users')
            .insert(profileData)

          if (insertError) {
            logger.error('User insert error', { error: insertError.message })
          }

          // 카카오에서 전화번호를 받아온 경우에도 닉네임은 필수 입력
          // 항상 complete-profile 페이지로 이동 (신규 카카오 사용자)
          return NextResponse.redirect(`${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`)
        }
      }
    }

    // 그 외 (비밀번호 재설정 등)는 next 파라미터로 이동
    return NextResponse.redirect(`${origin}${next}`)
  }

  // code가 없는 경우 로그인 페이지로
  return NextResponse.redirect(`${origin}/auth/login`)
}


