# Work Package: M17 - Settings Management (설정 관리)

---

**문서 버전:** 1.1
**작성일:** 2026-01-28
**Milestone:** M17
**목표:** 하드코딩된 운영 파라미터를 코드 배포 없이 변경 가능하게 구축
**예상 기간:** 1.5~2주
**선행 조건:** M13 완료 (app_settings 테이블 기반)
**핵심 가치:** 운영 유연성, 배포 부담 감소

---

## 1. Work Package 개요

M17은 **4개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

**핵심 전환:**
```
[Before] 하드코딩된 운영 상수 -> [After] DB 기반 설정 + 관리 UI
[Before] 사용자 콘텐츠 방치 -> [After] 모니터링 + 큐레이션
[Before] 수동 배지 관리 불가 -> [After] 배지 정의/발급/회수 관리
```

```
Phase 1: 시스템 설정 관리
    |  [동작 확인: 운영 상수들을 DB에서 읽고 관리 페이지에서 수정 가능]
    v
Phase 2: 칭찬 & 배지 관리
    |  [동작 확인: 칭찬 문구 수정, 배지 정의 수정, 수동 발급/회수]
    v
Phase 3: 사용자 콘텐츠 관리
    |  [동작 확인: 후기/책장/칭찬 목록 조회 + 조치 가능]
    v
Phase 4: 대기자 & 링크 관리
    |  [동작 확인: 대기자 우선순위 조정, 외부 링크 관리]
```

---

## 2. Phase 상세

### Phase 17.1: 시스템 설정 관리

**목표:** 하드코딩된 운영 상수를 DB 기반으로 전환하고 관리 UI 제공

**예상 소요:** 4~5일

#### 작업 목록 (A: DB 스키마)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.1.1 | system_settings 테이블 생성 | SQL 마이그레이션 | 테이블 생성 + RLS |
| 17.1.2 | 기본 설정값 시딩 | seed.sql | 초기값 INSERT |
| 17.1.3 | TypeScript 타입 업데이트 | `database.ts` | 타입 재생성 |

#### 작업 목록 (B: API 및 서비스)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.1.4 | 설정 조회 서비스 | `/lib/services/settings.ts` | getSettings() 함수 |
| 17.1.5 | 설정 캐싱 레이어 | 동일 파일 | 1분 캐시 적용 |
| 17.1.6 | 설정 조회 API | `/api/admin/settings/route.ts` | GET |
| 17.1.7 | 설정 수정 API | 동일 파일 | PATCH |

#### 작업 목록 (C: 관리 UI)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.1.8 | 설정 관리 페이지 | `/app/admin/settings/page.tsx` | SSR 페이지 |
| 17.1.9 | 설정 카테고리별 UI | 섹션 컴포넌트 | 운영/시간/자격 탭 |
| 17.1.10 | 설정 수정 폼 | 클라이언트 컴포넌트 | 실시간 저장 |
| 17.1.11 | 변경 이력 로깅 | settings_change_logs 테이블 | 감사 로그 |

#### 작업 목록 (D: 기존 코드 마이그레이션)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.1.12 | 마감임박 기준 마이그레이션 | 기존 코드 수정 | 3명 -> DB 조회 |
| 17.1.13 | 입금 기한 마이그레이션 | 기존 코드 수정 | 24시간 -> DB 조회 |
| 17.1.14 | 대기자 응답시간 마이그레이션 | 기존 코드 수정 | 24h/6h/2h -> DB 조회 |
| 17.1.15 | 자격 유지 기간 마이그레이션 | 기존 코드 수정 | 6개월 -> DB 조회 |
| 17.1.16 | 모임 진행 시간표 마이그레이션 | 기존 코드 수정 | 60분/10분/50분 -> DB 조회 |

#### DB 스키마 변경

```sql
-- 시스템 설정 테이블
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(category, key)
);

-- 설정 변경 이력
CREATE TABLE settings_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID REFERENCES system_settings(id),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_settings_change_logs_setting ON settings_change_logs(setting_id);

-- RLS 정책
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON system_settings FOR SELECT USING (true);

CREATE POLICY "Admin can update settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can view change logs"
  ON settings_change_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### 초기 설정값

```sql
-- 운영 설정
INSERT INTO system_settings (category, key, value, description) VALUES
  ('operation', 'closing_soon_threshold', '3', '마감임박 표시 기준 (남은 자리 수)'),
  ('operation', 'deposit_deadline_hours', '24', '계좌이체 입금 기한 (시간)'),
  ('operation', 'kakao_openchat_link', '"https://open.kakao.com/..."', '카카오 오픈채팅 링크');

-- 대기자 설정
INSERT INTO system_settings (category, key, value, description) VALUES
  ('waitlist', 'response_time_first', '24', '첫 번째 대기자 응답 시간 (시간)'),
  ('waitlist', 'response_time_second', '6', '두 번째 대기자 응답 시간 (시간)'),
  ('waitlist', 'response_time_third', '2', '세 번째 대기자 응답 시간 (시간)');

-- 자격 설정
INSERT INTO system_settings (category, key, value, description) VALUES
  ('eligibility', 'regular_meeting_retention_months', '6', '정기모임 자격 유지 기간 (개월)');

-- 모임 진행 설정
INSERT INTO system_settings (category, key, value, description) VALUES
  ('meeting', 'intro_duration_minutes', '60', '책 소개 시간 (분)'),
  ('meeting', 'break_duration_minutes', '10', '쉬는 시간 (분)'),
  ('meeting', 'discussion_duration_minutes', '50', '토론 시간 (분)');
```

#### 설정 서비스 구현

```typescript
// /lib/services/settings.ts
import { createClient } from '@/lib/supabase/server';

interface SystemSettings {
  operation: {
    closingSoonThreshold: number;
    depositDeadlineHours: number;
    kakaoOpenchatLink: string;
  };
  waitlist: {
    responseTimeFirst: number;
    responseTimeSecond: number;
    responseTimeThird: number;
  };
  eligibility: {
    regularMeetingRetentionMonths: number;
  };
  meeting: {
    introDurationMinutes: number;
    breakDurationMinutes: number;
    discussionDurationMinutes: number;
  };
}

// 캐시 (1분)
let settingsCache: SystemSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000;

export async function getSettings(): Promise<SystemSettings> {
  const now = Date.now();

  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('category, key, value');

  const settings = transformToSettings(data);
  settingsCache = settings;
  cacheTimestamp = now;

  return settings;
}

export async function updateSetting(
  category: string,
  key: string,
  value: unknown,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // 기존 값 조회
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id, value')
    .eq('category', category)
    .eq('key', key)
    .single();

  // 변경 이력 저장
  if (existing) {
    await supabase.from('settings_change_logs').insert({
      setting_id: existing.id,
      old_value: existing.value,
      new_value: value,
      changed_by: userId,
    });
  }

  // 설정 업데이트
  await supabase
    .from('system_settings')
    .update({ value, updated_at: new Date().toISOString(), updated_by: userId })
    .eq('category', category)
    .eq('key', key);

  // 캐시 무효화
  settingsCache = null;
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
}
```

#### Scenario (검증 기준)

**SC-M13-001: 설정 조회 (Critical)**
- Given: 관리자가 로그인한 상태
- When: /admin/settings 페이지 접근
- Then: 모든 운영 설정이 카테고리별로 표시됨

**SC-M13-002: 설정 수정 (Critical)**
- Given: 설정 관리 페이지에서 "마감임박 기준"이 3으로 표시
- When: 값을 5로 변경하고 저장
- Then:
  - 설정값이 5로 변경됨
  - 변경 이력에 기록됨
  - 모임 카드에서 5명 이하일 때 "마감임박" 표시

**SC-M13-003: 설정 캐시 동작 (High)**
- Given: 설정이 캐시된 상태
- When: 1분 이내 동일 설정 조회
- Then: DB 쿼리 없이 캐시에서 반환

**SC-M13-004: 비관리자 설정 수정 차단 (Critical)**
- Given: 일반 회원(role: 'member')이 로그인한 상태
- When: 설정 수정 API 직접 호출
- Then: 403 Forbidden 에러 반환

**SC-M13-005: 설정 변경 이력 조회 (High)**
- Given: 설정이 여러 번 변경됨
- When: 특정 설정의 변경 이력 조회
- Then: 변경 일시, 변경자, 이전값/새값 목록 표시

#### 완료 검증

- [ ] system_settings 테이블 생성됨
- [ ] settings_change_logs 테이블 생성됨
- [ ] 초기 설정값 시딩 완료
- [ ] 설정 관리 페이지에서 모든 카테고리 표시
- [ ] 설정 수정 시 즉시 반영됨
- [ ] 변경 이력이 기록됨
- [ ] 기존 하드코딩된 값들이 DB 조회로 변경됨

#### 사용자 가치 (운영자)

> "운영자가 코드 수정 없이 운영 정책을 즉시 변경할 수 있다"

---

### Phase 17.2: 칭찬 & 배지 관리

**목표:** 칭찬 문구와 배지 정의를 DB 기반으로 관리, 수동 발급/회수 기능 제공

**예상 소요:** 4~5일

#### 작업 목록 (A: DB 스키마)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.2.1 | praise_phrases 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 17.2.2 | badge_definitions 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 17.2.3 | 기존 데이터 마이그레이션 | seed.sql | 하드코딩 -> DB |
| 17.2.4 | TypeScript 타입 업데이트 | `database.ts` | 타입 재생성 |

#### 작업 목록 (B: 칭찬 문구 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.2.5 | 칭찬 문구 조회 API | `/api/admin/praise-phrases/route.ts` | GET |
| 17.2.6 | 칭찬 문구 수정 API | 동일 파일 | PATCH |
| 17.2.7 | 칭찬 문구 추가/삭제 API | 동일 파일 | POST/DELETE |
| 17.2.8 | 칭찬 문구 관리 페이지 | `/app/admin/content/praise/page.tsx` | 관리 UI |
| 17.2.9 | 기존 칭찬하기 코드 수정 | 칭찬 컴포넌트 | 하드코딩 -> DB 조회 |

#### 작업 목록 (C: 배지 정의 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.2.10 | 배지 정의 조회 API | `/api/admin/badge-definitions/route.ts` | GET |
| 17.2.11 | 배지 정의 수정 API | 동일 파일 | PATCH |
| 17.2.12 | 배지 정의 추가/삭제 API | 동일 파일 | POST/DELETE |
| 17.2.13 | 배지 정의 관리 페이지 | `/app/admin/content/badges/page.tsx` | 관리 UI |
| 17.2.14 | 기존 배지 코드 수정 | 배지 컴포넌트 | 하드코딩 -> DB 조회 |

#### 작업 목록 (D: 수동 발급/회수)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.2.15 | 배지 수동 발급 API | `/api/admin/user-badges/route.ts` | POST |
| 17.2.16 | 배지 회수 API | 동일 파일 | DELETE |
| 17.2.17 | 회원별 배지 관리 UI | 회원 상세 페이지 | 발급/회수 버튼 |
| 17.2.18 | 배지 발급 이력 로깅 | badge_action_logs 테이블 | 감사 로그 |

#### DB 스키마 변경

```sql
-- 칭찬 문구 테이블
CREATE TABLE praise_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_key VARCHAR(50) NOT NULL UNIQUE,
  phrase_text TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  icon_color VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 배지 정의 테이블
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  condition_type VARCHAR(50) NOT NULL,
  -- condition_type: 'participation_count', 'consecutive_weeks', 'praise_count', 'manual'
  condition_value INTEGER,
  -- condition_value: 참여 10회, 연속 4주, 칭찬 30개 등
  is_auto BOOLEAN DEFAULT true,
  -- is_auto: true면 자동 발급, false면 수동만
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 배지 발급/회수 이력
CREATE TABLE badge_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_badge_id UUID,
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badge_definitions(id),
  action_type VARCHAR(20) NOT NULL,
  -- action_type: 'auto_grant', 'manual_grant', 'revoke'
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_praise_phrases_order ON praise_phrases(display_order);
CREATE INDEX idx_badge_definitions_order ON badge_definitions(display_order);
CREATE INDEX idx_badge_action_logs_user ON badge_action_logs(user_id);

-- RLS 정책
ALTER TABLE praise_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active praise phrases"
  ON praise_phrases FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage praise phrases"
  ON praise_phrases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read active badge definitions"
  ON badge_definitions FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage badge definitions"
  ON badge_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can view badge action logs"
  ON badge_action_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### 초기 데이터 마이그레이션

```sql
-- 칭찬 문구 (기존 lib/praise.ts에서 이관)
INSERT INTO praise_phrases (phrase_key, phrase_text, icon_name, icon_color, display_order) VALUES
  ('grateful', '덕분에 좋은 시간이었어요', 'Heart', 'text-rose-500', 1),
  ('impressive', '이야기가 인상 깊었어요', 'Sparkles', 'text-amber-500', 2),
  ('warm', '따뜻한 분위기를 만들어주셨어요', 'Sun', 'text-orange-500', 3),
  ('insight', '새로운 관점을 얻었어요', 'Lightbulb', 'text-yellow-500', 4),
  ('together', '다음에도 함께하고 싶어요', 'Users', 'text-brand-500', 5);

-- 배지 정의 (기존 lib/badges-client.ts에서 이관)
INSERT INTO badge_definitions (badge_key, name, description, icon_name, condition_type, condition_value, is_auto, display_order) VALUES
  ('first_meeting', '첫 걸음', '지독해 첫 모임 참여', 'Footprints', 'participation_count', 1, true, 1),
  ('steady_reader', '꾸준한 독서가', '10회 모임 참여', 'BookOpen', 'participation_count', 10, true, 2),
  ('consistent', '한결같은', '4주 연속 참여', 'Calendar', 'consecutive_weeks', 4, true, 3),
  ('warmth', '따뜻한 마음', '칭찬 10개 수신', 'Heart', 'praise_count', 10, true, 4),
  ('beloved', '사랑받는 멤버', '칭찬 30개 수신', 'HeartHandshake', 'praise_count', 30, true, 5),
  ('star', '지독해의 별', '칭찬 50개 수신', 'Star', 'praise_count', 50, true, 6),
  ('anniversary_1y', '1주년', '지독해와 함께한 1년', 'Award', 'manual', NULL, false, 7),
  ('century', '100회 달성', '100회 참여 달성', 'Trophy', 'participation_count', 100, true, 8);
```

#### Scenario (검증 기준)

**SC-M13-006: 칭찬 문구 조회 (Critical)**
- Given: 칭찬하기 화면 진입
- When: 칭찬 문구 목록 로드
- Then: DB에 저장된 활성 칭찬 문구가 순서대로 표시됨

**SC-M13-007: 칭찬 문구 수정 (Critical)**
- Given: 관리자가 칭찬 문구 관리 페이지 접근
- When: "덕분에 좋은 시간이었어요"를 "함께해서 행복했어요"로 수정
- Then:
  - DB에 수정된 문구 저장
  - 다음 칭찬하기 화면에서 수정된 문구 표시

**SC-M13-008: 배지 수동 발급 (Critical)**
- Given: 관리자가 회원 상세 페이지에서 특정 회원 확인
- When: "1주년" 배지 수동 발급 버튼 클릭
- Then:
  - user_badges 테이블에 레코드 생성
  - badge_action_logs에 'manual_grant' 이력 기록
  - 해당 회원 프로필에 배지 즉시 표시

**SC-M13-009: 배지 회수 (High)**
- Given: 특정 회원이 "1주년" 배지를 보유 중
- When: 관리자가 회수 버튼 클릭 + 사유 입력
- Then:
  - user_badges 테이블에서 해당 레코드 삭제
  - badge_action_logs에 'revoke' 이력 + 사유 기록
  - 해당 회원 프로필에서 배지 제거

**SC-M13-010: 비활성 칭찬 문구 숨김 (High)**
- Given: 관리자가 특정 칭찬 문구의 is_active를 false로 변경
- When: 사용자가 칭찬하기 화면 접근
- Then: 해당 문구가 목록에 표시되지 않음

#### 완료 검증

- [ ] praise_phrases 테이블 생성 및 데이터 마이그레이션 완료
- [ ] badge_definitions 테이블 생성 및 데이터 마이그레이션 완료
- [ ] 칭찬하기 화면에서 DB 기반 문구 표시
- [ ] 배지 목록에서 DB 기반 정의 표시
- [ ] 관리자가 칭찬 문구 추가/수정/삭제 가능
- [ ] 관리자가 배지 정의 추가/수정/삭제 가능
- [ ] 관리자가 배지 수동 발급/회수 가능
- [ ] 모든 발급/회수 이력 기록됨

#### 사용자 가치 (운영자)

> "운영자가 칭찬 문구와 배지를 자유롭게 관리하고, 특별한 경우 수동으로 배지를 발급/회수할 수 있다"

---

### Phase 17.3: 사용자 콘텐츠 관리

**목표:** 후기, 칭찬, 책장 콘텐츠를 조회하고 필요시 조치할 수 있는 관리 화면 제공

**예상 소요:** 4~5일

#### 작업 목록 (A: 후기 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.3.1 | 후기 목록 조회 API | `/api/admin/reviews/route.ts` | GET (페이지네이션) |
| 17.3.2 | 후기 상태 변경 API | `/api/admin/reviews/[id]/route.ts` | PATCH |
| 17.3.3 | 후기 삭제 API | 동일 파일 | DELETE |
| 17.3.4 | 후기 관리 페이지 | `/app/admin/content/reviews/page.tsx` | 관리 UI |
| 17.3.5 | 랜딩 노출 선택 UI | 동일 페이지 | 체크박스 |
| 17.3.6 | reviews 테이블 확장 | SQL 마이그레이션 | is_featured 필드 추가 |

#### 작업 목록 (B: 칭찬 통계)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.3.7 | 칭찬 통계 API | `/api/admin/praises/stats/route.ts` | GET |
| 17.3.8 | 칭찬 목록 API | `/api/admin/praises/route.ts` | GET (페이지네이션) |
| 17.3.9 | 칭찬 통계 페이지 | `/app/admin/content/praises/page.tsx` | 통계 + 목록 |
| 17.3.10 | 문구별 사용 현황 차트 | 차트 컴포넌트 | 파이 차트 |
| 17.3.11 | 기간별 칭찬 추이 | 차트 컴포넌트 | 라인 차트 |

#### 작업 목록 (C: 책장 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.3.12 | 책장 목록 조회 API | `/api/admin/bookshelf/route.ts` | GET (페이지네이션) |
| 17.3.13 | 책 삭제 API | `/api/admin/bookshelf/[id]/route.ts` | DELETE |
| 17.3.14 | 책장 관리 페이지 | `/app/admin/content/bookshelf/page.tsx` | 관리 UI |
| 17.3.15 | 부적절 콘텐츠 신고 기능 | 신고 플래그 | 우선 검토 표시 |

#### DB 스키마 변경

```sql
-- reviews 테이블 확장
ALTER TABLE reviews ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN admin_notes TEXT;

-- bookshelf 테이블 확장
ALTER TABLE bookshelf ADD COLUMN is_reported BOOLEAN DEFAULT false;
ALTER TABLE bookshelf ADD COLUMN report_reason TEXT;
```

#### 후기 관리 UI

```
+--------------------------------------------------+
|  후기 관리                           [필터 v]    |
+--------------------------------------------------+
|                                                   |
|  전체: 234건 | 공개 동의: 180건 | 랜딩 노출: 12건 |
|                                                   |
+--------------------------------------------------+
|  [v] 공개 동의만 | [v] 랜딩 노출 가능             |
+--------------------------------------------------+
|                                                   |
|  +--------------------------------------------+  |
|  | [v] 랜딩 노출                               |  |
|  | 김독서 | 경주 정기모임 | 2026-01-20         |  |
|  | "매번 새로운 시각을 얻어갑니다. 덕분에..."   |  |
|  | [상세보기] [삭제]                           |  |
|  +--------------------------------------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  | [ ] 랜딩 노출                               |  |
|  | 박책방 | 포항 토론모임 | 2026-01-18         |  |
|  | "깊이 있는 토론이 인상적이었습니다..."       |  |
|  | [상세보기] [삭제]                           |  |
|  +--------------------------------------------+  |
|                                                   |
+--------------------------------------------------+
```

#### Scenario (검증 기준)

**SC-M13-011: 후기 목록 조회 (Critical)**
- Given: 관리자가 후기 관리 페이지 접근
- When: 페이지 로드
- Then: 전체 후기 목록이 최신순으로 표시됨

**SC-M13-012: 후기 랜딩 노출 설정 (Critical)**
- Given: 공개 동의된 후기 목록
- When: 특정 후기의 "랜딩 노출" 체크박스 선택
- Then:
  - is_featured = true로 업데이트
  - 랜딩 페이지 후기 섹션에 해당 후기 표시

**SC-M13-013: 후기 삭제 (High)**
- Given: 부적절한 내용의 후기 발견
- When: 삭제 버튼 클릭 + 확인
- Then:
  - 해당 후기 soft delete 또는 hard delete
  - 목록에서 제거됨

**SC-M13-014: 칭찬 통계 조회 (High)**
- Given: 관리자가 칭찬 통계 페이지 접근
- When: 페이지 로드
- Then:
  - 전체 칭찬 수 표시
  - 문구별 사용 비율 파이 차트 표시
  - 최근 30일 일별 칭찬 수 라인 차트 표시

**SC-M13-015: 책장 부적절 콘텐츠 삭제 (High)**
- Given: 부적절한 내용의 책 등록 발견
- When: 삭제 버튼 클릭 + 사유 입력
- Then:
  - 해당 책 삭제
  - 등록자에게 알림 발송 (선택)

#### 완료 검증

- [ ] 후기 목록 조회 + 필터 동작
- [ ] 후기 랜딩 노출 설정 가능
- [ ] 후기 삭제 가능
- [ ] 칭찬 통계 차트 표시
- [ ] 칭찬 목록 조회 + 필터 동작
- [ ] 책장 목록 조회 + 필터 동작
- [ ] 부적절 책 삭제 가능

#### 사용자 가치 (운영자)

> "운영자가 사용자 콘텐츠를 모니터링하고, 랜딩 페이지에 노출할 후기를 큐레이션할 수 있다"

---

### Phase 17.4: 대기자 & 링크 관리

**목표:** 대기자 우선순위 조정, 강제 취소, 외부 링크 관리 기능 제공

**예상 소요:** 3~4일

#### 작업 목록 (A: 대기자 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.4.1 | 대기자 목록 조회 API | `/api/admin/waitlist/route.ts` | GET (모임별) |
| 17.4.2 | 대기자 우선순위 변경 API | `/api/admin/waitlist/[id]/priority/route.ts` | PATCH |
| 17.4.3 | 대기자 강제 취소 API | `/api/admin/waitlist/[id]/route.ts` | DELETE |
| 17.4.4 | 대기자 관리 UI | 모임 상세 > 대기자 탭 | 우선순위 조정 |
| 17.4.5 | 드래그앤드롭 순서 변경 | UI 컴포넌트 | 직관적 조작 |

#### 작업 목록 (B: 외부 링크 관리)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 17.4.6 | external_links 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 17.4.7 | 외부 링크 조회/수정 API | `/api/admin/links/route.ts` | GET/PATCH |
| 17.4.8 | 외부 링크 관리 페이지 | `/app/admin/content/links/page.tsx` | 관리 UI |
| 17.4.9 | 기존 카카오 링크 마이그레이션 | 코드 수정 | 하드코딩 -> DB |

#### DB 스키마 변경

```sql
-- 외부 링크 테이블
CREATE TABLE external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_key VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO external_links (link_key, title, url, description, display_order) VALUES
  ('kakao_openchat', '카카오 오픈채팅', 'https://open.kakao.com/...', '지독해 공식 오픈채팅방', 1);

-- RLS 정책
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active links"
  ON external_links FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage links"
  ON external_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### 대기자 관리 UI

```
+--------------------------------------------------+
|  경주 정기모임 - 대기자 관리                        |
+--------------------------------------------------+
|                                                   |
|  현재 대기: 5명                                    |
|  다음 알림 대상: 김대기 (1순위)                    |
|                                                   |
+--------------------------------------------------+
|  # | 이름    | 등록일        | 상태    | 액션     |
+--------------------------------------------------+
|  1 | 김대기  | 01/20 14:30  | 대기중  | [x] [v]  |
|  2 | 이대기  | 01/20 15:00  | 대기중  | [x] [^]  |
|  3 | 박대기  | 01/21 10:00  | 대기중  | [x] [^]  |
|  ...                                              |
+--------------------------------------------------+
|  [^] 순위 올리기  [v] 순위 내리기  [x] 강제 취소   |
+--------------------------------------------------+
```

#### Scenario (검증 기준)

**SC-M13-016: 대기자 목록 조회 (Critical)**
- Given: 특정 모임에 5명의 대기자 존재
- When: 관리자가 해당 모임의 대기자 탭 접근
- Then: 대기자 목록이 우선순위 순으로 표시됨

**SC-M13-017: 대기자 우선순위 변경 (Critical)**
- Given: 대기자 목록에서 2순위 회원 확인
- When: 해당 회원의 "순위 올리기" 클릭
- Then:
  - 해당 회원이 1순위로 변경
  - 기존 1순위 회원은 2순위로 변경
  - 다음 자리 발생 시 변경된 1순위에게 알림

**SC-M13-018: 대기자 강제 취소 (High)**
- Given: 대기자 목록에서 특정 회원 확인
- When: "강제 취소" 버튼 클릭 + 확인
- Then:
  - 해당 대기자 레코드 삭제
  - 나머지 대기자 순위 자동 조정

**SC-M13-019: 외부 링크 수정 (High)**
- Given: 관리자가 외부 링크 관리 페이지 접근
- When: 카카오 오픈채팅 링크 URL 수정
- Then:
  - 새 URL로 저장됨
  - 서비스 내 모든 카카오 오픈채팅 버튼이 새 URL로 연결

**SC-M13-020: 새 외부 링크 추가 (Medium)**
- Given: 관리자가 외부 링크 관리 페이지 접근
- When: "인스타그램" 링크 추가
- Then:
  - 새 링크가 external_links 테이블에 저장됨
  - 관리 페이지 목록에 표시됨

#### 완료 검증

- [ ] 대기자 목록 조회 동작
- [ ] 대기자 우선순위 변경 동작 (드래그앤드롭 또는 버튼)
- [ ] 대기자 강제 취소 동작
- [ ] external_links 테이블 생성 및 초기 데이터 삽입
- [ ] 외부 링크 목록 조회 동작
- [ ] 외부 링크 추가/수정/삭제 동작
- [ ] 기존 하드코딩된 카카오 링크가 DB 조회로 변경됨

#### 사용자 가치 (운영자)

> "운영자가 대기자 순서를 유연하게 조정하고, 외부 링크를 코드 수정 없이 관리할 수 있다"

---

## 3. 기술 검토 사항

| 항목 | 내용 | 참고 |
|------|------|------|
| 설정 캐싱 | 1분 TTL 메모리 캐시 | 변경 시 즉시 무효화 |
| 차트 라이브러리 | Recharts 또는 Chart.js | 칭찬 통계 시각화 |
| 드래그앤드롭 | @dnd-kit/core | 대기자 순위 조정 |
| 감사 로그 | 모든 관리 행위 기록 | settings_change_logs, badge_action_logs |
| RLS 정책 | admin/super_admin만 관리 기능 | 기존 정책 활용 |

---

## 4. 파일 구조

```
/lib
├── services/
│   ├── settings.ts           # 시스템 설정 서비스
│   ├── praise-admin.ts       # 칭찬 관리 서비스
│   └── badge-admin.ts        # 배지 관리 서비스

/components/admin
├── settings/
│   ├── SettingsForm.tsx      # 설정 수정 폼
│   └── SettingsHistory.tsx   # 변경 이력
├── content/
│   ├── PhraseManager.tsx     # 칭찬 문구 관리
│   ├── BadgeManager.tsx      # 배지 정의 관리
│   ├── ReviewManager.tsx     # 후기 관리
│   ├── PraiseStats.tsx       # 칭찬 통계
│   └── BookshelfManager.tsx  # 책장 관리
└── waitlist/
    └── WaitlistManager.tsx   # 대기자 관리

/app/admin
├── settings/
│   └── page.tsx              # 시스템 설정 페이지
├── content/
│   ├── praise/
│   │   └── page.tsx          # 칭찬 문구 관리
│   ├── badges/
│   │   └── page.tsx          # 배지 정의 관리
│   ├── reviews/
│   │   └── page.tsx          # 후기 관리
│   ├── praises/
│   │   └── page.tsx          # 칭찬 통계
│   ├── bookshelf/
│   │   └── page.tsx          # 책장 관리
│   └── links/
│       └── page.tsx          # 외부 링크 관리

/app/api/admin
├── settings/
│   └── route.ts              # 설정 API
├── praise-phrases/
│   └── route.ts              # 칭찬 문구 API
├── badge-definitions/
│   └── route.ts              # 배지 정의 API
├── user-badges/
│   └── route.ts              # 배지 발급/회수 API
├── reviews/
│   ├── route.ts              # 후기 목록 API
│   └── [id]/
│       └── route.ts          # 후기 상세 API
├── praises/
│   ├── route.ts              # 칭찬 목록 API
│   └── stats/
│       └── route.ts          # 칭찬 통계 API
├── bookshelf/
│   ├── route.ts              # 책장 목록 API
│   └── [id]/
│       └── route.ts          # 책 상세 API
├── waitlist/
│   ├── route.ts              # 대기자 목록 API
│   └── [id]/
│       ├── route.ts          # 대기자 삭제 API
│       └── priority/
│           └── route.ts      # 우선순위 변경 API
└── links/
    └── route.ts              # 외부 링크 API

/supabase
└── migrations/
    └── m13-admin-content.sql # 스키마 변경
```

---

## 5. 검증 체크리스트

### Phase 13.1 완료 조건
- [ ] system_settings 테이블 생성
- [ ] settings_change_logs 테이블 생성
- [ ] 설정 관리 페이지 동작
- [ ] 설정 수정 시 변경 이력 기록
- [ ] 기존 하드코딩 값들이 DB 조회로 변경

### Phase 13.2 완료 조건
- [ ] praise_phrases 테이블 생성 및 데이터 이관
- [ ] badge_definitions 테이블 생성 및 데이터 이관
- [ ] 칭찬 문구 관리 페이지 동작
- [ ] 배지 정의 관리 페이지 동작
- [ ] 배지 수동 발급/회수 동작
- [ ] 발급/회수 이력 기록

### Phase 13.3 완료 조건
- [ ] 후기 관리 페이지 동작
- [ ] 후기 랜딩 노출 설정 동작
- [ ] 칭찬 통계 차트 표시
- [ ] 책장 관리 페이지 동작

### Phase 13.4 완료 조건
- [ ] 대기자 목록 조회 동작
- [ ] 대기자 우선순위 변경 동작
- [ ] 대기자 강제 취소 동작
- [ ] external_links 테이블 생성
- [ ] 외부 링크 관리 페이지 동작

---

## 6. 의존성

```
[M12 완료]
    |
[Phase 13.1] 시스템 설정 관리
    |
[Phase 13.2] 칭찬 & 배지 관리 (Phase 13.1과 병행 가능)
    |
[Phase 13.3] 사용자 콘텐츠 관리
    |
[Phase 13.4] 대기자 & 링크 관리
    |
[M13 완료] -> 운영 유연성 완성
```

---

## 7. 전체 완료 검증

- [ ] 모든 Phase 완료
- [ ] 모든 Scenario 통과
- [ ] TypeScript 에러 0개 (`npx tsc --noEmit`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] main 머지 완료

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | WP-M13 최초 작성 |
