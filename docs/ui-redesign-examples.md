# UI 리디자인 예시 코드

> **목업 문서와 함께 참조할 실제 구현 예시**

---

## 1. AtmosphericCover 컴포넌트

```tsx
// components/ui/AtmosphericCover.tsx
'use client'

interface AtmosphericCoverProps {
  imageUrl: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AtmosphericCover({
  imageUrl,
  alt,
  size = 'md',
  className = ''
}: AtmosphericCoverProps) {
  const sizeConfig = {
    sm: { container: 'h-32', book: 'h-28' },
    md: { container: 'h-48', book: 'h-40' },
    lg: { container: 'h-64', book: 'h-56' },
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${sizeConfig[size].container} ${className}`}>
      {/* Blurred Background */}
      <div
        className="absolute inset-[-20px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageUrl})`,
          filter: 'blur(25px) saturate(1.3)',
          opacity: 0.6,
        }}
      />

      {/* Book Cover */}
      <img
        src={imageUrl}
        alt={alt}
        className={`relative z-10 ${sizeConfig[size].book} mx-auto shadow-xl rounded object-cover`}
        style={{
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  )
}
```

---

## 2. GrowthCard 컴포넌트 (MY GROWTH)

```tsx
// components/cards/GrowthCard.tsx
'use client'

import { Trophy, Flame } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'

interface GrowthCardProps {
  badgeName: string
  remaining: number
  progress: number
  nextReward: string
}

export function GrowthCard({
  badgeName,
  remaining,
  progress,
  nextReward
}: GrowthCardProps) {
  const { theme } = useTheme()

  return (
    <div className="relative rounded-2xl p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Trophy Icon with Glow */}
      <Trophy
        className="absolute top-5 right-5"
        size={24}
        strokeWidth={1.5}
        style={{
          color: theme === 'electric' ? '#CCFF00' : '#EA580C',
          filter: `drop-shadow(0 0 8px ${theme === 'electric' ? '#CCFF00' : '#EA580C'})`,
        }}
      />

      {/* Label */}
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-3"
        style={{ color: theme === 'electric' ? '#CCFF00' : '#EA580C' }}
      >
        MY GROWTH
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold leading-snug mb-4">
        {badgeName}<span className="text-slate-400">까지</span><br/>
        <span className="inline-flex items-center gap-1">
          {remaining}번 남았어요!
          <Flame size={16} className="text-orange-400" strokeWidth={1.5} />
        </span>
      </h3>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-slate-400">Progress</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress}%`,
              backgroundColor: theme === 'electric' ? '#CCFF00' : '#EA580C',
            }}
          />
        </div>
        <span className="text-sm font-bold">{progress}%</span>
      </div>

      <p className="text-[10px] text-slate-500">
        다음 달성 시: {nextReward}
      </p>
    </div>
  )
}
```

---

## 3. NextRitualCard 컴포넌트 (D-3)

```tsx
// components/cards/NextRitualCard.tsx
'use client'

import { useTheme } from '@/providers/ThemeProvider'
import Link from 'next/link'

interface NextRitualCardProps {
  dday: number
  meetingTitle: string
  meetingId: string
}

export function NextRitualCard({ dday, meetingTitle, meetingId }: NextRitualCardProps) {
  const { theme } = useTheme()

  // Electric: 흰 배경 + 라임 테두리
  // Warm: 오렌지 배경
  const cardClass = theme === 'electric'
    ? 'bg-[var(--bg-surface)] border-2 border-[#CCFF00]'
    : 'bg-[#EA580C]'

  const textClass = theme === 'electric'
    ? 'text-[var(--text)]'
    : 'text-white'

  const labelClass = theme === 'electric'
    ? 'text-[#0047FF]'  // Cobalt, NOT Lime!
    : 'text-white/70'

  return (
    <div className={`rounded-2xl p-5 flex flex-col items-center justify-center text-center ${cardClass}`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${labelClass}`}>
        NEXT
      </div>
      <div className={`text-5xl font-black leading-none mb-2 ${textClass}`}>
        D-{dday}
      </div>
      <p className={`text-xs ${theme === 'electric' ? 'text-[var(--text-muted)]' : 'text-white/80'}`}>
        {meetingTitle}
      </p>
      <Link
        href={`/meetings/${meetingId}`}
        className={`text-[11px] mt-3 underline ${textClass}`}
      >
        준비물 확인하기
      </Link>
    </div>
  )
}
```

---

## 4. SessionBottomSheet 컴포넌트

```tsx
// components/SessionBottomSheet.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react'
import { AtmosphericCover } from './ui/AtmosphericCover'
import { Price } from './ui/Price'
import type { Meeting } from '@/types/database'

interface SessionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  meeting: Meeting | null
  onRegister: (meetingId: string) => void
}

export function SessionBottomSheet({
  isOpen,
  onClose,
  meeting,
  onRegister,
}: SessionBottomSheetProps) {
  if (!meeting) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-[var(--overlay)] z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-[var(--bg-surface)] rounded-t-3xl z-[1001] max-h-[85vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-9 h-1 bg-[var(--border)] rounded-full mx-auto mt-3 mb-4" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--border)] transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Atmospheric Cover */}
              {meeting.book_cover_url && (
                <AtmosphericCover
                  imageUrl={meeting.book_cover_url}
                  alt={meeting.title}
                  size="md"
                  className="mb-5"
                />
              )}

              <h2 className="text-xl font-bold text-[var(--text)] mb-1">
                {meeting.title}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {meeting.book_author}
              </p>

              {/* Details */}
              <div className="flex flex-wrap gap-4 mb-5 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Calendar size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">
                    {new Date(meeting.datetime).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Clock size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">
                    {new Date(meeting.datetime).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <MapPin size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">{meeting.location}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Users size={16} strokeWidth={1.5} />
                  <strong className="text-[var(--text)]">
                    {meeting.current_participants}/{meeting.max_participants}명
                  </strong>
                </span>
              </div>

              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {meeting.description}
              </p>
            </div>

            {/* Sticky CTA */}
            <div className="p-6 border-t border-[var(--border)]">
              <button
                onClick={() => onRegister(meeting.id)}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Price amount={meeting.fee} className="text-white" size="lg" />
                <span>으로 신청하기</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## 5. 개선된 MeetingCard

```tsx
// components/MeetingCard.tsx (개선안)
'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import { AtmosphericCover } from './ui/AtmosphericCover'
import { Price } from './ui/Price'
import Badge from './ui/Badge'
import type { Meeting } from '@/types/database'

interface MeetingCardProps {
  meeting: Meeting & { spotsRemaining?: number; isThisWeek?: boolean }
  onClick?: () => void
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const isAlmostFull = (meeting.spotsRemaining ?? 0) <= 3
  const meetingDate = new Date(meeting.datetime)

  return (
    <motion.article
      className="card cursor-pointer overflow-hidden"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Atmospheric Cover */}
      <div className="relative">
        {meeting.book_cover_url ? (
          <AtmosphericCover
            imageUrl={meeting.book_cover_url}
            alt={meeting.title}
            size="sm"
          />
        ) : (
          <div className="h-32 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 rounded-xl flex items-center justify-center">
            <span className="text-4xl text-[var(--text-muted)]">
              {meeting.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="default">{meeting.meeting_type}</Badge>
          {isAlmostFull && <Badge variant="warning">마감임박</Badge>}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-[var(--text)] line-clamp-1 mb-1">
          {meeting.title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          {meeting.book_author}
        </p>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-[var(--text-muted)] mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} strokeWidth={1.5} />
            <span>
              {meetingDate.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </span>
            <Clock size={14} strokeWidth={1.5} className="ml-2" />
            <span>
              {meetingDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} strokeWidth={1.5} />
            <span>{meeting.location}</span>
            <Users size={14} strokeWidth={1.5} className="ml-2" />
            <span>{meeting.current_participants}명 참여</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <Price amount={meeting.fee} />
          <ChevronRight size={16} className="text-[var(--text-muted)]" strokeWidth={1.5} />
        </div>
      </div>
    </motion.article>
  )
}
```

---

## 6. ThemeToggle 컴포넌트

```tsx
// components/ThemeToggle.tsx
'use client'

import { Zap, Coffee } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'

interface ThemeToggleProps {
  variant?: 'sidebar' | 'header'
}

export function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'header') {
    // 모바일 헤더용 아이콘 버튼
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors"
        aria-label={theme === 'electric' ? 'Switch to Warm Mode' : 'Switch to Electric Mode'}
      >
        {theme === 'electric' ? (
          <Coffee size={20} strokeWidth={1.5} />
        ) : (
          <Zap size={20} strokeWidth={1.5} />
        )}
      </button>
    )
  }

  // 사이드바용 풀 버튼
  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-sm font-semibold hover:bg-[var(--border)] transition-colors"
    >
      {theme === 'electric' ? (
        <>
          <Coffee size={16} strokeWidth={1.5} />
          <span>Warm Mode</span>
        </>
      ) : (
        <>
          <Zap size={16} strokeWidth={1.5} />
          <span>Electric Mode</span>
        </>
      )}
    </button>
  )
}
```

---

## 7. Framer Motion 애니메이션 유틸리티

```tsx
// lib/animations.ts
import { Variants } from 'framer-motion'

// 페이지 진입 stagger
export const pageContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// 개별 아이템 (카드 등)
export const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}

// 호버 스케일
export const hoverScaleVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
}

// Bottom Sheet
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// 페이드 인
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Bento Grid 아이템
export const bentoItemVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
}
```

---

## 8. 개선된 globals.css

```css
/* globals.css 추가/수정 내용 */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ========== Theme Variables ========== */
:root {
  /* Electric Theme (Default) */
  --bg-base: #F8FAFC;
  --bg-surface: #FFFFFF;
  --primary: #0047FF;
  --accent: #CCFF00;
  --accent-readable: #0F172A;
  --text: #0F172A;
  --text-muted: #64748B;
  --text-light: #94A3B8;
  --border: #E2E8F0;
  --overlay: rgba(0, 0, 0, 0.5);

  /* Font families */
  --font-headline: var(--font-outfit, var(--font-noto-sans, sans-serif));
}

[data-theme="warm"] {
  --bg-base: #F5F5F0;
  --bg-surface: #FAFAF7;
  --primary: #0F172A;
  --accent: #EA580C;
  --accent-readable: #FFFFFF;
  --text: #0F172A;
  --text-muted: #64748B;
  --text-light: #94A3B8;
  --border: #E7E5E4;
  --overlay: rgba(15, 23, 42, 0.6);

  /* Font families */
  --font-headline: var(--font-noto-serif, serif);
}

/* ========== Noise Texture for Warm Theme ========== */
[data-theme="warm"] body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ========== Base Styles ========== */
body {
  background: var(--bg-base);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* ========== Themed Headings ========== */
.heading-themed {
  font-family: var(--font-headline);
}

/* ========== Card Base ========== */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

/* ========== Button Primary ========== */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:active {
  transform: scale(0.98);
}

/* ========== Accent Badge ========== */
.badge-accent {
  background: var(--accent);
  color: var(--accent-readable);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ========== Section Label ========== */
.section-label {
  color: var(--primary);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Electric 테마에서 라벨은 Cobalt, Warm에서는 Orange */
[data-theme="warm"] .section-label {
  color: var(--accent);
}

/* ========== Hero Section ========== */
.hero-section {
  background: var(--bg-base);
}

.hero-title {
  color: var(--text);
}

.hero-subtitle {
  color: var(--text-muted);
}

.hero-btn-primary {
  background: var(--primary);
  color: white;
}

.hero-btn-secondary {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}

.hero-btn-secondary:hover {
  background: var(--bg-surface);
}
```

---

## 9. 사용 예시: 홈페이지 적용

```tsx
// app/page.tsx (리디자인 예시)
'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/providers/ThemeProvider'
import { GrowthCard } from '@/components/cards/GrowthCard'
import { NextRitualCard } from '@/components/cards/NextRitualCard'
import { WeeklyCuratorCard } from '@/components/cards/WeeklyCuratorCard'
import { MeetingCard } from '@/components/MeetingCard'
import { SessionBottomSheet } from '@/components/SessionBottomSheet'
import { pageContainerVariants, itemVariants } from '@/lib/animations'
import { useState } from 'react'

export default function HomePage() {
  const { theme } = useTheme()
  const [selectedMeeting, setSelectedMeeting] = useState(null)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-section border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <motion.div
            variants={pageContainerVariants}
            initial="initial"
            animate="animate"
            className="max-w-3xl"
          >
            <motion.h1
              variants={itemVariants}
              className={`text-4xl lg:text-5xl font-bold leading-tight tracking-tight ${
                theme === 'warm' ? 'font-serif' : 'font-sans'
              }`}
            >
              깊은 사유,<br/>새로운 관점
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg lg:text-xl text-[var(--text-muted)] leading-relaxed"
            >
              경주와 포항에서 매주 열리는 프라이빗 독서 클럽.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={pageContainerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants} className="col-span-2">
            <WeeklyCuratorCard />
          </motion.div>
          <motion.div variants={itemVariants}>
            <GrowthCard
              badgeName="열정 배지"
              remaining={2}
              progress={60}
              nextReward="멤버십 포인트 +500"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <NextRitualCard
              dday={3}
              meetingTitle="1월 4주차 정기모임"
              meetingId="xxx"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Session List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={pageContainerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {meetings.map((meeting) => (
            <motion.div key={meeting.id} variants={itemVariants}>
              <MeetingCard
                meeting={meeting}
                onClick={() => setSelectedMeeting(meeting)}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom Sheet */}
      <SessionBottomSheet
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        onRegister={(id) => {/* 결제 로직 */}}
      />
    </div>
  )
}
```

---

*이 예시 코드들은 목업 승인 후 실제 구현 시 참고용입니다.*
