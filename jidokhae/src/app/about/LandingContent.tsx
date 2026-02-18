'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Heart, MapPin, ChevronDown } from 'lucide-react'
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
        className="relative min-h-[80vh] flex items-center justify-center bg-bg-base overflow-hidden"
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/15 rounded-full opacity-40 blur-3xl" />
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
            className="inline-flex items-center justify-center w-20 h-20 bg-primary text-white rounded-full mb-8 shadow-lg"
          >
            <BookOpen size={40} strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`text-4xl sm:text-5xl md:text-6xl font-bold text-text mb-6 leading-tight ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}
          >
            혼자 읽는 독서,
            <br />
            <span className="text-primary">조금 지루하지 않으세요?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            책 사놓고 안 읽은 지 몇 달째.
            <br />
            진지한 대화 나눌 곳도 마땅치 않고.
            <br />
            그래서 매주 모여서 읽기로 했습니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/meetings">
              <Button size="lg" className="w-full sm:w-auto px-8">
                이번 달 일정 보기
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8 inline-flex items-center gap-2"
              onClick={() => document.getElementById('founder-story')?.scrollIntoView({ behavior: 'smooth' })}
            >
              어떤 모임인지 보기
              <ChevronDown size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>

          {/* 통계 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 flex justify-center gap-12 sm:gap-20"
          >
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-display font-bold text-primary">
                {stats.memberCount > 0 ? stats.memberCount : '250'}+
              </p>
              <p className="text-sm text-text-muted mt-1">명의 회원</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-display font-bold text-primary">
                3년째
              </p>
              <p className="text-sm text-text-muted mt-1">이어지는 모임</p>
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
            className="w-6 h-10 border-2 border-[var(--border)] rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-2.5 bg-text-muted rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* 창업자 스토리 섹션 */}
      <section id="founder-story" className="py-16 sm:py-24 bg-bg-base">
        <div className="max-w-xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`text-2xl font-bold text-text mb-8 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}
          >
            우리의 이야기
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <p className="text-base text-text-muted leading-relaxed">
              2022년 6월, 4명이 모였습니다.
              <br />
              각자 책 한 권 들고 카페에 앉았어요.
              <br />
              읽고, 소개하고, 이야기 나눴습니다.
            </p>

            <p className="text-base text-text-muted leading-relaxed">
              그게 3년 넘게 계속되고 있고,
              <br />
              지금은 250명의 회원이 있어요.
            </p>

            <p className="text-base text-text font-medium leading-relaxed">
              경주에서 수요일마다,
              <br />
              포항에서 토요일마다 만납니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 특징 카드 섹션 */}
      <AnimatedSection className="py-20 sm:py-28 bg-bg-surface">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 gap-6"
          >
            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="text-primary" size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-text">함께 읽는 즐거움</h3>
              <p className="text-text-muted leading-relaxed">
                같은 공간에서 각자의 책을 읽어요.
                <br />
                마지막엔 서로의 책을 소개합니다.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                <Heart className="text-pink-500" size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-text">따뜻한 분위기</h3>
              <p className="text-text-muted leading-relaxed">
                처음 오는 분도 많아요.
                <br />
                책 얘기부터 시작하면 어색할 틈이 없습니다.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-info-bg rounded-xl flex items-center justify-center">
                <MapPin className="text-info" size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-text">경주 & 포항</h3>
              <p className="text-text-muted leading-relaxed">
                경주 수요일, 포항 토요일.
                <br />
                매주 우리만의 지정된 장소에서 만납니다.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="card p-6 space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <BookOpen className="text-purple-500" size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-text">자유로운 책 선택</h3>
              <p className="text-text-muted leading-relaxed">
                장르 제한 없어요.
                <br />
                소설, 에세이, 만화책까지. 한 권만 들고 오면 됩니다.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* 분위기 갤러리 */}
      <AnimatedSection className="py-20 sm:py-28 bg-bg-base">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold text-text mb-4 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}>
              이런 분위기예요
            </h2>
            <p className="text-text-muted">
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
                className="relative aspect-square rounded-xl overflow-hidden bg-[var(--border)] group"
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
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <BookOpen className="text-primary/30" size={48} strokeWidth={1.5} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* SB7 Plan: 이렇게 시작하면 돼요 */}
      <AnimatedSection className="py-20 sm:py-28 bg-bg-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className={`text-2xl sm:text-3xl font-bold text-text mb-2 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}>
              이렇게 시작하면 돼요
            </h2>
            <p className="text-sm text-text-muted">
              처음이어도 괜찮아요. 3번이면 충분합니다.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                step: 1,
                title: '마음에 드는 모임 고르기',
                description: '이번 달 일정에서 원하는 모임을 골라요.',
              },
              {
                step: 2,
                title: '3번 탭으로 신청하기',
                description: '카드 선택, 신청하기, 결제. 끝이에요.',
              },
              {
                step: 3,
                title: '리마인드 받고 참여하기',
                description: '모임 전에 알림을 보내드려요. 잊을 걱정 없어요.',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">
                  {item.title}
                </h3>
                <p className="text-text-muted text-sm">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs text-text-muted text-center mt-6">
            3일 전까지 100% 환불. 셀프로 처리됩니다.
          </p>

          {/* 구분선 */}
          <div className="border-t border-[var(--border)] mt-16 pt-16">
            <div className="text-center mb-12">
              <h2 className={`text-2xl sm:text-3xl font-bold text-text mb-4 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}>
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
                },
                {
                  step: 2,
                  title: '휴식 시간 (10분)',
                  description: '커피 한 잔 마시며 잠깐 쉬어요.',
                },
                {
                  step: 3,
                  title: '책 소개 & 소감 나누기 (50분)',
                  description: '돌아가며 읽은 책을 소개하고 이야기를 나눠요.',
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={staggerItem}
                  className="flex gap-4 sm:gap-6 items-start"
                >
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-md">
                    {item.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-text mb-1">
                      {item.title}
                    </h3>
                    <p className="text-text-muted">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* 회원 후기 */}
      <AnimatedSection className="py-20 sm:py-28 bg-bg-base">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold text-text mb-4 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}>
              회원분들의 이야기
            </h2>
          </div>

          <motion.div
            variants={reviewStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* DB 후기가 있으면 DB 후기 표시, 없으면 하드코딩 후기 표시 */}
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={reviewItem}
                  className="bg-bg-surface border border-[var(--border)] rounded-xl p-6"
                >
                  <p className={`text-base text-text leading-relaxed mb-3 ${theme === 'warm' ? 'font-serif' : ''}`}>
                    &quot;{review.content}&quot;
                  </p>
                  <p className="text-sm text-text-muted truncate">
                    — {review.user.name}, {review.user.joined_year}년 합류
                  </p>
                </motion.div>
              ))
            ) : (
              <>
                <motion.div
                  variants={reviewItem}
                  className="bg-bg-surface border border-[var(--border)] rounded-xl p-6"
                >
                  <p className={`text-base text-text leading-relaxed mb-3 ${theme === 'warm' ? 'font-serif' : ''}`}>
                    &quot;처음엔 어색했는데, 이제는 수요일이 기다려져요.&quot;
                  </p>
                  <p className="text-sm text-text-muted">
                    — 함께한 지 180일째 회원
                  </p>
                </motion.div>

                <motion.div
                  variants={reviewItem}
                  className="bg-bg-surface border border-[var(--border)] rounded-xl p-6"
                >
                  <p className={`text-base text-text leading-relaxed mb-3 ${theme === 'warm' ? 'font-serif' : ''}`}>
                    &quot;책 사놓고 안 읽던 제가 올해 12권 읽었어요.&quot;
                  </p>
                  <p className="text-sm text-text-muted">
                    — 함께한 지 365일째 회원
                  </p>
                </motion.div>

                <motion.div
                  variants={reviewItem}
                  className="bg-bg-surface border border-[var(--border)] rounded-xl p-6"
                >
                  <p className={`text-base text-text leading-relaxed mb-3 ${theme === 'warm' ? 'font-serif' : ''}`}>
                    &quot;여기선 진지한 얘기해도 귓등으로 안 들어요.&quot;
                  </p>
                  <p className="text-sm text-text-muted">
                    — 함께한 지 90일째 회원
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* 최종 CTA - 모든 기기에서 표시 */}
      <section className="py-16 sm:py-20 bg-[var(--primary)] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={`text-2xl sm:text-3xl font-bold text-white mb-8 ${theme === 'warm' ? 'font-serif' : 'font-sans'}`}>
              이번 달 모임, 아직 자리 있어요.
            </h2>
            <Link href="/meetings">
              <button className="bg-white text-[var(--primary)] font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors">
                일정 보기
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
