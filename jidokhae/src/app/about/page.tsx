import { BookOpen, Users, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export const metadata = {
  title: '소개 - 지독해',
  description: '경주와 포항에서 매주 열리는 독서모임, 지독해를 소개합니다.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      {/* 히어로 */}
      <section className="text-center space-y-6">
        <div className="inline-block p-4 bg-brand-50 rounded-full">
          <BookOpen className="text-brand-600" size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-warm-900">
          지독하게 책을 읽는 사람들,
          <br />
          <span className="text-gradient">지독해</span>
        </h1>
        <p className="text-lg text-warm-600 max-w-2xl mx-auto">
          경주와 포항에서 매주 토요일, 함께 책을 읽고 생각을 나눕니다.
          <br />
          바쁜 일상 속에서 잠시 멈춰 책과 함께하는 시간을 선물해 드려요.
        </p>
      </section>

      {/* 소개 */}
      <section className="grid sm:grid-cols-2 gap-8">
        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <Users className="text-green-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-warm-900">함께 읽는 즐거움</h3>
          <p className="text-warm-600 leading-relaxed">
            혼자 읽는 것도 좋지만, 함께 읽으면 더 깊어집니다.
            같은 공간에서 각자의 책을 읽고, 마지막엔 서로의 책을 소개해요.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Heart className="text-blue-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-warm-900">따뜻한 분위기</h3>
          <p className="text-warm-600 leading-relaxed">
            처음 오시는 분도 편안하게 참여할 수 있어요.
            경쟁 없이, 비교 없이, 그저 책을 좋아하는 사람들의 모임입니다.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <MapPin className="text-orange-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-warm-900">경주 & 포항</h3>
          <p className="text-warm-600 leading-relaxed">
            경주와 포항의 아늑한 카페에서 매주 토요일 오후에 만나요.
            지역의 숨은 북카페들을 돌아다니는 재미도 있답니다.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <BookOpen className="text-purple-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-warm-900">자유로운 책 선택</h3>
          <p className="text-warm-600 leading-relaxed">
            정해진 책 없이 각자 읽고 싶은 책을 가져오세요.
            소설, 에세이, 자기계발서, 만화책까지 모두 환영합니다.
          </p>
        </div>
      </section>

      {/* 진행 방식 */}
      <section className="card p-8 bg-gradient-to-br from-warm-50 to-brand-50">
        <h2 className="text-2xl font-bold text-warm-900 mb-6 text-center">
          모임은 이렇게 진행돼요
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              1
            </div>
            <div>
              <h4 className="font-medium text-warm-900">독서 시간 (60분)</h4>
              <p className="text-sm text-warm-600">조용한 카페에서 각자 준비한 책을 읽어요.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              2
            </div>
            <div>
              <h4 className="font-medium text-warm-900">휴식 시간 (10분)</h4>
              <p className="text-sm text-warm-600">커피 한 잔 마시며 잠깐 쉬어요.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              3
            </div>
            <div>
              <h4 className="font-medium text-warm-900">책 소개 & 소감 나누기 (50분)</h4>
              <p className="text-sm text-warm-600">돌아가며 읽은 책을 소개하고 이야기를 나눠요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-6">
        <h2 className="text-2xl font-bold text-warm-900">
          함께 책 읽을 준비 되셨나요?
        </h2>
        <p className="text-warm-600">
          지금 바로 다가오는 모임을 확인해보세요.
        </p>
        <Link href="/meetings">
          <Button size="lg">모임 일정 보기</Button>
        </Link>
      </section>
    </div>
  )
}

