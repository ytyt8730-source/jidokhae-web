import type { Metadata } from 'next'
import { Noto_Serif_KR } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

// Pretendard - 본문 및 UI용 (로컬 폰트)
const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
})

// Noto Serif KR - 제목, 인용문, 책 제목용 (Google Fonts)
// 한국어 폰트이므로 한글은 기본 포함, latin subset 추가
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '지독해 - 경주·포항 독서모임',
  description: '따뜻하고 편안한 독서모임, 지독해에서 함께 책을 읽어요.',
  keywords: ['독서모임', '경주', '포항', '지독해', '책읽기'],
  openGraph: {
    title: '지독해 - 경주·포항 독서모임',
    description: '따뜻하고 편안한 독서모임, 지독해에서 함께 책을 읽어요.',
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
      {/* M7-030: 레터박스 UI - 데스크톱에서 모바일 앱 감성 유지 */}
      <body className="font-sans min-h-screen bg-gray-100">
        <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-xl flex flex-col">
          <Header user={user} />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        {/* 포트원 결제 SDK (M2-013) */}
        <Script
          src="https://cdn.portone.io/v2/browser-sdk.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
