# Work Package: M4 - 소속감 기능

---

**Milestone:** M4  
**목표:** "나는 지독해 회원"이라는 느낌 강화  
**기간:** 2~3주  
**선행 조건:** M2 완료 (M3과 병행 가능)  
**핵심 가치:** 소속감  
**테스트:** Beta 테스트 시작 (활성 회원 20~30명)

---

## 1. Work Package 개요

M4는 **5개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: 참여 완료 시스템
    ↓ [동작 확인: 모임 종료 후 "어떠셨어요?" 알림 + 참여 완료 처리]
Phase 2: 칭찬하기 & 후기
    ↓ [동작 확인: 익명 칭찬 + 후기 작성 가능]
Phase 3: 배지 시스템
    ↓ [동작 확인: 조건 충족 시 배지 부여]
Phase 4: 마이페이지 강화
    ↓ [동작 확인: 참여 통계, 배지, 자격 상태 표시]
Phase 5: 책장 & 참가자 목록
    ↓ [동작 확인: 내 책장 + 참가자 목록 (칭찬 기반 우선 표시)]
```

---

## 2. Phase 상세

### Phase 1: 참여 완료 시스템

**목표:** 모임 종료 3일 후 알림 발송, 참여 완료 판단

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | "어떠셨어요?" 알림 템플릿 | 카카오 승인 | 버튼 3개 포함 |
| 1.2 | 모임 종료 후 알림 Cron | `/app/api/cron/post-meeting/route.ts` | 3일 후 발송 |
| 1.3 | 참여 완료 선택 화면 | `/app/meetings/[id]/feedback/page.tsx` | 3가지 선택지 |
| 1.4 | 참여 완료 API | `/app/api/participations/complete/route.ts` | 상태 업데이트 |
| 1.5 | 7일 미응답 자동 완료 Cron | `/app/api/cron/auto-complete/route.ts` | 자동 처리 |
| 1.6 | 노쇼 처리 (운영자) | 운영자 화면 | 미참여 수동 변경 |

#### 참여 완료 선택 화면

```
┌─────────────────────────────────────┐
│    📚 경주 정기모임 어떠셨어요?       │
├─────────────────────────────────────┤
│                                      │
│ 1월 20일에 함께한 모임이              │
│ 어떠셨는지 알려주세요!               │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │  💛 칭찬하기                     │ │
│ │  모임에서 좋았던 분에게 감사 전달  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │  ✅ 참여했어요                   │ │
│ │  그냥 참여 완료 처리만            │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │  ✍️ 후기 남기기                  │ │
│ │  모임 경험을 나눠주세요           │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ※ 셋 중 하나를 선택하면 참여 완료!    │
└─────────────────────────────────────┘
```

#### registrations 상태 업데이트

```typescript
interface ParticipationUpdate {
  participation_status: 'completed' | 'no_show';
  participation_method: 'praise' | 'review' | 'confirm' | 'auto' | 'admin';
  completed_at: Date;
}
```

#### 완료 검증

- [ ] 모임 종료 3일 후 알림톡 발송
- [ ] 알림톡 링크 클릭 시 선택 화면 표시
- [ ] [칭찬하기] 선택 → 참여 완료 + 칭찬 화면으로
- [ ] [참여했어요] 선택 → 참여 완료
- [ ] [후기 남기기] 선택 → 참여 완료 + 후기 화면으로
- [ ] 7일 미응답 시 자동 참여 완료
- [ ] 운영자가 노쇼 회원 "미참여" 처리 가능

#### 사용자 가치

> 🎯 **"모임 참여를 자연스럽게 확인하고, 피드백을 남길 수 있다"**

---

### Phase 2: 칭찬하기 & 후기

**목표:** 익명 칭찬 시스템, 후기 작성 기능

**예상 소요:** 2~3일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | praises 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 2.2 | 칭찬하기 화면 | `/app/meetings/[id]/praise/page.tsx` | 참가자 선택 + 문구 |
| 2.3 | 참가자 목록 조회 | API | 같은 모임 참가자 |
| 2.4 | 칭찬 문구 선택 | UI | 5개 선택형 |
| 2.5 | 칭찬 저장 API | `/app/api/praises/route.ts` | POST 요청 |
| 2.6 | 칭찬 중복 방지 | 로직 | 모임당 1명, 3개월 동일인 |
| 2.7 | 누적 칭찬 수 업데이트 | 트리거/로직 | users.total_praises_received |
| 2.8 | reviews 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 2.9 | 후기 작성 화면 | `/app/meetings/[id]/review/page.tsx` | 텍스트 입력 |
| 2.10 | 후기 공개 동의 옵션 | 체크박스 | 후킹페이지 공개 |
| 2.11 | 후기 저장 API | `/app/api/reviews/route.ts` | POST 요청 |
| 2.12 | 건의하기 기능 | suggestions 테이블 | 건의 제출 |

#### praises 테이블

```sql
CREATE TABLE praises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) NOT NULL,
  receiver_id UUID REFERENCES users(id) NOT NULL,
  meeting_id UUID REFERENCES meetings(id) NOT NULL,
  phrase VARCHAR(100) NOT NULL, -- 선택한 칭찬 문구
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, meeting_id) -- 모임당 1명만 칭찬
);

-- 3개월 내 동일인 중복 체크는 쿼리로 처리
```

#### reviews 테이블

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  meeting_id UUID REFERENCES meetings(id) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false, -- 후킹페이지 공개 동의
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meeting_id)
);
```

#### 칭찬 문구 5개

1. "덕분에 좋은 시간이었어요"
2. "이야기가 인상 깊었어요"
3. "따뜻한 분위기를 만들어주셨어요"
4. "새로운 관점을 얻었어요"
5. "다음에도 함께하고 싶어요"

#### 칭찬하기 화면

```
┌─────────────────────────────────────┐
│    💛 누구에게 칭찬을 전할까요?       │
├─────────────────────────────────────┤
│                                      │
│ 함께했던 분들 (익명으로 전달됩니다)    │
│                                      │
│ ○ 김독서                             │
│ ● 박책방  ← 선택됨                   │
│ ○ 이모임                             │
│ ○ 최카페                             │
│                                      │
├─────────────────────────────────────┤
│                                      │
│ 어떤 마음을 전할까요?                 │
│                                      │
│ ○ 덕분에 좋은 시간이었어요            │
│ ● 따뜻한 분위기를 만들어주셨어요       │
│ ○ 이야기가 인상 깊었어요              │
│ ○ 새로운 관점을 얻었어요              │
│ ○ 다음에도 함께하고 싶어요            │
│                                      │
│              [칭찬 보내기]            │
└─────────────────────────────────────┘
```

#### 완료 검증

- [ ] 칭찬하기 화면에서 참가자 목록 표시 (본인 제외)
- [ ] 칭찬 문구 5개 중 1개 선택
- [ ] 칭찬 저장 후 수신자 누적 칭찬 수 +1
- [ ] 모임당 1명만 칭찬 가능 (중복 시 에러)
- [ ] 같은 사람에게 3개월 내 중복 칭찬 불가
- [ ] 후기 작성 + 공개 동의 옵션
- [ ] 건의하기 제출 가능

#### 사용자 가치

> 🎯 **"모임에서 좋았던 분에게 익명으로 따뜻한 마음을 전할 수 있다"**

---

### Phase 3: 배지 시스템

**목표:** 조건 충족 시 배지 자동 부여

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | badges 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 3.2 | user_badges 테이블 생성 | SQL 마이그레이션 | 획득 기록 |
| 3.3 | 배지 목록 데이터 | seed 데이터 | 기본 배지 등록 |
| 3.4 | 배지 조건 체크 로직 | `/lib/badges.ts` | 조건별 체크 |
| 3.5 | 참여 완료 시 배지 체크 | 트리거/로직 | 자동 부여 |
| 3.6 | 칭찬 수신 시 배지 체크 | 트리거/로직 | 자동 부여 |
| 3.7 | 배지 컴포넌트 | UI 컴포넌트 | 배지 아이콘 표시 |

#### badges / user_badges 테이블

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- 이모지 또는 아이콘 코드
  condition_type VARCHAR(50) NOT NULL, -- participation, praise, consecutive
  condition_value INTEGER NOT NULL, -- 조건 값
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  badge_id UUID REFERENCES badges(id) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 기본 배지 데이터
INSERT INTO badges (name, description, icon, condition_type, condition_value) VALUES
('첫 발자국', '첫 모임에 참여했어요', '👣', 'participation', 1),
('10회 참여', '10번째 모임이에요', '🎯', 'participation', 10),
('연속 4주', '4주 연속 참여했어요', '🔥', 'consecutive', 4),
('칭찬 10개', '칭찬을 10개 받았어요', '💛', 'praise', 10),
('칭찬 30개', '칭찬을 30개 받았어요', '🌟', 'praise', 30),
('칭찬 50개', '칭찬을 50개 받았어요', '👑', 'praise', 50);
```

#### 배지 조건 체크 로직

```typescript
// /lib/badges.ts
async function checkAndAwardBadges(userId: string) {
  const user = await getUser(userId);
  const badges = await getAllBadges();
  const userBadges = await getUserBadges(userId);
  
  const earnedBadgeIds = new Set(userBadges.map(b => b.badge_id));
  
  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue; // 이미 보유
    
    let earned = false;
    
    switch (badge.condition_type) {
      case 'participation':
        earned = user.total_participations >= badge.condition_value;
        break;
      case 'consecutive':
        earned = user.consecutive_weeks >= badge.condition_value;
        break;
      case 'praise':
        earned = user.total_praises_received >= badge.condition_value;
        break;
    }
    
    if (earned) {
      await awardBadge(userId, badge.id);
    }
  }
}
```

#### 완료 검증

- [ ] 첫 참여 완료 시 "첫 발자국" 배지 부여
- [ ] 10회 참여 완료 시 "10회 참여" 배지 부여
- [ ] 4주 연속 참여 시 "연속 4주" 배지 부여
- [ ] 칭찬 10개 수신 시 "칭찬 10개" 배지 부여
- [ ] 이미 보유한 배지는 중복 부여 안 됨

#### 사용자 가치

> 🎯 **"참여 이력에 따라 배지를 획득하며 성취감을 느낄 수 있다"**

---

### Phase 4: 마이페이지 강화

**목표:** 참여 통계, 배지, 정기모임 자격 상태 표시

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | 참여 통계 계산 | 로직 | 총 횟수, 연속, 가입 일수 |
| 4.2 | 참여 통계 UI | 마이페이지 섹션 | 시각적 표시 |
| 4.3 | "함께한 지 OOO일째" | UI | 가입 후 경과 일수 |
| 4.4 | 정기모임 자격 상태 | UI | 마지막 참여일 + 만료 경고 |
| 4.5 | 6개월 임박 경고 | UI + 알림 | 자격 만료 예정 표시 |
| 4.6 | 배지 목록 표시 | UI | 획득한 배지 아이콘 |
| 4.7 | 누적 칭찬 수 표시 | UI | 받은 칭찬 수 |

#### 마이페이지 참여 통계 UI

```
┌─────────────────────────────────────┐
│ 👤 김독서님                          │
│ 지독해와 함께한 지 127일째 📚         │
├─────────────────────────────────────┤
│                                      │
│ 📊 나의 참여 기록                     │
│                                      │
│ ┌─────────┬─────────┬─────────────┐ │
│ │ 총 참여  │ 연속    │ 칭찬 받은   │ │
│ │   12회  │  3주   │   5개 💛   │ │
│ └─────────┴─────────┴─────────────┘ │
│                                      │
│ 🎖️ 나의 배지                         │
│ 👣 첫 발자국  🎯 10회 참여            │
│                                      │
│ ⚠️ 정기모임 자격                      │
│ 마지막 참여: 2024년 12월 15일          │
│ 자격 만료 예정: 2025년 6월 15일        │
│ → 3개월 남았어요                      │
│                                      │
└─────────────────────────────────────┘
```

#### 연속 참여 계산 로직

```typescript
function calculateConsecutiveWeeks(participations: Date[]): number {
  // 참여일 기준 주 단위로 그룹화
  // 이전 주와 연속인지 확인
  // 최근 연속 주 수 반환
}
```

#### 완료 검증

- [ ] 마이페이지에서 총 참여 횟수 표시
- [ ] 연속 참여 주 수 표시
- [ ] "함께한 지 OOO일째" 표시
- [ ] 획득한 배지 아이콘으로 표시
- [ ] 정기모임 자격 상태 (마지막 참여일) 표시
- [ ] 6개월 임박 시 경고 표시

#### 사용자 가치

> 🎯 **"나의 참여 이력을 한눈에 확인하고 소속감을 느낄 수 있다"**

---

### Phase 5: 책장 & 참가자 목록

**목표:** 내 책장 기능, 참가자 목록 (칭찬 기반 우선 표시)

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 5.1 | bookshelf 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 5.2 | 책 등록 화면 | `/app/mypage/bookshelf/page.tsx` | 등록 폼 |
| 5.3 | 책 등록 API | `/app/api/bookshelf/route.ts` | POST 요청 |
| 5.4 | 중복 등록 방지 | 로직 | 같은 책 체크 |
| 5.5 | 한 문장 기록 | 입력 필드 | 선택 사항 |
| 5.6 | 내 책장 목록 | UI | 등록한 책 표시 |
| 5.7 | 참가자 목록 (모임 상세) | UI | 칭찬 기반 우선 |
| 5.8 | 흐릿하게 처리 | UI | 일부만 공개 |

#### bookshelf 테이블

```sql
CREATE TABLE bookshelf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100),
  one_line TEXT, -- 한 문장 기록
  meeting_id UUID REFERENCES meetings(id), -- 관련 모임 (선택)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, title, author) -- 같은 책 중복 방지
);
```

#### 참가자 목록 표시 규칙

```typescript
async function getParticipantListForDisplay(meetingId: string) {
  const participants = await getConfirmedParticipants(meetingId);
  
  if (participants.length < 3) {
    return { visible: [], hidden: [] }; // 3명 미만은 비공개
  }
  
  // 칭찬 10개 이상 받은 참가자 중 랜덤 선택
  const highlighted = participants
    .filter(p => p.total_praises_received >= 10)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  // 나머지 중 칭찬 많은 순으로 일부
  const others = participants
    .filter(p => !highlighted.includes(p))
    .sort((a, b) => b.total_praises_received - a.total_praises_received)
    .slice(0, 2);
  
  const visible = [...highlighted, ...others];
  const hidden = participants.filter(p => !visible.includes(p));
  
  return { visible, hidden };
}
```

#### 내 책장 UI

```
┌─────────────────────────────────────┐
│ 📚 내 책장 (12권)                    │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 📖 아몬드                        │ │
│ │ 손원평 저                        │ │
│ │ "결국 사랑이었다"                 │ │
│ │ 2024년 12월 모임에서              │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 📖 불편한 편의점                  │ │
│ │ 김호연 저                        │ │
│ │ 한 문장 기록 없음                 │ │
│ └─────────────────────────────────┘ │
│                                      │
│        [+ 책 등록하기]               │
└─────────────────────────────────────┘
```

#### 완료 검증

- [ ] 책 등록 (제목, 저자) 가능
- [ ] 한 문장 기록 (선택) 가능
- [ ] 같은 책 중복 등록 불가
- [ ] 내 책장에서 등록한 책 목록 확인
- [ ] 모임 상세에서 참가자 목록 클릭 시 일부 공개
- [ ] 칭찬 10개 이상 받은 참가자 우선 표시
- [ ] 나머지 참가자는 흐릿하게 처리

#### 사용자 가치

> 🎯 **"함께 읽은 책을 기록하고, 모임에 참여한 사람들을 확인할 수 있다"**

---

## 3. M4 완료 검증 체크리스트

### 기능 검증

- [ ] 모임 종료 3일 후 "어떠셨어요?" 알림 발송
- [ ] 칭찬하기 / 참여했어요 / 후기 남기기 선택 가능
- [ ] 7일 미응답 시 자동 참여 완료 처리
- [ ] 칭찬하기 → 참가자 선택 + 문구 선택
- [ ] 칭찬 중복 방지 (모임당 1명, 3개월 동일인)
- [ ] 조건 충족 시 배지 자동 부여
- [ ] 마이페이지에서 참여 통계 확인
- [ ] 책장에 책 등록 가능
- [ ] 참가자 목록에서 일부만 공개 (칭찬 기반 우선)

### 비즈니스 규칙 검증

- [ ] 익명 칭찬 (발신자 비공개)
- [ ] 배지는 본인만 볼 수 있음
- [ ] 후기 공개 동의한 것만 후킹페이지에 표시 (M6)

---

## 4. Beta 테스트 계획

### 테스트 대상

- 활성 회원: 20~30명

### 테스트 시나리오

1. **참여 완료 흐름**
   - 모임 후 3일 뒤 알림 수신 → 칭찬/참여/후기 선택

2. **칭찬하기**
   - 참가자 선택 → 문구 선택 → 칭찬 전송

3. **배지 획득**
   - 참여 완료 후 배지 획득 확인

4. **책장 등록**
   - 책 정보 입력 → 한 문장 기록 → 등록

### 피드백 수집

- 칭찬 문구 추가 의견
- 배지 종류 추가 의견
- UI/UX 개선점

---

## 5. 다음 단계 (M5 준비)

M4 완료 후 M5 시작 전 확인:

- [ ] 대시보드 통계 쿼리 설계
- [ ] 운영자 권한 관리 테이블 설계

---

## 6. 애니메이션 요구사항

M4의 핵심인 **게이미피케이션 효과**를 위한 애니메이션입니다.

### 배지 획득 연출

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| Confetti 효과 | 화면 전체 꽃가루 | `react-confetti` 라이브러리 (3초) |
| 배지 카드 | Y축 360도 회전 등장 | `rotateY: 0 → 360` (0.8초) |
| 배지 모달 | 중앙에서 스케일업 | scale 0 → 1, 바운스 이징 |
| 자동 닫힘 | 페이드아웃 | 3초 유지 후 opacity 0 (또는 아무 곳 클릭) |

### 칭찬하기 연출

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 하트 날아감 | 버튼 → 화면 상단 | position 이동 + fade out + 약간 커짐 |
| 완료 메시지 | 페이드인 | "따뜻한 마음이 전해졌어요 💛" |
| 칭찬 카운트 | 숫자 증가 | 수신자 프로필의 칭찬 수 +1 애니메이션 |

### 마이페이지 강화

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 연속 참여 프로그레스 바 | 로드 시 채워짐 | width 0% → 현재값 (0.5초) |
| 참여 게이지 | 4주 기준 진행률 | 시각적 게이지 UI |
| 배지 목록 | 순차적 등장 | Stagger 100ms |
| 통계 숫자 | 카운트업 | 0 → 현재값 (0.3초) |

### 책장 등록

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 책 카드 추가 | 슬라이드 인 + 팝 | 왼쪽에서 등장 + scale 팝 |
| 등록 완료 | 체크마크 | 완료 아이콘 등장 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | WP-M4 최초 작성 |
| 2026-01-15 | 1.1 | 애니메이션 요구사항 섹션 추가 (배지 Confetti, 칭찬 하트, 프로그레스 바 등) |

