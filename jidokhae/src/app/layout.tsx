import type { Metadata } from 'next'
import { Noto_Serif_KR } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import AuthProvider from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/server'

// Pretendard - 본문 및 UI용 (로컬 폰트)
const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
})

// Noto Serif KR - 제목, 인용문, 책 제목용 (Google Fonts)
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '지독해 - 경주·포항 프라이빗 독서 클럽',
  description: '지적인 사유와 깊은 대화가 있는 곳. 지독해 멤버십에서 새로운 관점을 만나세요.',
  keywords: ['독서모임', '경주', '포항', '지독해', '북클럽', '멤버십'],
  openGraph: {
    title: '지독해 - 경주·포항 프라이빗 독서 클럽',
    description: '지적인 사유와 깊은 대화가 있는 곳. 지독해 멤버십에서 새로운 관점을 만나세요.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    user = data
  }

  return (
    <html lang="ko" className={`${pretendard.variable} ${notoSerifKR.variable}`}>
      <body className="font-sans min-h-screen bg-[#FAFAF9]">
        <AuthProvider>
          {/* 데스크톱: 사이드바 + 콘텐츠 영역 */}
          <div className="lg:flex">
            {/* 고정 사이드바 (데스크톱 전용) */}
            <Sidebar user={user} />

            {/* 메인 콘텐츠 영역 */}
            <div className="lg:ml-64 flex-1 min-h-screen flex flex-col">
              {/* 모바일/태블릿 헤더 */}
              <div className="lg:hidden">
                <Header user={user} />
              </div>

              <main className="flex-1">
                {children}
              </main>

              <Footer />
            </div>
          </div>
        </AuthProvider>
        {/* 포트원 결제 SDK */}
        <Script
          src="https://cdn.portone.io/v2/browser-sdk.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
