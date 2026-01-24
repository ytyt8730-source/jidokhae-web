'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, ArrowLeft, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Terracotta Color Palette
const colors = {
  bg: '#FAFAF9',
  primary: '#B85C38',
  primaryHover: '#A04E2E',
  primaryLight: '#B85C3815',
  text: '#2D3436',
  textMuted: '#636E72',
  cardBg: '#FFFFFF',
  cardShadow: '0 4px 24px rgba(184, 92, 56, 0.08)',
}

// Mock Data
const meetings = [
  {
    id: 1,
    date: '2026년 2월 8일 (토)',
    time: '오후 2:00',
    title: '나는 왜 쓰는가',
    author: '조지 오웰',
    location: '경주 황리단길 북카페',
    status: '모집중',
    participants: 5,
    emoji: '📖',
  },
  {
    id: 2,
    date: '2026년 2월 15일 (토)',
    time: '오후 3:00',
    title: '우리가 빛의 속도로 갈 수 없다면',
    author: '김초엽',
    location: '포항 영일대 카페',
    status: '마감임박',
    participants: 7,
    emoji: '🚀',
  },
  {
    id: 3,
    date: '2026년 2월 22일 (토)',
    time: '오후 2:00',
    title: '데미안',
    author: '헤르만 헤세',
    location: '경주 첨성대 인근',
    status: '모집중',
    participants: 2,
    emoji: '🦋',
  },
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'urgent' }) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full
        ${variant === 'urgent'
          ? 'bg-orange-100 text-orange-600'
          : 'text-white'
        }
      `}
      style={variant === 'default' ? { backgroundColor: colors.primary } : {}}
    >
      {children}
    </span>
  )
}

function MeetingCard({ meeting }: { meeting: typeof meetings[0] }) {
  const isUrgent = meeting.status === '마감임박'

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-5 overflow-hidden"
      style={{
        backgroundColor: colors.cardBg,
        boxShadow: colors.cardShadow,
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meeting.emoji}</span>
          <Badge variant={isUrgent ? 'urgent' : 'default'}>
            {meeting.status}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} style={{ color: colors.textMuted }} />
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            {meeting.participants}명
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold mb-0.5 leading-snug"
        style={{ color: colors.text }}
      >
        {meeting.title}
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
        {meeting.author}
      </p>

      {/* Info Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
        >
          <Calendar size={12} />
          <span>{meeting.date}</span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ backgroundColor: colors.primaryLight, color: colors.primary }}
        >
          <MapPin size={12} />
          <span>{meeting.location}</span>
        </div>
      </div>

      {/* Button */}
      <button
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ backgroundColor: colors.primary }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
      >
        함께하기
      </button>
    </motion.article>
  )
}

export default function TerracottaMockupPage() {
  return (
    <div style={{ backgroundColor: colors.bg }} className="min-h-screen">
      {/* Mobile Container */}
      <div className="max-w-[430px] mx-auto min-h-screen" style={{ backgroundColor: colors.bg }}>

        {/* Header */}
        <header className="sticky top-0 z-50 px-5 py-4 backdrop-blur-md" style={{ backgroundColor: `${colors.bg}E6` }}>
          <div className="flex items-center justify-between">
            <Link
              href="/mockup"
              className="p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors"
            >
              <ArrowLeft size={20} style={{ color: colors.text }} />
            </Link>
            <h1
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              지독해
            </h1>
            <div className="w-9" />
          </div>
        </header>

        {/* Welcome Banner */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="px-5 pt-2 pb-6"
        >
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, #C76B4A 100%)`,
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-3 right-3 opacity-20">
              <Sparkles size={40} className="text-white" />
            </div>

            <h2 className="text-white text-lg font-bold mb-1">
              함께 읽고, 함께 성장해요
            </h2>
            <p className="text-white/80 text-sm mb-4">
              경주 · 포항 독서 모임
            </p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['🙂', '😊', '🤓', '📚'].map((emoji, i) => (
                  <span
                    key={i}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm border-2 border-white/30"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-white/90 text-xs font-medium">
                +42명이 함께하고 있어요
              </span>
            </div>
          </div>
        </motion.section>

        {/* Section Title */}
        <div className="px-5 mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: colors.text }}
          >
            다가오는 모임
          </h2>
          <button
            className="text-sm font-medium"
            style={{ color: colors.primary }}
          >
            전체보기
          </button>
        </div>

        {/* Meeting Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-5 pb-6 space-y-4"
        >
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </motion.div>

        {/* Community Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-5 pb-6"
        >
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.cardBg, boxShadow: colors.cardShadow }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Heart size={20} style={{ color: colors.primary }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: colors.text }}>
                  칭찬 릴레이
                </h3>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  이번 주 15개의 칭찬이 오갔어요
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-sm px-3 py-1 rounded-full bg-pink-50 text-pink-600">
                #따뜻한 분위기
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                #깊은 대화
              </span>
            </div>
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-5 pb-8"
        >
          <button
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.text,
              color: '#FFFFFF',
            }}
          >
            <span>첫 모임 신청하기</span>
            <Sparkles size={16} />
          </button>
        </motion.div>

        {/* Design Info Footer */}
        <div className="px-5 pb-6">
          <div
            className="border-t pt-4"
            style={{ borderColor: `${colors.primary}20` }}
          >
            <p className="text-xs text-center" style={{ color: colors.textMuted }}>
              Design Concept: Warm Connection (Terracotta)
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
