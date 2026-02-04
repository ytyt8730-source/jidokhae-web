# Work Package: M6-Onboarding - 5단계 온보딩 플로우

---

**Milestone:** M6-Onboarding
**목표:** 신규 회원 재참여율 50% -> 70% 달성
**기간:** 2~3주
**선행 조건:** M9 완료 (현재 Beta-ready 상태)
**핵심 가치:** 신규 회원 전환, 첫 Aha Moment 경험
**테스트:** A/B 테스트 (온보딩 유무 비교)

---

## 1. Work Package 개요

M6-Onboarding은 **5개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: DB 스키마 & 기반 인프라
    | [동작 확인: 온보딩 필드 추가, API 엔드포인트 생성]
Phase 2: 온보딩 1~3단계 (문제 인식 -> 신뢰 확보 -> 행동 안내)
    | [동작 확인: 신규 회원 가입 시 온보딩 플로우 표시]
Phase 3: 후킹 랜딩페이지 개선
    | [동작 확인: /about 페이지 SEO 최적화 및 브랜드 스토리]
Phase 4: 가입 후 리마인드 시퀀스
    | [동작 확인: 3일/7일/14일 알림 자동 발송]
Phase 5: 첫 모임 후 리마인드 시퀀스 & Aha Moment 연계
    | [동작 확인: 칭찬 유도 및 재참여 알림]
```

---

## 2. Phase 상세

### Phase 1: DB 스키마 & 기반 인프라

**목표:** 온보딩 추적을 위한 DB 필드 및 API 엔드포인트 구축

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | users 테이블 확장 | SQL Migration | 필드 추가 완료 |
| 1.2 | 온보딩 상태 조회 API | `/api/users/onboarding/route.ts` | GET 동작 |
| 1.3 | 온보딩 상태 업데이트 API | `/api/users/onboarding/route.ts` | PATCH 동작 |
| 1.4 | 문제 선택 저장 API | `/api/users/onboarding/problems/route.ts` | POST 동작 |
| 1.5 | Aha Moment 기록 API | `/api/users/aha/route.ts` | POST 동작 |
| 1.6 | 온보딩 상태 타입 정의 | `/types/onboarding.ts` | 타입 정의 |

#### DB 스키마 변경

```sql
-- users 테이블 확장
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN problem_selections JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN first_aha_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN second_aha_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN signup_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN signup_reminder_count INTEGER DEFAULT 0;

-- 온보딩 진행 상태 인덱스
CREATE INDEX idx_users_onboarding ON users(onboarding_step, is_new_member);

-- 가입 후 리마인드 대상 조회용 인덱스
CREATE INDEX idx_users_signup_reminder ON users(created_at, signup_reminder_count)
  WHERE is_new_member = true;
```

#### 타입 정의

```typescript
// /types/onboarding.ts
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export interface OnboardingState {
  step: OnboardingStep;
  completedAt: string | null;
  problemSelections: string[];
  firstAhaAt: string | null;
  secondAhaAt: string | null;
}

export interface ProblemOption {
  id: string;
  label: string;
  icon: string; // Lucide icon name
}

export const PROBLEM_OPTIONS: ProblemOption[] = [
  { id: 'unread_books', label: '책 사놓고 안 읽은 지 꽤 됐다', icon: 'BookX' },
  { id: 'routine_life', label: '회사-집 반복, 새로운 사람 만날 일이 없다', icon: 'Repeat' },
  { id: 'no_deep_talk', label: '진지한 대화 나눌 곳이 없다', icon: 'MessageCircleOff' },
  { id: 'want_belonging', label: '어딘가에 속해 있고 싶다', icon: 'Users' },
];
```

#### API 명세

```typescript
// GET /api/users/onboarding
// Response: OnboardingState

// PATCH /api/users/onboarding
// Body: { step: OnboardingStep }
// Response: { success: true, step: OnboardingStep }

// POST /api/users/onboarding/problems
// Body: { selections: string[] }
// Response: { success: true }

// POST /api/users/aha
// Body: { type: 'first' | 'second' }
// Response: { success: true, timestamp: string }
```

#### 완료 검증

- [ ] `onboarding_step` 필드가 users 테이블에 추가됨
- [ ] 온보딩 상태 조회 API가 현재 step 반환
- [ ] 온보딩 상태 업데이트 API가 step 변경
- [ ] 문제 선택 저장 API가 JSONB 배열로 저장
- [ ] Aha Moment 기록 시 타임스탬프 저장

#### 사용자 가치

> "온보딩 진행 상태가 서버에 저장되어 세션이 끊겨도 이어서 진행 가능"

---

### Phase 2: 온보딩 1~3단계 UI

**목표:** 신규 회원 가입 시 온보딩 플로우 UI 구현

**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | 온보딩 컨테이너 컴포넌트 | `OnboardingContainer.tsx` | 단계별 라우팅 |
| 2.2 | 1단계: 문제 인식 화면 | `ProblemRecognition.tsx` | 4개 선택지 |
| 2.3 | 공감 메시지 컴포넌트 | `EmpathyMessage.tsx` | 선택 후 표시 |
| 2.4 | 2단계: 신뢰 확보 화면 | `TrustBuilding.tsx` | 창업자 스토리 |
| 2.5 | 숫자 카드 애니메이션 | `NumberCards.tsx` | Stagger 효과 |
| 2.6 | 회원 후기 슬라이더 | `ReviewSlider.tsx` | 공개 후기 3개 |
| 2.7 | 3단계: 행동 안내 화면 | `ActionGuide.tsx` | 3단계 플로우 |
| 2.8 | 프로그레스 바 컴포넌트 | `OnboardingProgress.tsx` | 단계별 진행률 |
| 2.9 | Skip 버튼 | UI | 온보딩 건너뛰기 |
| 2.10 | 온보딩 완료 처리 | 로직 | step 5 또는 skip |
| 2.11 | 신규 회원 라우팅 훅 | `useOnboardingRedirect.ts` | 자동 리다이렉트 |

#### 1단계: 문제 인식 화면

```
+-----------------------------------------------+
|                                               |
|     요즘 이런 생각, 해본 적 있으세요?          |
|                                               |
|  +------------------------------------------+ |
|  |  [BookX]                                 | |
|  |  책 사놓고 안 읽은 지 꽤 됐다            | |
|  +------------------------------------------+ |
|                                               |
|  +------------------------------------------+ |
|  |  [Repeat]                                | |
|  |  회사-집 반복, 새로운 사람 만날 일이 없다 | |
|  +------------------------------------------+ |
|                                               |
|  +------------------------------------------+ |
|  |  [MessageCircleOff]                      | |
|  |  진지한 대화 나눌 곳이 없다               | |
|  +------------------------------------------+ |
|                                               |
|  +------------------------------------------+ |
|  |  [Users]                                 | |
|  |  어딘가에 속해 있고 싶다                  | |
|  +------------------------------------------+ |
|                                               |
|     [다음으로]  (1개 이상 선택 시 활성화)      |
|                                               |
|     건너뛰기                                  |
|                                               |
+-----------------------------------------------+
```

#### 공감 메시지

```typescript
const EMPATHY_MESSAGES: Record<string, string> = {
  unread_books: '읽고 싶은 책은 쌓여가는데, 혼자는 시작이 어렵죠.',
  routine_life: '매일 같은 일상, 새로운 인연이 그리워질 때가 있어요.',
  no_deep_talk: '가벼운 대화만 오가는 일상이 공허하게 느껴질 때가 있죠.',
  want_belonging: '어딘가에 속해 있다는 느낌, 누구나 필요로 해요.',
};
```

#### 2단계: 신뢰 확보 화면

```
+-----------------------------------------------+
|                                               |
|     저도 같았어요.                            |
|                                               |
|     혼자 읽으니 지루했거든요.                  |
|     그래서 4명이 모여 시작했습니다.            |
|                                               |
|     +--------+  +--------+  +--------+       |
|     |   4    |  |   3    |  |  250   |       |
|     |  명이  |  |  년이  |  |  명이  |       |
|     | 시작   |  | 지나   |  | 함께   |       |
|     +--------+  +--------+  +--------+       |
|     (Staggered Animation)                     |
|                                               |
|  +------------------------------------------+ |
|  |  "처음엔 낯설었지만, 이제는 매주가        | |
|  |   기다려져요."                            | |
|  |                  - 익명 (2024년 합류)      | |
|  +------------------------------------------+ |
|     < o o o >  (후기 슬라이더)                 |
|                                               |
|     [다음으로]                                |
|                                               |
+-----------------------------------------------+
```

#### 숫자 카드 애니메이션

```typescript
// NumberCards.tsx
const cards = [
  { number: '4', unit: '명이', suffix: '시작' },
  { number: '3', unit: '년이', suffix: '지나' },
  { number: '250', unit: '명이', suffix: '함께' },
];

// Framer Motion Stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
```

#### 3단계: 행동 안내 화면

```
+-----------------------------------------------+
|                                               |
|     세 번이면 충분해요.                        |
|                                               |
|     +---+     +---+     +---+                 |
|     | 1 | --> | 2 | --> | 3 |                 |
|     +---+     +---+     +---+                 |
|     모임      신청      참여                   |
|     고르기    하기      하기                   |
|                                               |
|     [============50%============>       ]     |
|     첫 신청까지 50% 완료!                      |
|                                               |
|  +------------------------------------------+ |
|  |  취소해도 괜찮아요.                       | |
|  |  3일 전까지 100% 환불,                    | |
|  |  셀프로 처리됩니다.                       | |
|  +------------------------------------------+ |
|                                               |
|     [모임 둘러보기]                           |
|                                               |
+-----------------------------------------------+
```

#### 프로그레스 바 (신규 회원용)

```typescript
// OnboardingProgress.tsx
// 홈 화면 상단에 표시 (신규 회원 + 첫 신청 전)
interface ProgressState {
  step: 'signed_up' | 'browsed' | 'registered' | 'completed';
  percentage: number;
  message: string;
}

const PROGRESS_STATES: ProgressState[] = [
  { step: 'signed_up', percentage: 25, message: '가입 완료! 모임을 둘러볼까요?' },
  { step: 'browsed', percentage: 50, message: '관심 있는 모임을 찾았나요?' },
  { step: 'registered', percentage: 75, message: '신청 완료! 첫 모임이 기다려요.' },
  { step: 'completed', percentage: 100, message: '첫 모임 참여 완료!' },
];
```

#### 신규 회원 라우팅 훅

```typescript
// useOnboardingRedirect.ts
export function useOnboardingRedirect() {
  const { user, isNewMember } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isNewMember && user?.onboarding_step < 4) {
      // 온보딩 미완료 시 온보딩 페이지로
      router.push(`/onboarding?step=${user.onboarding_step}`);
    }
  }, [isNewMember, user?.onboarding_step]);
}
```

#### 완료 검증

- [ ] 신규 가입 시 1단계 문제 인식 화면 표시
- [ ] 문제 1개 이상 선택 시 "다음으로" 버튼 활성화
- [ ] 선택 후 공감 메시지 표시 (애니메이션)
- [ ] 2단계 숫자 카드 Stagger 애니메이션 재생
- [ ] 회원 후기 슬라이더 동작 (공개 동의 후기만)
- [ ] 3단계 프로그레스 바 표시
- [ ] "건너뛰기" 클릭 시 온보딩 완료 처리
- [ ] 온보딩 완료 후 홈으로 리다이렉트

#### 사용자 가치

> "신규 회원이 지독해의 분위기와 가치를 이해하고, 첫 신청에 대한 부담을 줄인다"

---

### Phase 3: 후킹 랜딩페이지 개선

**목표:** /about 페이지를 SEO 최적화된 브랜드 스토리 페이지로 개선

**예상 소요:** 2~3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | 랜딩페이지 재설계 | `/app/about/page.tsx` | SSR 적용 |
| 3.2 | 브랜드 스토리 섹션 | `BrandStory.tsx` | 창업자 스토리 |
| 3.3 | 분위기 갤러리 | `AtmosphereGallery.tsx` | 모임 사진 |
| 3.4 | 회원 후기 섹션 | `PublicReviews.tsx` | 공개 후기 조회 |
| 3.5 | CTA 섹션 | `LandingCTA.tsx` | 가입/일정 유도 |
| 3.6 | SEO 메타데이터 | metadata export | OG 태그 |
| 3.7 | 스크롤 애니메이션 | Framer Motion | 섹션별 reveal |
| 3.8 | 모바일 최적화 | 반응형 | 360px 기준 |

#### 랜딩페이지 구조

```
+-----------------------------------------------+
|                                               |
|         낮과 밤의 서재                         |
|         지독해                                 |
|                                               |
|  책을 사랑하는 사람들이 모이는 곳               |
|                                               |
|  [일정 보러가기]  [지금 시작하기]               |
|                                               |
+-----------------------------------------------+
|                                               |
|  Section 1: 우리의 이야기                      |
|  (창업자 스토리 - 온보딩 2단계와 동일 콘텐츠)   |
|                                               |
+-----------------------------------------------+
|                                               |
|  Section 2: 이런 분위기예요                    |
|  (모임 사진 갤러리 - gallery_images 활용)      |
|                                               |
+-----------------------------------------------+
|                                               |
|  Section 3: 회원분들의 이야기                  |
|  (공개 동의 후기 - is_public = true)           |
|                                               |
+-----------------------------------------------+
|                                               |
|  Section 4: 함께해요                          |
|  (CTA - 정기모임 신청하기)                     |
|                                               |
+-----------------------------------------------+
```

#### SEO 메타데이터

```typescript
// /app/about/page.tsx
export const metadata: Metadata = {
  title: '지독해 - 낮과 밤의 서재 | 경주/포항 독서 모임',
  description: '책을 사랑하는 사람들이 모이는 곳. 경주, 포항에서 매주 열리는 독서 모임. 250명의 회원이 함께하고 있습니다.',
  keywords: ['독서모임', '경주 독서모임', '포항 독서모임', '책모임', '지독해'],
  openGraph: {
    title: '지독해 - 낮과 밤의 서재',
    description: '책을 사랑하는 사람들이 모이는 곳',
    images: ['/og-about.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '지독해 - 낮과 밤의 서재',
    description: '책을 사랑하는 사람들이 모이는 곳',
  },
};
```

#### 스크롤 애니메이션

```typescript
// 섹션별 reveal 효과
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Intersection Observer 활용
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
  variants={sectionVariants}
>
  ...
</motion.section>
```

#### 완료 검증

- [ ] /about 페이지 SSR 동작
- [ ] SEO 메타데이터 설정 (OG 태그)
- [ ] 브랜드 스토리 섹션 표시
- [ ] 분위기 갤러리 이미지 로드
- [ ] 공개 동의 후기만 표시
- [ ] CTA 버튼 클릭 시 적절한 페이지로 이동
- [ ] 모바일에서 UI 정상

#### 사용자 가치

> "검색 유입 사용자가 지독해의 브랜드와 분위기를 한눈에 파악하고 가입을 결심한다"

---

### Phase 4: 가입 후 리마인드 시퀀스

**목표:** 가입 후 3일/7일/14일 자동 리마인드 알림 시스템 구축

**예상 소요:** 3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | 가입 환영 알림 발송 | 회원가입 트리거 | 즉시 발송 |
| 4.2 | 리마인드 대상 조회 로직 | `/lib/onboarding/reminder.ts` | 3일/7일 필터 |
| 4.3 | 리마인드 Cron Job | `/api/cron/onboarding-signup/route.ts` | 매일 10:00 |
| 4.4 | 알림 템플릿: 가입 환영 | notification_templates | template_id 연동 |
| 4.5 | 알림 템플릿: 3일 후 | notification_templates | 구체적 기회 |
| 4.6 | 알림 템플릿: 7일 후 | notification_templates | 콘텐츠 맛보기 |
| 4.7 | 14일 알림 중단 로직 | 조건 체크 | reminder_count >= 2 |
| 4.8 | 다음 달 일정 공개 재시도 | 별도 Cron | 월초 발송 |

#### 리마인드 대상 조회 로직

```typescript
// /lib/onboarding/reminder.ts
interface SignupReminderTarget {
  userId: string;
  name: string;
  phone: string;
  daysSinceSignup: number;
  reminderType: 'day3' | 'day7';
}

export async function getSignupReminderTargets(): Promise<SignupReminderTarget[]> {
  const supabase = createServiceClient();
  const now = new Date();

  // 가입 후 3일 or 7일 된 신규 회원 중 미신청자
  const { data: targets } = await supabase
    .from('users')
    .select(`
      id,
      name,
      phone,
      created_at,
      signup_reminder_count
    `)
    .eq('is_new_member', true)
    .lt('signup_reminder_count', 2) // 14일 규칙: 2회 발송 후 중단
    .not('id', 'in', (
      // 신청 이력이 있는 회원 제외
      supabase.from('registrations').select('user_id').not('status', 'eq', 'cancelled')
    ));

  return targets?.filter(user => {
    const daysSinceSignup = differenceInDays(now, new Date(user.created_at));
    return daysSinceSignup === 3 || daysSinceSignup === 7;
  }).map(user => ({
    userId: user.id,
    name: user.name,
    phone: user.phone,
    daysSinceSignup: differenceInDays(now, new Date(user.created_at)),
    reminderType: differenceInDays(now, new Date(user.created_at)) === 3 ? 'day3' : 'day7',
  })) || [];
}
```

#### Cron Job

```typescript
// /api/cron/onboarding-signup/route.ts
export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const targets = await getSignupReminderTargets();

  for (const target of targets) {
    // 동적 데이터 조회
    const popularMeeting = await getMostPopularMeeting();
    const availableSeats = await getAvailableSeats(target.reminderType === 'day3');

    // 템플릿 변수 치환
    const templateData = {
      회원명: target.name,
      책제목: popularMeeting?.book_title || '다양한 책',
      요일: popularMeeting?.day_of_week || '이번 주',
      지역: popularMeeting?.location || '경주/포항',
      남은자리: availableSeats || '3',
    };

    // 알림 발송
    await sendAlimtalk({
      to: target.phone,
      templateId: target.reminderType === 'day3'
        ? 'signup_reminder_day3'
        : 'signup_reminder_day7',
      variables: templateData,
    });

    // 발송 횟수 업데이트
    await supabase
      .from('users')
      .update({
        signup_reminder_count: target.signup_reminder_count + 1,
        signup_reminder_sent_at: new Date().toISOString(),
      })
      .eq('id', target.userId);
  }

  return successResponse({ sent: targets.length });
}
```

#### 알림 템플릿 (Balfour 원칙 적용)

**가입 환영 (즉시):**
```
[지독해] 환영합니다, #{회원명}님!

낮과 밤의 서재에 오신 것을 환영합니다.

이번 달 가장 인기 있는 모임은 #{책제목}이에요.
벌써 5명이 신청했답니다.

[모임 둘러보기]
```

**3일 후 (미신청):**
```
[지독해] #{회원명}님, 자리가 3개 남았어요.

#{요일}, #{지역} 모임에 자리가 #{남은자리}개 남았어요.
이번 주 마지막 기회일지도 몰라요.

[바로 확인하기]
```

**7일 후 (미신청):**
```
[지독해] 지난주 모임에서 나눈 이야기

#{회원명}님,

지난주 모임에서 회원들이 #{책제목}에 대해
이런 이야기를 나눴어요.

"생각보다 쉽게 읽혔어요"
"새로운 관점을 얻었어요"

다음 모임에서 함께 나눠볼까요?

[다음 모임 확인하기]
```

#### vercel.json Cron 설정

```json
{
  "crons": [
    {
      "path": "/api/cron/onboarding-signup",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### 완료 검증

- [ ] 회원가입 시 환영 알림 즉시 발송
- [ ] 가입 후 3일 미신청 시 리마인드 알림 발송
- [ ] 가입 후 7일 미신청 시 리마인드 알림 발송
- [ ] 14일(2회 발송) 후 알림 중단
- [ ] signup_reminder_count 정상 증가
- [ ] 이미 신청한 회원은 리마인드 대상에서 제외

#### 사용자 가치

> "가입만 하고 이탈한 회원에게 적절한 타이밍에 구체적인 기회를 제시하여 첫 신청 유도"

---

### Phase 5: 첫 모임 후 리마인드 시퀀스 & Aha Moment 연계

**목표:** 첫 모임 후 칭찬 유도 및 재참여 알림으로 70% 재참여율 달성

**예상 소요:** 3~4일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 5.1 | 첫 모임 후 리마인드 대상 조회 | `/lib/onboarding/first-meeting.ts` | 3일/7일 필터 |
| 5.2 | 첫 모임 후 Cron Job | `/api/cron/onboarding-first-meeting/route.ts` | 매일 10:00 |
| 5.3 | 알림 템플릿: 3일 후 | notification_templates | 사회적 증거 |
| 5.4 | 알림 템플릿: 7일 후 | notification_templates | 희소성 |
| 5.5 | 14일 알림 중단 로직 | 조건 체크 | 중복 방지 |
| 5.6 | Aha Moment 기록 연동 | 칭찬 보내기/받기 시 | first_aha_at, second_aha_at |
| 5.7 | 칭찬 시스템 onboarding_step 연계 | M4 연동 | step 4 완료 처리 |
| 5.8 | 온보딩 완료 배지 부여 | badges 연동 | "첫 모임 참여" 배지 |

#### 첫 모임 후 리마인드 로직

```typescript
// /lib/onboarding/first-meeting.ts
interface FirstMeetingReminderTarget {
  userId: string;
  name: string;
  phone: string;
  daysSinceFirstMeeting: number;
  reminderType: 'day3' | 'day7';
}

export async function getFirstMeetingReminderTargets(): Promise<FirstMeetingReminderTarget[]> {
  const supabase = createServiceClient();
  const now = new Date();

  // 첫 정기모임 참여 완료 후 3일 or 7일 된 회원 중 미신청자
  const { data: targets } = await supabase
    .from('users')
    .select(`
      id,
      name,
      phone,
      first_regular_meeting_at
    `)
    .eq('is_new_member', false) // 이미 기존 회원 전환됨
    .not('first_regular_meeting_at', 'is', null)
    .not('id', 'in', (
      // 두 번째 신청 이력이 있는 회원 제외
      supabase
        .from('registrations')
        .select('user_id')
        .gte('created_at', 'users.first_regular_meeting_at')
    ));

  return targets?.filter(user => {
    const daysSinceFirst = differenceInDays(now, new Date(user.first_regular_meeting_at));
    return daysSinceFirst === 3 || daysSinceFirst === 7;
  }).map(user => ({
    userId: user.id,
    name: user.name,
    phone: user.phone,
    daysSinceFirstMeeting: differenceInDays(now, new Date(user.first_regular_meeting_at)),
    reminderType: differenceInDays(now, new Date(user.first_regular_meeting_at)) === 3 ? 'day3' : 'day7',
  })) || [];
}
```

#### Aha Moment 연동

```typescript
// /lib/praises/create.ts (기존 칭찬 생성 로직 확장)
export async function createPraise(data: CreatePraiseInput) {
  const supabase = createServiceClient();

  // 칭찬 생성 (기존 로직)
  const { data: praise } = await supabase
    .from('praises')
    .insert(data)
    .select()
    .single();

  // 1차 Aha Moment 기록 (칭찬 보내기)
  if (!data.sender.first_aha_at) {
    await supabase
      .from('users')
      .update({ first_aha_at: new Date().toISOString() })
      .eq('id', data.sender_id);

    // 배지 부여: "첫 칭찬 보내기"
    await grantBadge(data.sender_id, 'first_praise_sent');
  }

  // 2차 Aha Moment 기록 (칭찬 받기)
  if (!data.receiver.second_aha_at) {
    await supabase
      .from('users')
      .update({ second_aha_at: new Date().toISOString() })
      .eq('id', data.receiver_id);

    // 배지 부여: "첫 칭찬 받기"
    await grantBadge(data.receiver_id, 'first_praise_received');
  }

  return praise;
}
```

#### 알림 템플릿 (첫 모임 후)

**3일 후:**
```
[지독해] 다음 모임, 함께할까요?

#{회원명}님,

다음 모임은 #{다음모임일시}이에요.
벌써 #{신청인원}명이 신청했어요.

지난번에 만났던 분들도 계실 거예요.

[바로 신청하기]
```

**7일 후 (미신청):**
```
[지독해] 이번 달 마지막 모임이에요.

#{회원명}님,

#{지역}에서 열리는 이번 달 마지막 모임이에요.
#{책제목}을 함께 읽어요.

같이 가실래요?

[마지막 자리 확인하기]
```

#### 온보딩 완료 처리

```typescript
// 첫 정기모임 참여 완료 시 호출
export async function completeOnboarding(userId: string) {
  const supabase = createServiceClient();

  await supabase
    .from('users')
    .update({
      is_new_member: false,
      onboarding_step: 5,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // "첫 모임 참여" 배지 부여
  await grantBadge(userId, 'first_meeting_completed');
}
```

#### 완료 검증

- [ ] 첫 모임 후 3일 미신청 시 리마인드 알림 발송
- [ ] 첫 모임 후 7일 미신청 시 희소성 알림 발송
- [ ] 14일 후 알림 중단
- [ ] 칭찬 보내기 시 first_aha_at 기록
- [ ] 칭찬 받기 시 second_aha_at 기록
- [ ] "첫 칭찬 보내기" 배지 부여
- [ ] "첫 칭찬 받기" 배지 부여
- [ ] 온보딩 완료 시 "첫 모임 참여" 배지 부여

#### 사용자 가치

> "첫 모임 후 적절한 타이밍에 재참여를 유도하고, Aha Moment를 통해 소속감을 강화"

---

## 3. M6-Onboarding 완료 검증 체크리스트

### 기능 검증

- [ ] 온보딩 1단계: 문제 인식 화면 동작
- [ ] 온보딩 2단계: 신뢰 확보 화면 동작
- [ ] 온보딩 3단계: 행동 안내 화면 동작
- [ ] 프로그레스 바 신규 회원에게만 표시
- [ ] 후킹 랜딩페이지 SEO 최적화
- [ ] 가입 후 환영 알림 발송
- [ ] 가입 후 3일/7일 리마인드 발송
- [ ] 첫 모임 후 3일/7일 리마인드 발송
- [ ] 14일 알림 중단 로직 동작
- [ ] Aha Moment 타임스탬프 기록
- [ ] 온보딩 관련 배지 부여

### 품질 검증

- [ ] 온보딩 UI 모바일 최적화
- [ ] 애니메이션 성능 (60fps)
- [ ] SSR 페이지 LCP < 2.5s
- [ ] 알림 발송 성공률 > 99%

### 지표 측정 준비

- [ ] 가입->첫 신청 전환율 측정 쿼리
- [ ] 첫 참여->두 번째 신청 전환율 측정 쿼리
- [ ] 1차 Aha 달성률 측정 쿼리
- [ ] A/B 테스트 그룹 분리 로직 (선택적)

---

## 4. 성공 지표

### Phase별 체크포인트

| Phase | 완료 기준 | 지표 |
|-------|----------|------|
| Phase 1 | DB 필드 + API 동작 | - |
| Phase 2 | 온보딩 UI 완료 | 온보딩 완료율 > 80% |
| Phase 3 | 랜딩페이지 SSR | SEO 점수 > 90 |
| Phase 4 | 가입 리마인드 동작 | 3일 후 알림 발송 성공 |
| Phase 5 | 전체 완료 | 재참여율 측정 시작 |

### 출시 후 1개월 목표

| 지표 | 목표 |
|------|------|
| 가입->첫 신청 전환율 | 50% 이상 |
| 첫 신청->첫 참여율 | 90% 이상 |
| 첫 참여->두 번째 신청 | 50% 이상 |
| 신규 회원 재참여율 | **70% 이상** |
| 1차 Aha 달성률 | 30% 이상 |

---

## 5. AI 에이전트 개발 가이드

### 주의사항

| 항목 | 주의사항 |
|------|---------|
| 온보딩 상태 관리 | `onboarding_step` 업데이트 시 트랜잭션 처리 |
| 알림 중단 로직 | 14일 규칙 철저히, `signup_reminder_count` 추적 |
| 문제 선택 저장 | JSONB 배열로 저장, 분석용 |
| Aha Moment 추적 | `first_aha_at`, `second_aha_at` 타임스탬프 기록 |
| Skip 옵션 | 온보딩 건너뛰기 허용, `onboarding_completed_at` 즉시 설정 |
| 프로그레스 바 | 신규 회원에게만 표시, 조건부 렌더링 |

### 공통 원칙

1. **알림 메시지 원칙 (Balfour):** "당신이 안 했다"가 아니라 "당신이 얻을 수 있는 것" 전달
2. **No-Emoji:** 모든 알림에서 이모지 금지, 따뜻한 문체로 대체
3. **알림 피로 방지:** 14일 규칙, 2회 연속 무시 시 중단
4. **Aha Moment 최적화:** 칭찬 보내기(통제 가능)를 1차 Aha로 설정

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-04 | 1.0 | WP-M6-Onboarding 최초 작성 |

---

> **다음 단계:**
> `@agent-시나리오 WP-M6-Onboarding-P1 SC 만들어줘`
