# Work Package: M11 - Community Hub

---

**Milestone:** M11
**목표:** 모임 외 시간에도 연결되는 공간, 콘텐츠 허브 구축
**기간:** 3~4주
**선행 조건:** M10 완료
**핵심 가치:** 소속감, 정체성, 연결

---

## 1. Work Package 개요

M11은 **4개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: 공유 책장 기반 구축
    | [동작 확인: /bookshelf 페이지에서 책 탐색 + 상호작용 가능]
    v
Phase 2: 멤버 프로필 확장
    | [동작 확인: 독서 DNA 차트, 독서 스타일, 함께한 사람들 표시]
    v
Phase 3: 멤버 디렉토리 & 검색
    | [동작 확인: /members 페이지에서 취향 기반 필터 동작]
    v
Phase 4: 활동 피드 & 화제의 책
    | [동작 확인: 홈에서 최근 활동 + 이번 주 화제의 책 표시]
```

---

## 2. DB 스키마 변경 (전체)

### 2.1 users 테이블 확장

```sql
-- 멤버 프로필 확장
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN reading_style VARCHAR(50);
-- reading_style: 'passionate' | 'steady' | 'explorer' | 'deep-diver' | null
```

### 2.2 book_interactions 테이블 생성

```sql
CREATE TABLE book_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES bookshelf(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('read', 'want_to_read')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, book_id, interaction_type)
);

-- 인덱스
CREATE INDEX idx_book_interactions_book_id ON book_interactions(book_id);
CREATE INDEX idx_book_interactions_user_id ON book_interactions(user_id);
CREATE INDEX idx_book_interactions_type ON book_interactions(interaction_type);

-- RLS 정책
ALTER TABLE book_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "누구나 읽기 가능" ON book_interactions FOR SELECT USING (true);
CREATE POLICY "본인만 생성 가능" ON book_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인만 삭제 가능" ON book_interactions FOR DELETE USING (auth.uid() = user_id);
```

### 2.3 activity_feed 테이블 생성

```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  -- activity_type: 'book_added', 'review_written', 'member_joined', 'badge_earned', 'praise_sent'
  reference_id UUID, -- 참조 대상 ID (book_id, review_id, badge_id 등)
  reference_type VARCHAR(50), -- 'book', 'review', 'badge', 'praise'
  metadata JSONB DEFAULT '{}',
  -- metadata 예시: { "book_title": "...", "badge_name": "..." }
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);

-- RLS 정책
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공개 활동 읽기 가능" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "본인 활동 전체 읽기" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
```

### 2.4 bookshelf 테이블 확장 (기존 테이블)

```sql
-- 장르 필드 추가 (M4에서 생성된 테이블 확장)
ALTER TABLE bookshelf ADD COLUMN genre VARCHAR(50);
-- genre: 'fiction', 'non-fiction', 'essay', 'self-help', 'science', 'history', 'philosophy', 'other'

ALTER TABLE bookshelf ADD COLUMN cover_url TEXT;
-- 책 표지 이미지 URL (선택)
```

---

## 3. Phase 상세

### Phase 1: 공유 책장 기반 구축

**목표:** 전체 회원의 책을 한곳에서 탐색하고 상호작용할 수 있는 공간
**예상 소요:** 5~7일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | book_interactions 테이블 생성 | SQL 마이그레이션 | 테이블 + RLS 정책 |
| 1.2 | bookshelf 테이블 장르 필드 추가 | SQL 마이그레이션 | ALTER TABLE 완료 |
| 1.3 | 공유 책장 페이지 생성 | `/app/bookshelf/page.tsx` | 책 목록 표시 |
| 1.4 | 책 목록 필터링 (장르별) | 필터 UI + 쿼리 | 장르 선택 시 필터 |
| 1.5 | 책 목록 정렬 (최근/인기순) | 정렬 UI + 쿼리 | 정렬 동작 |
| 1.6 | 책 상세 페이지 | `/app/bookshelf/[id]/page.tsx` | 책 정보 + 읽은 멤버 |
| 1.7 | "나도 읽었어요" 버튼 | 클라이언트 컴포넌트 | 클릭 시 interaction 추가 |
| 1.8 | "읽고 싶어요" 버튼 | 클라이언트 컴포넌트 | 위시리스트 추가 |
| 1.9 | 책 기반 연결 UI | "이 책을 좋아하는 멤버" | 멤버 아바타 표시 |
| 1.10 | book_interactions API | `/app/api/books/interactions/route.ts` | POST/DELETE |
| 1.11 | BookCard 컴포넌트 | `src/components/bookshelf/BookCard.tsx` | 재사용 가능한 카드 |
| 1.12 | 내 책장에서 장르 입력 추가 | 책 등록 폼 수정 | 장르 선택 드롭다운 |

#### Scenario (검증 기준)

**SC-M11-001: 공유 책장 탐색**
- Given: 로그인한 사용자가 /bookshelf 접속
- When: 페이지 로드
- Then: 전체 회원이 등록한 책 목록이 카드 형태로 표시됨

**SC-M11-002: 장르별 필터링**
- Given: 공유 책장 페이지
- When: "에세이" 장르 필터 클릭
- Then: 에세이 장르 책만 필터링되어 표시

**SC-M11-003: "나도 읽었어요" 상호작용**
- Given: 책 상세 페이지 접속
- When: "나도 읽었어요" 버튼 클릭
- Then:
  - 버튼이 "읽었어요" 상태로 변경
  - 읽은 멤버 목록에 본인 추가
  - book_interactions 테이블에 레코드 생성

**SC-M11-004: 책 기반 멤버 연결**
- Given: 책 상세 페이지
- When: 3명 이상이 "나도 읽었어요" 클릭한 책
- Then: "이 책을 좋아하는 멤버 5명" 섹션에 아바타 표시

**SC-M11-005: "나도 읽었어요" 중복 클릭 방지**
- Given: 이미 "나도 읽었어요"를 클릭한 책 상세 페이지
- When: "나도 읽었어요" 버튼 다시 클릭
- Then:
  - 버튼이 "읽었어요 취소" 상태로 변경되어 있음
  - 클릭 시 interaction 삭제 (토글 방식)
  - 중복 레코드 생성되지 않음

**SC-M11-006: 본인 등록 책에 "나도 읽었어요" 비활성화**
- Given: 본인이 등록한 책의 상세 페이지
- When: 페이지 로드
- Then:
  - "나도 읽었어요" 버튼이 비활성화 상태
  - "내가 등록한 책이에요" 텍스트 표시
  - 클릭해도 interaction 생성 불가

#### 공유 책장 UI 목업

```
+--------------------------------------------------+
|  [Logo] 공유 책장                    [검색 아이콘] |
+--------------------------------------------------+
|                                                   |
|  [전체] [소설] [에세이] [자기계발] [인문] [기타]    |
|                                                   |
|  정렬: [최근 추가순 v] [인기순]                    |
|                                                   |
+--------------------------------------------------+
|  +-------------+  +-------------+  +-------------+ |
|  |   [표지]    |  |   [표지]    |  |   [표지]    | |
|  |             |  |             |  |             | |
|  | 아몬드      |  | 불편한편의점 |  | 물고기는..   | |
|  | 손원평      |  | 김호연      |  | 수잔 케인   | |
|  | 읽은 멤버 5 |  | 읽은 멤버 3 |  | 읽은 멤버 8 | |
|  +-------------+  +-------------+  +-------------+ |
|                                                   |
+--------------------------------------------------+
```

#### 책 상세 페이지 UI 목업

```
+--------------------------------------------------+
|  [<] 책 상세                                      |
+--------------------------------------------------+
|                                                   |
|        +------------------+                       |
|        |    [책 표지]      |                       |
|        |                  |                       |
|        +------------------+                       |
|                                                   |
|        아몬드                                      |
|        손원평 저 | 소설                            |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  [나도 읽었어요]  [읽고 싶어요]                     |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  이 책을 읽은 멤버 (5명)                           |
|  +----+  +----+  +----+  +----+  +----+          |
|  | 김 |  | 이 |  | 박 |  | 최 |  | +2 |          |
|  +----+  +----+  +----+  +----+  +----+          |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  모임에서 나온 인사이트                            |
|                                                   |
|  "결국 사랑이었다" - 김독서 (12월 모임)            |
|  "감정을 배우는 여정" - 박책방 (11월 모임)         |
|                                                   |
+--------------------------------------------------+
```

#### 사용자 가치

> "전체 회원이 읽은 책을 한눈에 탐색하고, 같은 책을 읽은 멤버를 발견할 수 있다"

---

### Phase 2: 멤버 프로필 확장

**목표:** 독서 취향을 시각화하고, 함께한 인연을 보여주는 프로필
**예상 소요:** 4~6일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | users 테이블 bio, reading_style 추가 | SQL 마이그레이션 | ALTER TABLE 완료 |
| 2.2 | 프로필 수정 페이지 확장 | `/app/mypage/edit/page.tsx` | bio, reading_style 입력 |
| 2.3 | 독서 DNA 차트 계산 로직 | `/lib/readingDna.ts` | 장르 비율 계산 |
| 2.4 | 독서 DNA 차트 컴포넌트 | `ReadingDnaChart.tsx` | 레이더/도넛 차트 |
| 2.5 | 독서 스타일 자동 계산 | 로직 | 참여 패턴 기반 분류 |
| 2.6 | 독서 스타일 표시 UI | 배지 형태 | 스타일명 + 설명 |
| 2.7 | 함께한 사람들 계산 | SQL/로직 | 동일 모임 참여 횟수 |
| 2.8 | 함께한 사람들 UI | 프로필 섹션 | 아바타 + 횟수 |
| 2.9 | 공통으로 읽은 책 계산 | SQL 쿼리 | 교집합 책 목록 |
| 2.10 | 공통으로 읽은 책 UI | 프로필 섹션 | 책 썸네일 목록 |
| 2.11 | 마이페이지 프로필 확장 | 기존 페이지 수정 | 신규 섹션 통합 |
| 2.12 | 타인 프로필 보기 페이지 | `/app/members/[id]/page.tsx` | 공개 정보만 표시 |

#### Scenario (검증 기준)

**SC-M11-007: 독서 DNA 차트 표시**
- Given: 5권 이상 책을 등록한 사용자
- When: 마이페이지 접속
- Then: 장르별 비율이 시각적 차트(레이더/도넛)로 표시됨

**SC-M11-008: 독서 스타일 자동 분류**
- Given: 3개월간 매주 모임 참여한 사용자
- When: 프로필 조회
- Then: "꾸준형" 독서 스타일 배지 표시

**SC-M11-009: 함께한 사람들 표시**
- Given: 동일 모임에 3회 이상 참여한 멤버 존재
- When: 마이페이지 > 함께한 사람들 섹션
- Then: 자주 만난 멤버 아바타 + 횟수 표시 (상위 5명)

**SC-M11-010: 공통 책 발견**
- Given: 다른 멤버 프로필 조회
- When: 해당 멤버와 공통으로 읽은 책이 있음
- Then: "함께 읽은 책" 섹션에 공통 책 표시

#### 독서 스타일 정의

| 스타일 | 조건 | 설명 |
|--------|------|------|
| 열정형 (Passionate) | 월 3회 이상 참여 | 모임에 가장 열정적으로 참여해요 |
| 꾸준형 (Steady) | 3개월 연속 참여 | 꾸준히 독서 습관을 유지해요 |
| 탐험가 (Explorer) | 5개 이상 장르 책 등록 | 다양한 장르를 섭렵해요 |
| 깊이파기 (Deep-Diver) | 한 장르 70% 이상 | 좋아하는 장르를 깊이 파고들어요 |

#### 독서 DNA 차트 구현

```typescript
// /lib/readingDna.ts
interface ReadingDna {
  fiction: number;      // 소설
  essay: number;        // 에세이
  selfHelp: number;     // 자기계발
  science: number;      // 과학
  history: number;      // 역사
  philosophy: number;   // 철학
  other: number;        // 기타
}

export async function calculateReadingDna(userId: string): Promise<ReadingDna> {
  const { data: books } = await supabase
    .from('bookshelf')
    .select('genre')
    .eq('user_id', userId);

  const total = books?.length || 0;
  if (total === 0) return null;

  const counts = books.reduce((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {});

  return {
    fiction: Math.round((counts['fiction'] || 0) / total * 100),
    essay: Math.round((counts['essay'] || 0) / total * 100),
    // ... 나머지 장르
  };
}
```

#### 프로필 확장 UI 목업

```
+--------------------------------------------------+
|  [마이페이지]                                      |
+--------------------------------------------------+
|                                                   |
|  +----+  김독서님                                 |
|  |    |  지독해와 함께한 지 127일째                |
|  +----+  "책과 사람, 그 사이의 이야기를 좋아해요"   |
|          [프로필 수정]                            |
|                                                   |
+--------------------------------------------------+
|  나의 독서 DNA                                    |
|  +------------------------------------------+    |
|  |          소설                             |    |
|  |     /----+----\                          |    |
|  |    /     |     \                         |    |
|  |  에세이--+--자기계발  [레이더 차트]         |    |
|  |    \     |     /                         |    |
|  |     \----+----/                          |    |
|  |          과학                             |    |
|  +------------------------------------------+    |
|                                                   |
|  독서 스타일: [탐험가] 다양한 장르를 섭렵해요     |
|                                                   |
+--------------------------------------------------+
|  함께한 사람들 (자주 만난 순)                      |
|  +----+  +----+  +----+  +----+  +----+          |
|  | 이 |  | 박 |  | 최 |  | 정 |  | 강 |          |
|  | 5회 |  | 4회 |  | 3회 |  | 3회 |  | 2회 |      |
|  +----+  +----+  +----+  +----+  +----+          |
|                                                   |
+--------------------------------------------------+
```

#### 사용자 가치

> "나의 독서 취향을 시각적으로 확인하고, 모임에서 자주 만난 인연을 발견할 수 있다"

---

### Phase 3: 멤버 디렉토리 & 검색

**목표:** 취향이 비슷한 멤버를 찾고 연결되는 공간
**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | 멤버 디렉토리 페이지 | `/app/members/page.tsx` | 멤버 목록 표시 |
| 3.2 | 멤버 검색 (이름) | 검색 입력 + 쿼리 | 실시간 검색 |
| 3.3 | 관심 장르 필터 | 필터 UI | 장르 선택 필터 |
| 3.4 | 지역 필터 (경주/포항) | 필터 UI | 지역 선택 필터 |
| 3.5 | "나와 취향 비슷한" 필터 | 알고리즘 + 필터 | 유사도 기반 정렬 |
| 3.6 | 멤버 카드 컴포넌트 | `MemberCard.tsx` | 프로필 요약 카드 |
| 3.7 | 멤버 카드 목록 애니메이션 | Framer Motion | Stagger 등장 |
| 3.8 | 취향 유사도 계산 로직 | `/lib/similarity.ts` | 장르 기반 코사인 유사도 |
| 3.9 | API 최적화 (페이지네이션) | API | 무한 스크롤 지원 |
| 3.10 | 멤버 상세 페이지 링크 | 카드 클릭 | Phase 2 페이지 연결 |

#### Scenario (검증 기준)

**SC-M11-011: 멤버 디렉토리 접근**
- Given: 로그인한 사용자
- When: /members 접속
- Then: 전체 멤버 카드 목록이 순차적으로 등장 (Stagger)

**SC-M11-012: 이름 검색**
- Given: 멤버 디렉토리 페이지
- When: 검색창에 "김" 입력
- Then: 이름에 "김"이 포함된 멤버만 필터링 (debounce 적용)

**SC-M11-013: 취향 비슷한 멤버 필터**
- Given: 소설/에세이 위주로 책 등록한 사용자
- When: "나와 취향 비슷한" 필터 선택
- Then: 독서 DNA 유사도 높은 순으로 정렬

**SC-M11-014: 지역 필터**
- Given: 멤버 디렉토리 페이지
- When: "경주" 지역 필터 선택
- Then: 경주 지역 회원만 표시

#### 취향 유사도 알고리즘

```typescript
// /lib/similarity.ts
interface ReadingDna {
  [genre: string]: number; // 0~100 비율
}

/**
 * 코사인 유사도 계산
 * 두 사용자의 독서 DNA 벡터 간 유사도 (0~1)
 */
export function calculateSimilarity(dna1: ReadingDna, dna2: ReadingDna): number {
  const genres = ['fiction', 'essay', 'selfHelp', 'science', 'history', 'philosophy', 'other'];

  const v1 = genres.map(g => dna1[g] || 0);
  const v2 = genres.map(g => dna2[g] || 0);

  const dotProduct = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
  const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (mag1 * mag2);
}

/**
 * 나와 취향 비슷한 멤버 조회
 */
export async function getSimilarMembers(userId: string, limit = 20) {
  const myDna = await calculateReadingDna(userId);
  if (!myDna) return [];

  const { data: members } = await supabase
    .from('users')
    .select('id, name, avatar_url')
    .neq('id', userId);

  const membersWithSimilarity = await Promise.all(
    members.map(async (member) => {
      const theirDna = await calculateReadingDna(member.id);
      return {
        ...member,
        similarity: theirDna ? calculateSimilarity(myDna, theirDna) : 0,
      };
    })
  );

  return membersWithSimilarity
    .filter(m => m.similarity > 0.3) // 30% 이상 유사도만
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

#### 멤버 디렉토리 UI 목업

```
+--------------------------------------------------+
|  [Logo] 멤버                        [필터 아이콘] |
+--------------------------------------------------+
|                                                   |
|  [검색] 멤버 이름 검색...                          |
|                                                   |
+--------------------------------------------------+
|  필터                                             |
|  [나와 취향 비슷한] [경주] [포항]                   |
|  [소설] [에세이] [자기계발] [인문]                  |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  +--------------------------------------------+  |
|  |  +----+  김독서                             |  |
|  |  |    |  탐험가 | 함께 읽은 책 3권          |  |
|  |  +----+  "책과 사람, 그 사이..."            |  |
|  |          취향 유사도: 85%                   |  |
|  +--------------------------------------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  |  +----+  이책방                             |  |
|  |  |    |  꾸준형 | 함께 읽은 책 1권          |  |
|  |  +----+  "좋은 문장을 모으는 중"            |  |
|  |          취향 유사도: 72%                   |  |
|  +--------------------------------------------+  |
|                                                   |
+--------------------------------------------------+
```

#### 사용자 가치

> "취향이 비슷한 멤버를 발견하고, 새로운 독서 친구를 찾을 수 있다"

---

### Phase 4: 활동 피드 & 화제의 책

**목표:** 커뮤니티의 생동감을 보여주고, 콘텐츠 큐레이션 제공
**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | activity_feed 테이블 생성 | SQL 마이그레이션 | 테이블 + RLS |
| 4.2 | 활동 피드 자동 기록 로직 | 트리거/훅 | 책 등록, 후기 등 기록 |
| 4.3 | 활동 피드 API | `/app/api/feed/route.ts` | GET (페이지네이션) |
| 4.4 | 피드 아이템 컴포넌트 | `FeedItem.tsx` | 활동 유형별 UI |
| 4.5 | 홈 > 최근 활동 섹션 | 홈 페이지 수정 | 피드 미리보기 (5개) |
| 4.6 | 전체 피드 페이지 | `/app/feed/page.tsx` (선택) | 무한 스크롤 |
| 4.7 | 화제의 책 계산 로직 | `/lib/trendingBooks.ts` | 최근 모임 인사이트 집계 |
| 4.8 | 홈 > 이번 주 화제의 책 섹션 | 홈 페이지 수정 | 책 + 대표 인용구 |
| 4.9 | 화제의 책 API | `/app/api/books/trending/route.ts` | GET |
| 4.10 | 피드 새로고침 애니메이션 | Framer Motion | Pull-to-refresh 스타일 |
| 4.11 | 캐싱 최적화 | React Query / SWR | 피드 성능 개선 |

#### Scenario (검증 기준)

**SC-M11-015: 활동 피드 표시**
- Given: 최근 24시간 내 책 등록, 후기, 새 멤버 가입 활동 발생
- When: 홈 화면 접속
- Then: "최근 활동" 섹션에 최신 5개 활동 표시

**SC-M11-016: 활동 자동 기록**
- Given: 사용자가 책 등록
- When: 책 등록 완료
- Then: activity_feed 테이블에 'book_added' 타입 레코드 자동 생성

**SC-M11-017: 이번 주 화제의 책**
- Given: 지난 7일간 모임에서 가장 많이 소개된 책이 "아몬드"
- When: 홈 화면 접속
- Then: "이번 주 화제의 책" 섹션에 "아몬드" + 대표 인용구 표시

**SC-M11-018: 화제의 책 동적 계산**
- Given: 새로운 모임에서 "불편한 편의점"이 3번 소개됨
- When: 다음 날 홈 화면 접속
- Then: 화제의 책이 "불편한 편의점"으로 변경됨

#### 활동 피드 자동 기록

```typescript
// 책 등록 API에서 피드 기록
async function recordBookAddedActivity(userId: string, bookId: string, bookTitle: string) {
  await supabase
    .from('activity_feed')
    .insert({
      user_id: userId,
      activity_type: 'book_added',
      reference_id: bookId,
      reference_type: 'book',
      metadata: { book_title: bookTitle },
    });
}

// 또는 DB 트리거로 자동 기록
/*
CREATE OR REPLACE FUNCTION record_book_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (user_id, activity_type, reference_id, reference_type, metadata)
  VALUES (NEW.user_id, 'book_added', NEW.id, 'book', jsonb_build_object('book_title', NEW.title));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_book_insert
AFTER INSERT ON bookshelf
FOR EACH ROW EXECUTE FUNCTION record_book_activity();
*/
```

#### 화제의 책 계산 로직

```typescript
// /lib/trendingBooks.ts
interface TrendingBook {
  bookId: string;
  title: string;
  author: string;
  mentionCount: number;
  representativeQuote: string;
  quoteMember: string;
}

export async function getTrendingBooks(days = 7, limit = 3): Promise<TrendingBook[]> {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  // 최근 모임에서 소개된 책 집계
  const { data: recentInsights } = await supabase
    .from('bookshelf')
    .select(`
      id,
      title,
      author,
      one_line,
      meeting_id,
      users(name)
    `)
    .gte('created_at', sinceDate.toISOString())
    .not('meeting_id', 'is', null);

  // 책별 멘션 횟수 집계
  const bookCounts = recentInsights?.reduce((acc, book) => {
    const key = `${book.title}::${book.author}`;
    if (!acc[key]) {
      acc[key] = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        mentionCount: 0,
        quotes: [],
      };
    }
    acc[key].mentionCount++;
    if (book.one_line) {
      acc[key].quotes.push({ quote: book.one_line, member: book.users.name });
    }
    return acc;
  }, {});

  // 정렬 및 대표 인용구 선택
  return Object.values(bookCounts)
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, limit)
    .map(book => ({
      ...book,
      representativeQuote: book.quotes[0]?.quote || '',
      quoteMember: book.quotes[0]?.member || '',
    }));
}
```

#### 피드 아이템 유형별 UI

| 활동 유형 | 아이콘 | 메시지 형식 |
|----------|--------|------------|
| book_added | BookOpen | "{이름}님이 '{책 제목}'을 책장에 추가했어요" |
| review_written | MessageSquare | "{이름}님이 후기를 남겼어요" |
| member_joined | UserPlus | "{이름}님이 지독해에 합류했어요" |
| badge_earned | Award | "{이름}님이 '{배지명}' 배지를 획득했어요" |
| praise_sent | Heart | "따뜻한 칭찬이 전해졌어요" (익명) |

#### 홈 화면 확장 UI 목업

```
+--------------------------------------------------+
|  [기존 모임 목록]                                  |
|  ...                                              |
+--------------------------------------------------+
|                                                   |
|  이번 주 화제의 책                                 |
|  +--------------------------------------------+  |
|  |  +------+                                   |  |
|  |  |      |  아몬드                           |  |
|  |  | 표지 |  손원평 저                         |  |
|  |  |      |                                   |  |
|  |  +------+  "결국 사랑이었다"                 |  |
|  |            - 김독서님 (12월 모임)            |  |
|  +--------------------------------------------+  |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  최근 활동                           [더 보기 >]  |
|                                                   |
|  [BookOpen] 이책방님이 '불편한 편의점'을 추가    |
|             2시간 전                              |
|                                                   |
|  [UserPlus] 박새싹님이 지독해에 합류             |
|             3시간 전                              |
|                                                   |
|  [Award] 김독서님이 '꾸준형' 배지 획득           |
|          어제                                     |
|                                                   |
+--------------------------------------------------+
```

#### 사용자 가치

> "커뮤니티의 활기를 느끼고, 지금 주목받는 책을 한눈에 확인할 수 있다"

---

## 4. 기술 검토 사항

| 항목 | 내용 | 참고 |
|------|------|------|
| 차트 라이브러리 | Recharts 또는 Chart.js | 독서 DNA 레이더 차트 |
| 무한 스크롤 | @tanstack/react-query + useInfiniteQuery | 피드, 멤버 목록 |
| 이미지 최적화 | next/image | 책 표지, 아바타 |
| 검색 Debounce | useDebouncedValue 훅 | 멤버 검색 |
| 캐싱 전략 | SWR revalidateOnFocus | 피드 새로고침 |

---

## 5. 전체 완료 검증 체크리스트

### 기능 검증

- [ ] 공유 책장에서 장르별 책 탐색 가능
- [ ] "나도 읽었어요" 클릭 시 읽은 멤버에 추가됨
- [ ] 책 상세에서 "이 책을 좋아하는 멤버" 표시
- [ ] 멤버 프로필에 독서 DNA 차트 표시
- [ ] 독서 스타일 자동 계산 및 표시
- [ ] 함께한 사람들 (자주 만난 멤버) 표시
- [ ] 공통으로 읽은 책 표시
- [ ] 멤버 디렉토리에서 이름 검색 동작
- [ ] 멤버 디렉토리에서 지역 필터 동작
- [ ] 멤버 디렉토리에서 취향 기반 필터 동작
- [ ] 홈 피드에 최근 활동이 표시됨
- [ ] 활동 발생 시 자동 피드 기록
- [ ] 이번 주 화제의 책이 동적으로 계산됨
- [ ] 화제의 책에 대표 인용구 표시

### 성능 검증

- [ ] 공유 책장 초기 로드 < 2초
- [ ] 멤버 디렉토리 검색 응답 < 500ms
- [ ] 피드 무한 스크롤 버벅임 없음
- [ ] 독서 DNA 차트 렌더링 < 1초

### 비즈니스 규칙 검증

- [ ] book_interactions는 (user_id, book_id, interaction_type) 유니크
- [ ] 공개 활동만 타인에게 표시
- [ ] 프로필 bio는 200자 제한

---

## 6. 애니메이션 요구사항

### 공유 책장

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 책 카드 목록 | Stagger 등장 | 100ms 딜레이 |
| 필터 토글 | Fade + Scale | 0.2초 |
| "나도 읽었어요" 버튼 | Heart Pop | scale 1 -> 1.2 -> 1 |

### 멤버 프로필

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 독서 DNA 차트 | 로딩 시 그려지기 | SVG stroke-dasharray |
| 함께한 사람들 아바타 | Stagger 등장 | 50ms 딜레이 |
| 취향 유사도 숫자 | Count Up | 0 -> 현재값 |

### 활동 피드

| UI 요소 | 애니메이션 | 구현 방식 |
|---------|----------|---------|
| 피드 아이템 | Slide In | 왼쪽에서 등장 |
| 새 피드 알림 | Bounce | 상단 배지 |
| 새로고침 | Pull-to-refresh | 로딩 스피너 |

---

## 7. 다음 단계 (M12 준비)

M11 완료 후 M12 시작 전 확인:

- [ ] 커뮤니티 건강 지표 데이터 소스 정의
- [ ] 운영자 카톡 템플릿 목록 준비
- [ ] 대시보드 재배치 와이어프레임 검토

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-26 | 1.0 | WP-M11 최초 작성 |
