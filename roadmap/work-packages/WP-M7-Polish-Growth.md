# WP-M7: Polish & Growth

---

**문서 버전:** 1.0  
**작성일:** 2026-01-22  
**목표:** MVP 출시 후 첫 달, 신규회원 전환율 70% 달성  
**예상 기간:** 1~2주

---

## 1. 개요

M6 출시 후 수집된 제품 피드백을 반영하여, **전환율 개선**, **리텐션 강화**, **바이럴 장치** 세 축으로 서비스를 고도화합니다.

### 핵심 가치
- **전환율:** 신규회원이 모임 상세 → 결제 완료까지 이탈 없이 진행
- **리텐션:** 참여한 회원이 다음 모임도 신청하게 만드는 감성 설계
- **바이럴:** 회원이 자발적으로 지독해를 홍보하게 만드는 장치

---

## 2. Phase 구조

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 전환율 개선 (1~2일)                                 │
│  ├── M7-001: 환불 규정 "더보기"로 접기                        │
│  ├── M7-002: 첫 방문 뱃지 넛지 배너                          │
│  └── M7-003: 팝업 → 인라인 미리보기로 대체                    │
│                                                              │
│  Phase 2: 리텐션 강화 (2~3일)                                 │
│  ├── M7-010: 참여자 티저 알림                                │
│  ├── M7-011: 여운 메시지 (종료 30분 후)                       │
│  └── M7-012: 내 책장 플레이스홀더 개선                        │
│                                                              │
│  Phase 3: 바이럴 장치 (2~3일)                                 │
│  ├── M7-020: 한 문장 카드 이미지 생성                         │
│  └── M7-021: 랜딩페이지 Hero 섹션 강화 (선택)                 │
│                                                              │
│  Phase 4: 인프라 & 마무리 (0.5일)                             │
│  └── M7-030: 레터박스 UI (데스크톱)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: 전환율 개선

**목표:** 모임 상세 페이지 → 결제 완료 전환율 +20%

### M7-001: 환불 규정 "더보기"로 접기

**문제:** 현재 환불 규정이 전체 노출되어 신청을 주저하게 만듦  
**해결:** 핵심만 보여주고 상세는 접어두기

**대상 파일:** `src/app/meetings/[id]/page.tsx`

**구현:**
```tsx
// 현재
<ul className="space-y-1.5 list-disc list-inside pl-1">
  {formatRefundRules()}
</ul>

// 변경: 첫 번째 규정만 보여주고 나머지는 더보기
'use client' // RefundRulesSection 클라이언트 컴포넌트로 분리

function RefundRulesSection({ rules }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mainRule = rules[0] // "3일 전까지 100% 환불"
  
  return (
    <div>
      <p className="text-sm text-warm-600">
        {mainRule.days_before}일 전까지 {mainRule.refund_percent}% 환불
        {!isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="ml-2 text-brand-500 underline"
          >
            자세히
          </button>
        )}
      </p>
      {isExpanded && (
        <ul className="mt-2 space-y-1 text-sm text-warm-500">
          {rules.slice(1).map(...)}
        </ul>
      )}
    </div>
  )
}
```

**검증:**
- [ ] 기본 상태에서 "3일 전까지 100% 환불"만 표시
- [ ] "자세히" 클릭 시 전체 규정 펼쳐짐
- [ ] 정기모임/토론모임 각각 올바른 규정 표시

---

### M7-002: 첫 방문 뱃지 넛지 배너

**문제:** 신규회원이 결제를 망설임  
**해결:** "웰컴 배지" 보상 예고로 손실 회피 심리 자극

**대상 파일:** `src/app/meetings/[id]/page.tsx`

**조건:** `currentUser?.is_new_member === true`

**구현:**
```tsx
{/* 신청 버튼 영역 */}
<div className="pt-4 border-t border-warm-100">
  {/* 첫 방문 뱃지 넛지 (신규회원만) */}
  {currentUser?.is_new_member && !alreadyRegistered && meetingWithStatus.displayStatus !== 'closed' && (
    <div className="mb-4 p-3 bg-brand-50 rounded-xl flex items-center gap-3 animate-pulse-slow">
      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
        <span className="text-xl">🎖️</span>
      </div>
      <div>
        <p className="font-medium text-brand-700">
          첫 모임 신청 시 <span className="font-bold">웰컴 멤버</span> 배지가 지급됩니다!
        </p>
      </div>
    </div>
  )}
  
  {/* 기존 신청 버튼 */}
  ...
</div>
```

**CSS 추가 (globals.css):**
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
```

**검증:**
- [ ] 신규회원(`is_new_member=true`)에게만 배너 표시
- [ ] 기존회원에게는 표시 안 됨
- [ ] 이미 신청한 경우 표시 안 됨
- [ ] 부드러운 펄스 애니메이션 동작

---

### M7-003: 팝업 → 인라인 미리보기로 대체

**문제:** 팝업이 신청 흐름을 끊음  
**해결:** 팝업 제거, 모임 상세 페이지 상단에 인라인 "분위기 미리보기" 섹션 추가

**작업 1: 인라인 미리보기 섹션 추가**

**대상 파일:** `src/app/meetings/[id]/page.tsx`

```tsx
// 공개 동의한 후기 조회 (서버 컴포넌트)
const { data: publicReviews } = await supabase
  .from('reviews')
  .select('content, users(name)')
  .eq('is_public', true)
  .eq('meeting_id', meeting.id)
  .limit(3)

// 또는 전체 공개 후기 중 랜덤 3개
const { data: publicReviews } = await supabase
  .from('reviews')
  .select('content')
  .eq('is_public', true)
  .limit(10)

// 랜덤 셔플 후 3개 선택 (클라이언트)
```

**UI:**
```tsx
{/* 분위기 미리보기 - 신규회원에게만 표시 */}
{currentUser?.is_new_member && publicReviews?.length > 0 && (
  <div className="mb-6 p-4 bg-warm-50 rounded-xl">
    <h3 className="text-sm font-medium text-warm-700 mb-3">
      💬 지난 모임의 분위기
    </h3>
    <div className="space-y-2">
      {publicReviews.slice(0, 3).map((review, i) => (
        <p key={i} className="text-sm text-warm-600 italic">
          "{review.content.slice(0, 50)}..."
        </p>
      ))}
    </div>
    <Link href="/about" className="text-xs text-brand-500 mt-2 inline-block">
      지독해 더 알아보기 →
    </Link>
  </div>
)}
```

**작업 2: 기존 팝업 비활성화**

**대상 파일:** `src/components/NewMemberGuideModal.tsx`

- 삭제하지 말고 `// DEPRECATED: M7-003에서 인라인으로 대체됨` 주석 추가
- 또는 `shouldShow` 조건을 항상 `false`로 변경

**MeetingCard.tsx에서 팝업 호출 제거:**
- `useNewMemberGuide` 훅 호출 제거
- 카드 클릭 시 바로 상세 페이지로 이동

**검증:**
- [ ] 신규회원이 모임 카드 클릭 시 팝업 없이 바로 상세 페이지 이동
- [ ] 상세 페이지 상단에 "분위기 미리보기" 표시 (신규회원만)
- [ ] 기존회원에게는 미리보기 섹션 미표시 (깔끔한 화면)
- [ ] "지독해 더 알아보기" 링크 동작

---

## 4. Phase 2: 리텐션 강화

**목표:** 노쇼율 -30%, 재참여율 +15%

### M7-010: 참여자 티저 알림

**문제:** "내일 모임이 있어요"는 의무감만 줌  
**해결:** "누구를 만날지" 기대감 유발

**대상 파일:** `src/lib/reminder.ts`, `notification_templates` 테이블

**조건:** 해당 모임 참가자 중 배지 보유자가 있을 때만 적용

**알림 템플릿 변경:**
```sql
-- 기존 REMINDER_1D 업데이트
UPDATE notification_templates
SET message_template = '[지독해] #{모임명} 내일이에요!

안녕하세요, #{이름}님!

내일 #{시간}에 #{모임명}이 있어요.
#{티저_문구}

장소: #{장소}

내일 뵙겠습니다!'
WHERE code = 'REMINDER_1D';
```

**티저 문구 생성 로직 (reminder.ts):**
```typescript
async function generateTeaserText(meetingId: string): Promise<string> {
  // 해당 모임 참가자 중 배지 보유자 조회
  const { data: participants } = await supabase
    .from('registrations')
    .select(`
      user_id,
      users!inner(
        badges(badge_type)
      )
    `)
    .eq('meeting_id', meetingId)
    .eq('status', 'confirmed')
  
  // 배지 보유자가 있으면 티저 생성
  const badgeHolders = participants?.filter(p => p.users.badges?.length > 0)
  
  if (badgeHolders && badgeHolders.length > 0) {
    // 랜덤으로 하나 선택
    const holder = badgeHolders[Math.floor(Math.random() * badgeHolders.length)]
    const badge = holder.users.badges[0].badge_type
    const badgeName = BADGE_DISPLAY_NAMES[badge] // '10회 참석', '인사이트 메이커' 등
    return `✨ 이번 모임에 '${badgeName}' 뱃지 보유자가 참여해요!`
  }
  
  return '' // 배지 보유자 없으면 빈 문자열
}
```

**검증:**
- [ ] 배지 보유자 있는 모임: 티저 문구 포함된 알림 발송
- [ ] 배지 보유자 없는 모임: 기존 형태 알림 발송
- [ ] 개인정보(이름) 노출 없음

---

### M7-011: 여운 메시지 (종료 30분 후)

**문제:** 모임 종료 후 여운이 없음  
**해결:** 귀가 시간에 가벼운 질문으로 기억 강화

**신규 파일:** `src/app/api/cron/afterglow/route.ts`

```typescript
/**
 * 여운 메시지 발송 Cron
 * 모임 종료 30분 후 자동 발송
 * 
 * Vercel Cron: 매 30분 실행 (0,30 * * * *)
 */

export async function GET(request: Request) {
  // 30분 전에 종료된 모임 조회
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const { data: endedMeetings } = await supabase
    .from('meetings')
    .select('id, title')
    .gte('datetime', oneHourAgo.toISOString())
    .lte('datetime', thirtyMinutesAgo.toISOString())
  
  // 각 모임의 참가자에게 여운 메시지 발송
  for (const meeting of endedMeetings) {
    const { data: participants } = await supabase
      .from('registrations')
      .select('users(phone, name)')
      .eq('meeting_id', meeting.id)
      .eq('status', 'confirmed')
    
    for (const p of participants) {
      await sendAlimtalk({
        phone: p.users.phone,
        templateCode: 'AFTERGLOW',
        variables: { 이름: p.users.name }
      })
    }
  }
}
```

**알림 템플릿:**
```sql
INSERT INTO notification_templates (code, name, message_template, variables, send_timing, is_active)
VALUES (
  'AFTERGLOW',
  '여운 메시지',
  '#{이름}님, 오늘 나눈 이야기 중 마음에 남은 단어 하나는 무엇인가요?

따뜻한 밤 되세요. 🌙

- 지독해',
  '["이름"]'::jsonb,
  '모임 종료 30분 후',
  true
);
```

**Vercel Cron 설정 (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/afterglow",
      "schedule": "0,30 * * * *"
    }
  ]
}
```

**검증:**
- [ ] 모임 종료 30분 후 알림 발송
- [ ] 답장 요구하지 않는 가벼운 톤
- [ ] 중복 발송 방지 (notification_logs 기록)

---

### M7-012: 내 책장 플레이스홀더 개선

**문제:** 빈 입력창이 "뭔가 멋진 말을 써야 한다"는 부담감 유발  
**해결:** 가벼운 예시로 진입 장벽 낮추기

**대상 파일:** `src/app/mypage/bookshelf/AddBookForm.tsx`

**변경:**
```tsx
// 현재
placeholder="이 책에서 기억하고 싶은 한 문장 (선택)"

// 변경
placeholder="예: '결국 우리는 모두 이야기가 되어간다' (선택)"
```

**또는 랜덤 플레이스홀더:**
```tsx
const placeholders = [
  '"결국 우리는 모두 이야기가 되어간다"',
  '"읽는 동안 마음이 따뜻해졌어요"',
  '"3장의 그 문장이 계속 떠올라요"',
  '"친구에게 추천하고 싶은 책"',
]
const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)]

<input
  placeholder={`예: ${randomPlaceholder} (선택)`}
  ...
/>
```

**검증:**
- [ ] 플레이스홀더가 구체적인 예시로 변경됨
- [ ] "(선택)" 표시 유지
- [ ] 입력 시 플레이스홀더 사라짐

---

## 5. Phase 3: 바이럴 장치

**목표:** 월 SNS 공유 50건 달성

### M7-020: 한 문장 카드 이미지 생성

**문제:** 텍스트 기록만으로는 공유 욕구가 낮음  
**해결:** 인스타그램 스토리 감성의 이미지 카드 생성

**신규 파일:** `src/components/QuoteCardGenerator.tsx`

**기술 스택:** `html-to-image` 또는 `@vercel/og` (서버사이드)

**설치:**
```bash
npm install html-to-image
```

**구현:**
```tsx
'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Share2 } from 'lucide-react'

interface QuoteCardGeneratorProps {
  quote: string
  bookTitle: string
  author?: string
}

export default function QuoteCardGenerator({ quote, bookTitle, author }: QuoteCardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 2,
      })
      
      const link = document.createElement('a')
      link.download = `jidokhae-quote-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      {/* 카드 프리뷰 (작은 크기) */}
      <div className="aspect-[9/16] max-w-[200px] mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
        <div
          ref={cardRef}
          className="w-full h-full bg-gradient-to-b from-warm-100 to-warm-200 p-8 flex flex-col justify-center items-center text-center"
          style={{ fontFamily: 'Noto Serif KR, serif' }}
        >
          {/* 인용문 */}
          <p className="text-lg text-warm-800 leading-relaxed mb-6">
            "{quote}"
          </p>
          
          {/* 책 정보 */}
          <p className="text-sm text-warm-600">
            『{bookTitle}』{author && ` - ${author}`}
          </p>
          
          {/* 로고 */}
          <div className="absolute bottom-6 opacity-60">
            <p className="text-xs text-warm-500">지독해 Jidokhae</p>
          </div>
        </div>
      </div>
      
      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full py-2 bg-brand-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-brand-600 disabled:opacity-50"
      >
        <Download size={16} />
        {isGenerating ? '생성 중...' : '이미지로 저장'}
      </button>
    </div>
  )
}
```

**책장 페이지에 연동:**
```tsx
// bookshelf/page.tsx 내 각 책 카드에 버튼 추가
{book.one_line_note && (
  <QuoteCardGenerator
    quote={book.one_line_note}
    bookTitle={book.title}
    author={book.author}
  />
)}
```

**검증:**
- [ ] 한 문장 기록이 있는 책에만 "이미지로 저장" 버튼 표시
- [ ] 클릭 시 1080x1920 이미지 다운로드
- [ ] 이미지에 "지독해" 로고 포함
- [ ] 모바일에서 정상 동작

---

### M7-021: 랜딩페이지 Hero 섹션 강화 (선택)

**현재:** 텍스트 기반 랜딩페이지  
**개선:** Aceternity UI의 감성적 Hero 컴포넌트 적용

**참고:** ui.aceternity.com/components/hero-highlight

**우선순위:** 낮음 (Phase 3 완료 후 시간 여유 시 진행)

---

## 6. Phase 4: 인프라 & 마무리

### M7-030: 레터박스 UI (데스크톱)

**문제:** 데스크톱에서 화면이 넓게 퍼져 앱스러움 감소  
**해결:** 모바일 뷰 크기로 제한, 중앙 정렬

**대상 파일:** `src/app/layout.tsx`

**변경:**
```tsx
// 현재
<body className="font-sans min-h-screen flex flex-col">
  <Header user={user} />
  <main className="flex-1">
    {children}
  </main>
  <Footer />
</body>

// 변경
<body className="font-sans min-h-screen bg-warm-100">
  <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-xl flex flex-col">
    <Header user={user} />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
</body>
```

**검증:**
- [ ] 데스크톱에서 480px 너비로 중앙 정렬
- [ ] 양쪽에 따뜻한 회색 배경
- [ ] 모바일에서는 변화 없음 (전체 너비)
- [ ] Header/Footer가 컨테이너 안에 포함됨

---

## 7. 측정 지표 (KPI)

| 지표 | 현재 (추정) | M7 목표 | 측정 방법 |
|------|------------|---------|----------|
| 신규회원 결제 전환율 | 50% | 70% | 상세페이지 조회 → 결제 완료 |
| 노쇼율 | 15% | 10% | 참가확정 → 실제 참여 |
| 재참여율 | 60% | 75% | 첫 참여 → 2회차 신청 |
| SNS 공유 | 0건/월 | 50건/월 | 이미지 다운로드 수 |

---

## 8. 의존성

```
[M6 완료]
    ↓
[M7 Phase 1] ← 전환율 개선
    ↓
[M7 Phase 2] ← 리텐션 강화 (Phase 1과 병행 가능)
    ↓
[M7 Phase 3] ← 바이럴 장치
    ↓
[M7 Phase 4] ← 인프라
    ↓
[M7 완료] → 🎯 Growth 목표 달성
```

---

## 9. 체크리스트

### Phase 1 완료 조건
- [ ] M7-001: 환불 규정 더보기 구현
- [ ] M7-002: 첫 방문 뱃지 넛지 구현
- [ ] M7-003: 인라인 미리보기 구현 + 팝업 비활성화

### Phase 2 완료 조건
- [ ] M7-010: 참여자 티저 알림 구현
- [ ] M7-011: 여운 메시지 Cron 구현
- [ ] M7-012: 책장 플레이스홀더 개선

### Phase 3 완료 조건
- [ ] M7-020: 한 문장 카드 이미지 생성 구현

### Phase 4 완료 조건
- [ ] M7-030: 레터박스 UI 구현
- [ ] 전체 기능 통합 테스트
- [ ] 프로덕션 배포

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-22 | 1.0 | WP-M7 최초 작성 |
