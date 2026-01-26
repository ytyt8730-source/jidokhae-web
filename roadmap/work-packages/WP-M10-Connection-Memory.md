# Work Package: M10 - Connection & Memory (연결과 기억)

---

**문서 버전:** 1.0
**작성일:** 2026-01-26
**Milestone:** M10
**목표:** 회원 간 연결 강화, 모임의 기억을 자산화
**예상 기간:** 2~3주
**선행 조건:** M9 완료, M4 완료 (칭찬 시스템)
**핵심 가치:** 연결, 기억

---

## 1. Work Package 개요

M10은 **4개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: 봉인된 칭찬 시스템
    |  [동작 확인: 칭찬 도착 시 봉인 아이콘, 3초 딜레이 후 공개, 봉인 뜯기 애니메이션]
    v
Phase 2: 칭찬 전송 개선
    |  [동작 확인: 아이콘화된 칭찬 유형, 종이비행기 전송 애니메이션]
    v
Phase 3: 기록 카드 시스템
    |  [동작 확인: 완료 티켓 -> 기록 카드 변환, 3D Flip, 앞면/뒷면]
    v
Phase 4: 지난 모임 아카이브 + Social Proof
    |  [동작 확인: /meetings/archive, 필터, 사진 갤러리, 참가자 Facepile]
```

---

## 2. Phase 상세

### Phase 1: 봉인된 칭찬 시스템

**목표:** 칭찬 수신 시 기대감을 높이는 "봉인된 편지" 경험 제공

**예상 소요:** 3~4일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | 밀랍 봉인 아이콘 디자인 | `/components/icons/SealIcon.tsx` | SVG 아이콘 렌더링 |
| 1.2 | praises 테이블 확장 | SQL 마이그레이션 | `is_opened`, `opened_at` 필드 추가 |
| 1.3 | 봉인된 칭찬 알림 UI | 알림 리스트 컴포넌트 | "누군가의 따뜻한 마음이 도착했습니다" |
| 1.4 | 봉인 상태 API | `/app/api/praises/[id]/open/route.ts` | POST 요청 시 봉인 해제 |
| 1.5 | 3초 딜레이 로직 | 프론트엔드 | Promise.delay 구현 |
| 1.6 | 봉인 뜯기 애니메이션 | Framer Motion | 밀랍 봉인 깨지는 효과 |
| 1.7 | 편지 펼쳐지는 효과 | Framer Motion | 접힌 편지 펼쳐짐 |
| 1.8 | Sound 연동 (paper-tear) | useFeedback | 찌익 소리 재생 |
| 1.9 | Haptic 연동 | useFeedback | light 패턴 |

#### DB 스키마 변경

```sql
-- praises 테이블 확장
ALTER TABLE praises ADD COLUMN is_opened BOOLEAN DEFAULT false;
ALTER TABLE praises ADD COLUMN opened_at TIMESTAMP;
```

#### 봉인된 칭찬 UI Flow

```
1. 알림 리스트 (봉인 상태)
   ┌─────────────────────────────────────┐
   |  [밀랍 봉인 아이콘]                   |
   |  누군가의 따뜻한 마음이 도착했습니다    |
   |  [봉인 열기]                         |
   └─────────────────────────────────────┘

2. "봉인 열기" 클릭
   -> 3초 딜레이 (기대감 형성)
   -> 밀랍 봉인 깨지는 애니메이션
   -> Sound: paper-tear.mp3

3. 편지 펼쳐짐
   ┌─────────────────────────────────────┐
   |  [Heart 아이콘]                      |
   |  "따뜻한 분위기를 만들어주셨어요"      |
   |                                      |
   |  2026년 1월 20일 경주 정기모임에서     |
   └─────────────────────────────────────┘
```

#### 봉인 뜯기 애니메이션 구현

```typescript
// /lib/animations.ts 추가
export const sealBreakVariants = {
  sealed: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  breaking: {
    scale: [1, 1.2, 0.8, 1.1, 0],
    rotate: [0, -10, 10, -5, 0],
    opacity: [1, 1, 1, 0.8, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.2, 0.4, 0.6, 1],
    },
  },
};

export const letterUnfoldVariants = {
  folded: {
    scaleY: 0,
    opacity: 0,
    originY: 0,
  },
  unfolded: {
    scaleY: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      delay: 0.3,
    },
  },
};
```

#### Scenario (검증 기준)

**SC-M10-001: 봉인된 칭찬 수신 (Critical)**
- Given: 회원이 다른 회원으로부터 칭찬을 받음
- When: 알림 목록을 확인
- Then: 밀랍 봉인 아이콘과 함께 "누군가의 따뜻한 마음이 도착했습니다" 표시

**SC-M10-002: 봉인 열기 (Critical)**
- Given: 봉인된 칭찬이 존재
- When: "봉인 열기" 버튼 클릭
- Then: 3초 후 봉인 뜯기 애니메이션 재생, paper-tear 소리 재생

**SC-M10-003: 편지 내용 확인 (High)**
- Given: 봉인이 열린 상태
- When: 애니메이션 완료
- Then: 칭찬 문구와 모임 정보가 표시됨

**SC-M10-003a: 이미 열린 봉인 재시도 방지 (High)**
- Given: 이미 봉인이 열린 칭찬 (is_opened = true)
- When: "봉인 열기" 버튼 클릭 시도
- Then: 버튼 비활성화 또는 숨김, 바로 내용 표시

**SC-M10-003b: 다른 사용자 봉인 열기 시도 차단 (Critical)**
- Given: 사용자 A가 받은 봉인된 칭찬
- When: 사용자 B가 해당 칭찬의 봉인 열기 API 호출
- Then: 403 Forbidden 에러, "권한이 없습니다" 메시지

#### 사용자 가치

> "칭찬을 받는 순간이 작은 선물을 여는 것처럼 특별하게 느껴진다"

---

### Phase 2: 칭찬 전송 개선

**목표:** 칭찬 전송 경험을 더 감성적으로 개선

**예상 소요:** 2~3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | 칭찬 유형 아이콘화 | UI 컴포넌트 | 이모지 -> Lucide 아이콘 |
| 2.2 | 칭찬 유형 상수 업데이트 | `/lib/constants/praise.ts` | 아이콘 매핑 |
| 2.3 | 종이비행기 아이콘 | `/components/icons/PaperPlaneIcon.tsx` | SVG 아이콘 |
| 2.4 | 전송 애니메이션 | Framer Motion | 종이비행기 날아감 |
| 2.5 | Sound 연동 (whoosh) | useFeedback | 휙 소리 재생 |
| 2.6 | 완료 메시지 감성화 | Micro-copy | "따뜻한 마음이 전해졌어요" |
| 2.7 | 칭찬 선택 UI 개선 | UI/UX | 카드형 선택지 |

#### 칭찬 유형 아이콘 매핑

```typescript
// /lib/constants/praise.ts
import { Heart, Sparkles, Sun, Lightbulb, Users } from 'lucide-react';

export const PRAISE_TYPES = [
  {
    id: 'grateful',
    text: '덕분에 좋은 시간이었어요',
    icon: Heart,
    color: 'text-rose-500',
  },
  {
    id: 'impressive',
    text: '이야기가 인상 깊었어요',
    icon: Sparkles,
    color: 'text-amber-500',
  },
  {
    id: 'warm',
    text: '따뜻한 분위기를 만들어주셨어요',
    icon: Sun,
    color: 'text-orange-500',
  },
  {
    id: 'insight',
    text: '새로운 관점을 얻었어요',
    icon: Lightbulb,
    color: 'text-yellow-500',
  },
  {
    id: 'together',
    text: '다음에도 함께하고 싶어요',
    icon: Users,
    color: 'text-brand-500',
  },
] as const;
```

#### 종이비행기 전송 애니메이션

```typescript
// /lib/animations.ts 추가
export const paperPlaneVariants = {
  idle: {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
  },
  flying: {
    x: [0, 50, 200, 400],
    y: [0, -30, -80, -150],
    rotate: [0, 15, 25, 45],
    scale: [1, 1.1, 0.9, 0.5],
    opacity: [1, 1, 0.8, 0],
    transition: {
      duration: 1.2,
      times: [0, 0.3, 0.6, 1],
      ease: 'easeOut',
    },
  },
};
```

#### 칭찬 전송 UI (개선)

```
┌─────────────────────────────────────┐
|    어떤 마음을 전할까요?              |
├─────────────────────────────────────┤
|                                      |
|  ┌─────────────────────────────────┐ |
|  | [Heart]                          | |
|  | 덕분에 좋은 시간이었어요           | |
|  └─────────────────────────────────┘ |
|                                      |
|  ┌─────────────────────────────────┐ |
|  | [Sparkles]                       | |
|  | 이야기가 인상 깊었어요             | |
|  └─────────────────────────────────┘ |
|                                      |
|  ... (나머지 선택지)                  |
|                                      |
|         [마음 전하기] -> (비행기)     |
└─────────────────────────────────────┘
```

#### Scenario (검증 기준)

**SC-M10-004: 칭찬 유형 선택 (High)**
- Given: 칭찬하기 화면 진입
- When: 칭찬 유형 목록 표시
- Then: 각 유형에 Lucide 아이콘과 함께 표시 (이모지 없음)

**SC-M10-005: 칭찬 전송 애니메이션 (Critical)**
- Given: 칭찬 유형과 대상 선택 완료
- When: "마음 전하기" 버튼 클릭
- Then: 종이비행기 애니메이션 재생, whoosh 소리 재생

**SC-M10-006: 전송 완료 메시지 (High)**
- Given: 칭찬 전송 완료
- When: 애니메이션 종료
- Then: "따뜻한 마음이 전해졌어요" 메시지 표시

**SC-M10-006a: 본인에게 칭찬 전송 차단 (Critical)**
- Given: 칭찬하기 화면에서 대상 선택
- When: 본인을 칭찬 대상으로 선택 시도
- Then: 본인 제외된 목록 표시 또는 선택 불가 처리

**SC-M10-006b: 같은 모임 같은 사람 중복 칭찬 방지 (High)**
- Given: 모임 A에서 사용자 B에게 이미 칭찬 전송 완료
- When: 같은 모임 A에서 사용자 B에게 다시 칭찬 시도
- Then: "이미 칭찬을 전했습니다" 메시지, 전송 버튼 비활성화

#### 사용자 가치

> "칭찬을 보내는 과정 자체가 따뜻한 경험이 된다"

---

### Phase 3: 기록 카드 시스템

**목표:** 완료된 모임 티켓을 추억이 담긴 기록 카드로 변환

**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | registrations 테이블 확장 | SQL 마이그레이션 | `book_introduced`, `memory_note` 필드 |
| 3.2 | 기록 카드 컴포넌트 (앞면) | `/components/ui/RecordCard.tsx` | 모임 정보 표시 |
| 3.3 | 기록 카드 컴포넌트 (뒷면) | 동일 파일 | 소개한 책, 기억, 받은 칭찬 |
| 3.4 | 3D Flip 애니메이션 | Framer Motion + CSS | preserve-3d 적용 |
| 3.5 | 티켓 -> 기록 카드 변환 로직 | 비즈니스 로직 | 모임 종료 후 자동 변환 |
| 3.6 | 기록 입력 UI | 모달/폼 | 소개한 책, 남긴 기억 입력 |
| 3.7 | 기록 저장 API | `/app/api/registrations/[id]/memory/route.ts` | PATCH 요청 |
| 3.8 | 받은 칭찬 조회 | API | 해당 모임에서 받은 칭찬 |
| 3.9 | 기록 카드 보관함 UI | 마이페이지 섹션 | 완료된 기록 카드 목록 |

#### DB 스키마 변경

```sql
-- registrations 테이블 확장
ALTER TABLE registrations ADD COLUMN book_introduced TEXT;
ALTER TABLE registrations ADD COLUMN memory_note TEXT;
```

#### 기록 카드 디자인

```
[앞면 - 모임 정보]
┌─────────────────────────────────────┐
|  RECORD CARD                        |
|  ─────────────────────────────────  |
|                                      |
|  경주 정기모임                        |
|  2026년 1월 20일 (토)                |
|  지독해 아지트                        |
|                                      |
|  Seat No. 07                         |
|  나의 12번째 지독해                   |
|                                      |
|  [탭하여 뒤집기]                      |
└─────────────────────────────────────┘

[뒷면 - 기억]
┌─────────────────────────────────────┐
|  MEMORIES                           |
|  ─────────────────────────────────  |
|                                      |
|  소개한 책                           |
|  "아몬드" - 손원평                    |
|                                      |
|  남긴 기억                           |
|  "오늘 나눈 이야기가 오래 남을 것 같다"|
|                                      |
|  받은 칭찬 [Heart] x 2               |
|                                      |
|  [탭하여 뒤집기]                      |
└─────────────────────────────────────┘
```

#### 3D Flip 애니메이션

```typescript
// /components/ui/RecordCard.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface RecordCardProps {
  registration: Registration;
  praisesReceived: Praise[];
}

export function RecordCard({ registration, praisesReceived }: RecordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-full h-[400px] perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden bg-warm-50 rounded-2xl p-6 border border-warm-200"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardFront registration={registration} />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden bg-brand-50 rounded-2xl p-6 border border-brand-200"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardBack
            registration={registration}
            praisesReceived={praisesReceived}
          />
        </div>
      </motion.div>
    </div>
  );
}
```

#### CSS for 3D Flip

```css
/* globals.css 추가 */
.perspective-1000 {
  perspective: 1000px;
}

.backface-hidden {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
```

#### Scenario (검증 기준)

**SC-M10-007: 기록 카드 변환 (Critical)**
- Given: 모임 참여 완료 상태 (participation_status = 'completed')
- When: 티켓 보관함 조회
- Then: 해당 티켓이 기록 카드 형태로 표시됨

**SC-M10-008: 3D Flip 애니메이션 (Critical)**
- Given: 기록 카드가 화면에 표시됨
- When: 카드 탭/클릭
- Then: 3D 뒤집기 애니메이션으로 앞면/뒷면 전환

**SC-M10-009: 기록 입력 (High)**
- Given: 모임 참여 완료 후
- When: "기억 남기기" 버튼 클릭
- Then: 소개한 책, 남긴 기억 입력 폼 표시

**SC-M10-010: 받은 칭찬 표시 (High)**
- Given: 해당 모임에서 칭찬을 받음
- When: 기록 카드 뒷면 확인
- Then: 받은 칭찬 아이콘과 개수 표시

**SC-M10-010a: 기록 내용 200자 초과 시 처리 (High)**
- Given: 기록 카드 입력 폼
- When: "남긴 기억" 필드에 200자 초과 입력 시도
- Then: 200자에서 입력 제한, "200/200" 글자 수 표시

**SC-M10-010b: 기록 저장 시 200자 초과 서버 검증 (High)**
- Given: 기록 저장 API 호출
- When: memory_note 필드가 200자 초과
- Then: 400 Bad Request, "기억은 200자 이내로 작성해주세요" 에러

#### 사용자 가치

> "모임의 기억이 소중한 카드로 보관되어, 언제든 추억을 꺼내볼 수 있다"

---

### Phase 4: 지난 모임 아카이브 + Social Proof

**목표:** 과거 모임을 탐색하고, 모임 상세에서 참가자 정보를 확인

**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | meeting_photos 테이블 생성 | SQL 마이그레이션 | 테이블 생성 + RLS |
| 4.2 | 지난 모임 아카이브 페이지 | `/app/meetings/archive/page.tsx` | SSR 페이지 |
| 4.3 | 연도/지역/유형 필터 | UI 컴포넌트 | 필터 동작 |
| 4.4 | 아카이브 목록 API | `/app/api/meetings/archive/route.ts` | GET (필터링) |
| 4.5 | 아카이브 상세 페이지 | `/app/meetings/archive/[id]/page.tsx` | 참가자, 책, 후기 |
| 4.6 | 사진 갤러리 컴포넌트 | `/components/meetings/PhotoGallery.tsx` | 이미지 그리드 |
| 4.7 | 사진 업로드 (운영자) | 운영자 화면 | 이미지 업로드 |
| 4.8 | 참가자 Facepile 컴포넌트 | `/components/ui/Facepile.tsx` | 아바타 겹침 |
| 4.9 | 모임 상세 Social Proof | 모임 상세 페이지 | "O명이 함께하고 있어요" |
| 4.10 | Facepile 표시 규칙 | 로직 | 확정자만, 칭찬 기반 순서 |

#### DB 스키마 변경

```sql
-- 모임 사진 테이블
CREATE TABLE meeting_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE meeting_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_photos_select" ON meeting_photos
  FOR SELECT USING (true);

CREATE POLICY "meeting_photos_insert_admin" ON meeting_photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "meeting_photos_delete_admin" ON meeting_photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );
```

#### 지난 모임 아카이브 UI

```
┌─────────────────────────────────────┐
|  지난 모임 아카이브                   |
├─────────────────────────────────────┤
|                                      |
|  [2026] [2025] [전체]   <- 연도 필터  |
|  [경주] [포항] [전체]   <- 지역 필터  |
|  [정기] [토론] [전체]   <- 유형 필터  |
|                                      |
├─────────────────────────────────────┤
|                                      |
|  ┌─────────────────────────────────┐ |
|  | [사진 썸네일]                    | |
|  | 경주 정기모임 #47                | |
|  | 2026년 1월 20일                  | |
|  | [Facepile] 8명이 함께했어요      | |
|  └─────────────────────────────────┘ |
|                                      |
|  ┌─────────────────────────────────┐ |
|  | [사진 썸네일]                    | |
|  | 포항 토론모임 #12                | |
|  | 2026년 1월 15일                  | |
|  | [Facepile] 5명이 함께했어요      | |
|  └─────────────────────────────────┘ |
|                                      |
└─────────────────────────────────────┘
```

#### Facepile 컴포넌트

```typescript
// /components/ui/Facepile.tsx
'use client';

import { cn } from '@/lib/utils';

interface FacepileProps {
  users: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Facepile({ users, max = 5, size = 'md' }: FacepileProps) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className="flex items-center">
      <div className="flex">
        {displayed.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              'rounded-full border-2 border-white bg-warm-200 flex items-center justify-center',
              sizeClasses[size],
              index > 0 && overlapClasses[size]
            )}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-medium text-warm-600">
                {user.name.charAt(0)}
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className={cn(
              'rounded-full border-2 border-white bg-brand-100 flex items-center justify-center',
              sizeClasses[size],
              overlapClasses[size]
            )}
          >
            <span className="font-medium text-brand-700">+{remaining}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 모임 상세 Social Proof

```
┌─────────────────────────────────────┐
|  경주 정기모임                        |
|  2026년 1월 25일 (토) 14:00          |
|  지독해 아지트                        |
├─────────────────────────────────────┤
|                                      |
|  [Facepile: Avatar Avatar Avatar +5] |
|  8명이 함께하고 있어요                |
|                                      |
|  [함께 읽기]                          |
└─────────────────────────────────────┘
```

#### Facepile 표시 규칙

```typescript
async function getParticipantsForFacepile(meetingId: string) {
  // 확정된 참가자만
  const participants = await getConfirmedParticipants(meetingId);

  // 칭찬 많이 받은 순 정렬
  const sorted = participants.sort(
    (a, b) => b.total_praises_received - a.total_praises_received
  );

  return sorted;
}
```

#### Scenario (검증 기준)

**SC-M10-011: 아카이브 페이지 접근 (Critical)**
- Given: 로그인한 사용자
- When: /meetings/archive 페이지 접근
- Then: 종료된 모임 목록이 표시됨

**SC-M10-012: 아카이브 필터링 (High)**
- Given: 아카이브 페이지
- When: 연도/지역/유형 필터 선택
- Then: 해당 조건에 맞는 모임만 표시

**SC-M10-013: 아카이브 상세 (High)**
- Given: 아카이브 목록
- When: 특정 모임 클릭
- Then: 참가자, 이야기된 책, 후기, 사진이 표시됨

**SC-M10-014: 사진 갤러리 (Medium)**
- Given: 사진이 업로드된 모임
- When: 아카이브 상세 페이지 확인
- Then: 사진 그리드가 표시됨

**SC-M10-015: 모임 상세 Facepile (Critical)**
- Given: 참가자가 있는 예정된 모임
- When: 모임 상세 페이지 접근
- Then: 참가자 Facepile + "O명이 함께하고 있어요" 표시

**SC-M10-016: Facepile 순서 (High)**
- Given: 참가자 Facepile
- When: 표시 순서 확인
- Then: 칭찬 많이 받은 순으로 정렬

#### 사용자 가치

> "지난 모임의 추억을 탐색하고, 함께할 사람들을 미리 확인할 수 있다"

---

## 3. 기술 검토 사항

| 항목 | 내용 | 참고 |
|------|------|------|
| 3D CSS Transform | preserve-3d, backface-visibility | 모바일 Safari 호환성 주의 |
| 이미지 업로드 | Supabase Storage 사용 | 운영자 권한만 업로드 가능 |
| RLS 정책 | meeting_photos SELECT 모두, INSERT/DELETE 운영자만 | - |
| 필터 쿼리 | 인덱스 최적화 필요 | meeting_date, location, type |

---

## 4. 파일 구조

```
/components
├── icons/
│   ├── SealIcon.tsx          # 밀랍 봉인 아이콘
│   └── PaperPlaneIcon.tsx    # 종이비행기 아이콘
├── ui/
│   ├── RecordCard.tsx        # 기록 카드 (3D Flip)
│   └── Facepile.tsx          # 참가자 얼굴 겹침
├── meetings/
│   └── PhotoGallery.tsx      # 사진 갤러리
└── praises/
    ├── SealedPraise.tsx      # 봉인된 칭찬
    └── PraiseSendAnimation.tsx # 칭찬 전송 애니메이션

/app
├── meetings/
│   └── archive/
│       ├── page.tsx          # 아카이브 목록
│       └── [id]/
│           └── page.tsx      # 아카이브 상세
└── api/
    ├── praises/
    │   └── [id]/
    │       └── open/
    │           └── route.ts  # 봉인 열기 API
    ├── registrations/
    │   └── [id]/
    │       └── memory/
    │           └── route.ts  # 기억 저장 API
    └── meetings/
        └── archive/
            └── route.ts      # 아카이브 목록 API

/lib
├── animations.ts             # 애니메이션 variants 추가
└── constants/
    └── praise.ts             # 칭찬 유형 상수
```

---

## 5. 전체 완료 검증

### M10 완료 체크리스트

- [ ] 칭찬 도착 시 봉인 아이콘 표시
- [ ] "봉인 열기" 클릭 시 3초 후 내용 공개
- [ ] 봉인 뜯기 애니메이션 + 소리 재생
- [ ] 칭찬 전송 시 종이비행기 애니메이션 재생
- [ ] 완료된 모임 티켓이 기록 카드로 변환됨
- [ ] 기록 카드 뒤집기 시 3D 효과 적용
- [ ] 지난 모임 아카이브에서 과거 모임 탐색 가능
- [ ] 모임 상세에서 참가자 Facepile 표시

### 비즈니스 규칙 검증

- [ ] 봉인 열기는 수신자만 가능
- [ ] 기록 입력은 본인 참여건만 가능
- [ ] 사진 업로드는 운영자만 가능
- [ ] Facepile은 확정자만 표시

---

## 6. 의존성

```
[M9 완료] + [M4 완료]
    |
    v
[Phase 1] 봉인된 칭찬 시스템
    |
    v
[Phase 2] 칭찬 전송 개선 (Phase 1과 일부 병행 가능)
    |
    v
[Phase 3] 기록 카드 시스템
    |
    v
[Phase 4] 지난 모임 아카이브 + Social Proof
    |
    v
[M10 완료] -> M11 시작 가능
```

---

## 7. 다음 단계 (M11 준비)

M10 완료 후 M11 시작 전 확인:

- [ ] 공유 책장 데이터 모델 설계
- [ ] book_interactions 테이블 설계
- [ ] activity_feed 테이블 설계
- [ ] 멤버 프로필 확장 필드 결정

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-26 | 1.0 | WP-M10 최초 작성 |
