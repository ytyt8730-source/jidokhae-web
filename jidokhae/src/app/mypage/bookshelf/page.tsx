/**
 * 내 책장 페이지
 * M4 소속감 - Phase 5
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import AddBookForm from './AddBookForm'
import QuoteCardGenerator from '@/components/QuoteCardGenerator'

export const metadata = {
  title: '내 책장 - 지독해',
  description: '함께 읽은 책을 기록하세요.',
}

export default async function BookshelfPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // 책장 목록 조회
  const { data: books } = await supabase
    .from('bookshelf')
    .select('id, title, author, one_line_note, created_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* 헤더 */}
      <div>
        <Link
          href="/mypage"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          마이페이지로
        </Link>

        <h1 className="flex items-center gap-3 text-2xl font-bold text-brand-800">
          <BookOpen className="text-brand-600" size={28} strokeWidth={1.5} />
          내 책장
        </h1>
        <p className="text-gray-600 mt-2">
          지독해와 함께 읽은 책을 기록해보세요.
        </p>
      </div>

      {/* 책 등록 폼 */}
      <AddBookForm />

      {/* 책 목록 */}
      <div className="space-y-4">
        <h2 className="font-semibold text-brand-800">
          등록한 책 ({books?.length || 0}권)
        </h2>

        {books && books.length > 0 ? (
          <div className="grid gap-4">
            {books.map((book: { id: string; title: string; author: string | null; one_line_note: string | null; created_at: string }) => (
              <div
                key={book.id}
                className="card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} strokeWidth={1.5} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-brand-800 truncate">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-sm text-gray-500">
                        {book.author} 저
                      </p>
                    )}
                    {book.one_line_note && (
                      <p className="mt-2 text-sm text-gray-700 italic">
                        &quot;{book.one_line_note}&quot;
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {format(new Date(book.created_at), 'yyyy년 M월 d일', { locale: ko })} 등록
                    </p>

                    {/* M7-020: 한 문장 카드 이미지 생성 */}
                    {book.one_line_note && (
                      <QuoteCardGenerator
                        quote={book.one_line_note}
                        bookTitle={book.title}
                        author={book.author}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen size={48} strokeWidth={1.5} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              아직 등록한 책이 없습니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              위에서 첫 번째 책을 등록해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
