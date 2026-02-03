'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Heart, MapPin, Calendar, Quote } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useTheme } from '@/providers/ThemeProvider'
import {
  sectionFadeIn,
  staggerContainer,
  staggerItem,
  galleryStagger,
  galleryItem,
  reviewStagger,
  reviewItem,
} from '@/lib/animations'

interface PublicReview {
  id: string
  content: string
  created_at: string
  user: {
    name: string
    joined_year: number
  }
  meeting: {
    title: string
  }
}

interface GalleryImage {
  id: string
  image_url: string
  alt_text: string
}

interface LandingContentProps {
  stats: {
    memberCount: number
    meetingCount: number
  }
  reviews: PublicReview[]
  galleryImages: GalleryImage[]
}

// 기본 갤러리 이미지 (DB에 이미지가 없을 때 사용)
const defaultGalleryImages: GalleryImage[] = [
  { id: 'default-1', image_url: '/images/gallery/meeting-1.jpg', alt_text: '독서 모임 풍경 1' },
  { id: 'default-2', image_url: '/images/gallery/meeting-2.jpg', alt_text: '독서 모임 풍경 2' },
  { id: 'default-3', image_url: '/images/gallery/meeting-3.jpg', alt_text: '독서 모임 풍경 3' },
  { id: 'default-4', image_url: '/images/gallery/meeting-4.jpg', alt_text: '독서 모임 풍경 4' },
]

// 스크롤 트리거 섹션 래퍼
function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={sectionFadeIn}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function LandingContent({ stats, reviews, galleryImages }: LandingContentProps) {
  const { theme } = useTheme()
  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true })

  // DB 이미지가 없으면 기본 이미지 사용
  const displayGalleryImages = galleryImages.length > 0 ? galleryImages : defaultGalleryImages

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-brand-50 to-gray-100 overflow-hidden"
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-brand-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-200 rounded-full opacity-40 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-brand-500 text-white rounded-full mb-8 shadow-lg"
          >
            <BookOpen size={40} strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl heading-themed font-bold text-brand-800 mb-6 leading-tight"
          >
            책을 사랑하는 사람들이
            <br />
            <span className="text-brand-600">모이는 곳</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            경주와 포항에서 매주 모여 책을 읽고 이야기를 나눕니다.
            <br className="hidden sm:block" />
            책 한 권을 읽고, 생각을 나누고, 친구가 됩니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto px-8">
                지금 시작하기
              </Button>
            </Link>
            <Link href="/meetings">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                일정 보러가기
              </Button>
            </Link>
          </motion.div>

          {/* 통계 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 flex justify-center gap-12 sm:gap-20"
          >
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-brand-600">
                {stats.memberCount > 0 ? stats.memberCount : '250'}+
              </p>
              <p className="text-sm text-gray-500 mt-1">명의 회원</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-brand-600">
                {stats.meetingCount > 0 ? stats.meetingCount : '100'}+
              </p>
              <p className="text-sm text-gray-500 mt-1">회의 모임</p>
            </div>
          </motion.div>
        </motion.div>

        {/* 스크롤 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-300 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-2.5 bg-gray-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* 우리의 이야기 */}
      <AnimatedSection className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
              우리의 이야기
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              지독해는 &apos;지독하게 책을 읽는 사람들의 모임&apos;입니다.
              <br />
              2024년 시작되어 지금까지 함께 책을 읽고 있습니다.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 gap-6"
          >
            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                <Users className="text-brand-600" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-brand-800">함께 읽는 즐거움</h3>
              <p className="text-gray-600 leading-relaxed">
                혼자 읽는 것도 좋지만, 함께 읽으면 더 깊어집니다.
                같은 공간에서 각자의 책을 읽고, 마지막엔 서로의 책을 소개해요.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                <Heart className="text-pink-500" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-brand-800">따뜻한 분위기</h3>
              <p className="text-gray-600 leading-relaxed">
                처음 오시는 분도 편안하게 참여할 수 있어요.
                경쟁 없이, 비교 없이, 그저 책을 좋아하는 사람들의 모임입니다.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin className="text-blue-500" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-brand-800">경주 & 포항</h3>
              <p className="text-gray-600 leading-relaxed">
                경주와 포항의 아늑한 카페에서 매주 토요일 오후에 만나요.
                지역의 숨은 북카페들을 돌아다니는 재미도 있답니다.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <BookOpen className="text-purple-500" size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-brand-800">자유로운 책 선택</h3>
              <p className="text-gray-600 leading-relaxed">
                정해진 책 없이 각자 읽고 싶은 책을 가져오세요.
                소설, 에세이, 자기계발서, 만화책까지 모두 환영합니다.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* 분위기 갤러리 */}
      <AnimatedSection className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
              이런 분위기예요
            </h2>
            <p className="text-gray-600">
              편안하고 따뜻한 공간에서 함께 책을 읽어요
            </p>
          </div>

          <motion.div
            variants={galleryStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {displayGalleryImages.map((image) => (
              <motion.div
                key={image.id}
                variants={galleryItem}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group"
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // 이미지 로드 실패 시 플레이스홀더 표시
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                {/* 플레이스홀더 (이미지 없을 때) */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">
                  <BookOpen className="text-brand-300" size={48} strokeWidth={1.5} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* 모임 진행 방식 */}
      <AnimatedSection className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
              모임은 이렇게 진행돼요
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-6"
          >
            {[
              {
                step: 1,
                title: '독서 시간 (60분)',
                description: '조용한 카페에서 각자 준비한 책을 읽어요.',
                icon: BookOpen,
              },
              {
                step: 2,
                title: '휴식 시간 (10분)',
                description: '커피 한 잔 마시며 잠깐 쉬어요.',
                icon: Calendar,
              },
              {
                step: 3,
                title: '책 소개 & 소감 나누기 (50분)',
                description: '돌아가며 읽은 책을 소개하고 이야기를 나눠요.',
                icon: Users,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                className="flex gap-4 sm:gap-6 items-start"
              >
                <div className="w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-md">
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-brand-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* 회원 후기 */}
      {reviews.length > 0 && (
        <AnimatedSection className="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-brand-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
                회원분들의 이야기
              </h2>
              <p className="text-gray-600">
                지독해와 함께한 분들의 솔직한 후기
              </p>
            </div>

            <motion.div
              variants={reviewStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={reviewItem}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                >
                  <Quote className="text-brand-200 mb-4" size={32} strokeWidth={1.5} />
                  <p className={`text-gray-700 leading-relaxed mb-4 line-clamp-4 ${theme === 'warm' ? 'font-serif' : ''}`}>
                    &ldquo;{review.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{review.user.name}</span>
                    <span>{review.user.joined_year}년 합류</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>
      )}

      {/* 후기가 없는 경우 */}
      {reviews.length === 0 && (
        <AnimatedSection className="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-brand-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
              회원분들의 이야기
            </h2>
            <p className="text-gray-500">
              곧 회원분들의 후기가 올라올 예정이에요!
            </p>
          </div>
        </AnimatedSection>
      )}

      {/* CTA */}
      <AnimatedSection className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-brand-50 to-gray-50 rounded-3xl p-8 sm:p-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-4">
              함께 책 읽을 준비 되셨나요?
            </h2>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
              처음이신가요? 부담 없이 한 번 참여해보세요!
              <br />
              정기모임 한 번 참여로 시작할 수 있어요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/meetings?type=regular">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  정기모임 신청하기
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </div>
  )
}
