'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'

// Deep Olive Color Palette
const colors = {
  bg: '#FFFFFF',
  primary: '#3A4A3F',
  primaryHover: '#2D3B32',
  text: '#2C3330',
  textMuted: '#6B7280',
  cardBg: '#FFFFFF',
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
    maxParticipants: 8,
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
    maxParticipants: 8,
  },
  {
    id: 3,
    date: '2026년 2월 22일 (토)',
    time: '오후 2:00',
    title: '데미안',
    author: '헤르만 헤세',
    location: '경주 첨성대 인근',
    status: '예정',
    participants: 2,
    maxParticipants: 10,
  },
]

const quote = {
  text: '책은 도끼다. 우리 안의 얼어붙은 바다를 깨뜨리는.',
  author: '프란츠 카프카',
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'urgent' }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md
        ${variant === 'urgent'
          ? 'bg-amber-50 text-amber-700'
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-6"
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={isUrgent ? 'urgent' : 'default'}>
          {meeting.status}
        </Badge>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {meeting.participants}명 참여
        </span>
      </div>

      {/* Title - Using serif font */}
      <h3
        className="font-serif text-xl font-bold mb-1"
        style={{ color: colors.text }}
      >
        {meeting.title}
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
        {meeting.author}
      </p>

      {/* Info */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} style={{ color: colors.primary }} />
          <span className="text-sm" style={{ color: colors.text }}>
            {meeting.date} · {meeting.time}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin size={16} style={{ color: colors.primary }} />
          <span className="text-sm" style={{ color: colors.text }}>
            {meeting.location}
          </span>
        </div>
      </div>

      {/* Button */}
      <button
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: colors.primary }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
      >
        참여하기
      </button>
    </motion.article>
  )
}

export default function OliveMockupPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Mobile Container */}
      <div className="max-w-[430px] mx-auto min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>

        {/* Header */}
        <header
          className="sticky top-0 z-50 px-5 py-4"
          style={{ backgroundColor: colors.bg }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/mockup"
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} style={{ color: colors.text }} />
            </Link>
            <h1
              className="font-serif text-xl font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              지독해
            </h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        {/* Quote Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-5 py-8"
        >
          <div className="text-center">
            <BookOpen size={24} className="mx-auto mb-4 opacity-40" style={{ color: colors.primary }} />
            <blockquote
              className="font-serif text-lg leading-relaxed mb-2"
              style={{ color: colors.text }}
            >
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <cite
              className="text-sm not-italic"
              style={{ color: colors.textMuted }}
            >
              — {quote.author}
            </cite>
          </div>
        </motion.section>

        {/* Section Title */}
        <div className="px-5 mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.text }}
          >
            다가오는 모임
          </h2>
        </div>

        {/* Meeting Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-5 pb-8 space-y-4"
        >
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-5 pb-8"
        >
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: `${colors.primary}08` }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: colors.text }}
            >
              첫 모임이신가요?
            </p>
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-colors"
              style={{
                borderColor: colors.primary,
                color: colors.primary,
              }}
            >
              모임 안내 보기
            </button>
          </div>
        </motion.div>

        {/* Design Info Footer */}
        <div className="px-5 pb-6">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-center text-gray-400">
              Design Concept: Intellectual Luxury (Deep Olive)
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
