import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러 처리 (M2-004: 카카오 로그인 취소 포함)
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
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
      console.error('Code exchange error:', exchangeError.message)
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

        // 카카오에서 받아온 프로필 정보
        const profileData = {
          id: user.id,
          email: user.email || userMetadata.email,
          name: userMetadata.name || userMetadata.full_name || userMetadata.preferred_username || '사용자',
          phone: kakaoPhone,  // 카카오 전화번호 (있는 경우)
          phone_verified: kakaoPhone ? true : false,  // 카카오 인증 전화번호는 검증됨
          profile_image_url: userMetadata.avatar_url || userMetadata.picture,
          auth_provider: 'kakao',
          is_new_member: true, // 신규 회원 여부 (첫 6개월 정기모임 참여 전까지)
        }

        // 기존 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, phone, is_new_member')
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

          // 전화번호가 여전히 없으면 전화번호 입력 페이지로 리다이렉트 (M2-005)
          if (!existingUser.phone && !kakaoPhone) {
            return NextResponse.redirect(`${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`)
          }
        } else {
          // 신규 사용자: users 테이블에 새 레코드 생성 (M2-002)
          const { error: insertError } = await supabase
            .from('users')
            .insert(profileData)

          if (insertError) {
            console.error('User insert error:', insertError.message)
          }

          // 카카오에서 전화번호를 받아온 경우 → 바로 다음 페이지로
          // 전화번호가 없는 경우 → 전화번호 입력 페이지로 (M2-005)
          if (!kakaoPhone) {
            return NextResponse.redirect(`${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`)
          }
        }
      }
    }

    // 그 외 (비밀번호 재설정 등)는 next 파라미터로 이동
    return NextResponse.redirect(`${origin}${next}`)
  }

  // code가 없는 경우 로그인 페이지로
  return NextResponse.redirect(`${origin}/auth/login`)
}


