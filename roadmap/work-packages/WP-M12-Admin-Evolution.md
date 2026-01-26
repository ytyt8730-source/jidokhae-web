# Work Package: M12 - Admin Evolution (운영 진화)

---

**문서 버전:** 1.0
**작성일:** 2026-01-26
**Milestone:** M12
**목표:** 관리자를 "큐레이터"로, 데이터 기반 커뮤니티 케어
**예상 기간:** 2주
**선행 조건:** M8 완료 (M9~M11과 병행 가능)
**핵심 가치:** 운영 품질, 효율

---

## 1. Work Package 개요

M12는 **2개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

**핵심 전환:**
```
[Before] 통계 중심 관리자 → [After] 관계 중심 큐레이터
[Before] 수동 체크 + 액션 → [After] 인사이트 + One-Click
[Before] 데이터 나열 → [After] 우선순위 기반 행동 유도
```

```
Phase 1: 커뮤니티 온도계 + 건강 지표
    |  [동작 확인: 온도 시각화 + 관심 필요 멤버 위젯]
Phase 2: One-Click Action + 대시보드 재배치
    |  [동작 확인: 카톡 연결 + 대시보드 레이아웃 변경]
```

---

## 2. Phase 상세

### Phase 12.1: 커뮤니티 온도계 + 건강 지표

**목표:** 커뮤니티 건강 상태를 한눈에 파악하고, 관심이 필요한 멤버를 식별

**예상 소요:** 4~5일

#### 작업 목록 (A: DB 스키마)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.1.1 | community_health_logs 테이블 생성 | SQL 마이그레이션 | 테이블 생성 |
| 12.1.2 | meetings 테이블 quote 필드 추가 | SQL 마이그레이션 | quote, quote_source 컬럼 |
| 12.1.3 | TypeScript 타입 업데이트 | `database.ts` | 타입 재생성 |

#### 작업 목록 (B: 커뮤니티 온도계)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.1.4 | 온도 계산 로직 구현 | `/lib/services/community-health.ts` | 종합 건강 점수 계산 |
| 12.1.5 | 온도계 컴포넌트 | `TemperatureGauge.tsx` | 37.5 형식 시각화 |
| 12.1.6 | 전월 대비 변화 표시 | UI | 상승/하락 표시 |
| 12.1.7 | 온도 기록 API | `/api/admin/health/route.ts` | 월별 기록 저장 |
| 12.1.8 | 온도 조회 API | `/api/admin/health/current/route.ts` | 현재 온도 조회 |

#### 작업 목록 (C: 건강 지표 위젯)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.1.9 | 관심 필요 멤버 위젯 | `AttentionNeededWidget.tsx` | 2회 연속 취소, 3일 무활동 |
| 12.1.10 | 떠오르는 샛별 위젯 | `RisingStarWidget.tsx` | 첫 모임 후 칭찬 3개+ |
| 12.1.11 | 휴면 위험 위젯 | `DormantRiskWidget.tsx` | 60일+ 미활동 |
| 12.1.12 | 기념일 위젯 | `MilestoneWidget.tsx` | 1주년, 100회 참여 등 |
| 12.1.13 | 건강 지표 쿼리 서비스 | `/lib/services/member-insights.ts` | 각 위젯 데이터 조회 |

#### 작업 목록 (D: 모임 생성 확장)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.1.14 | 모임 폼에 quote 필드 추가 | 모임 생성/수정 폼 | 선택 입력 |
| 12.1.15 | 모임 상세에 quote 표시 | 모임 상세 페이지 | 있을 때만 표시 |

#### DB 스키마 변경

```sql
-- 모임 한 문장 (optional)
ALTER TABLE meetings ADD COLUMN quote TEXT;
ALTER TABLE meetings ADD COLUMN quote_source TEXT;

-- 커뮤니티 건강 로그
CREATE TABLE community_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(7) NOT NULL,           -- '2026-01' 형식
  temperature DECIMAL(3,1),            -- 36.5~40.0 범위
  signup_rate DECIMAL(5,2),            -- 신청률 (%)
  attendance_rate DECIMAL(5,2),        -- 출석률 (%)
  praise_frequency DECIMAL(5,2),       -- 칭찬 빈도 (회/모임)
  active_members INTEGER,              -- 활성 멤버 수
  new_members INTEGER,                 -- 신규 가입 수
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month)
);

-- RLS 정책
ALTER TABLE community_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view health logs"
  ON community_health_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert health logs"
  ON community_health_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### 온도 계산 로직

```typescript
// /lib/services/community-health.ts

interface HealthMetrics {
  signupRate: number;      // 정원 대비 신청률 (0~100)
  attendanceRate: number;  // 확정 대비 실제 참석률 (0~100)
  praiseFrequency: number; // 모임당 평균 칭찬 수
  retentionRate: number;   // 재참여율 (0~100)
}

export function calculateTemperature(metrics: HealthMetrics): number {
  // 기본 체온: 36.5
  const baseTemp = 36.5;

  // 각 지표가 건강 상태에 기여 (최대 +3.5도)
  const signupContrib = (metrics.signupRate / 100) * 1.0;       // max +1.0
  const attendanceContrib = (metrics.attendanceRate / 100) * 1.0; // max +1.0
  const praiseContrib = Math.min(metrics.praiseFrequency / 5, 1) * 0.75; // max +0.75
  const retentionContrib = (metrics.retentionRate / 100) * 0.75; // max +0.75

  const temperature = baseTemp + signupContrib + attendanceContrib + praiseContrib + retentionContrib;

  // 36.0 ~ 40.0 범위로 제한
  return Math.min(Math.max(temperature, 36.0), 40.0);
}

export function getTemperatureStatus(temp: number): {
  status: 'cold' | 'cool' | 'healthy' | 'warm' | 'hot';
  message: string;
  color: string;
} {
  if (temp < 36.5) return { status: 'cold', message: '관심이 필요해요', color: 'text-blue-500' };
  if (temp < 37.0) return { status: 'cool', message: '조금 더 힘내봐요', color: 'text-cyan-500' };
  if (temp < 38.0) return { status: 'healthy', message: '건강한 상태예요', color: 'text-green-500' };
  if (temp < 39.0) return { status: 'warm', message: '아주 활발해요', color: 'text-orange-500' };
  return { status: 'hot', message: '열정이 넘쳐요', color: 'text-red-500' };
}
```

#### 온도계 컴포넌트

```tsx
// /components/admin/TemperatureGauge.tsx
'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TemperatureGaugeProps {
  temperature: number;
  previousTemperature?: number;
  status: string;
  color: string;
}

export function TemperatureGauge({
  temperature,
  previousTemperature,
  status,
  color
}: TemperatureGaugeProps) {
  const change = previousTemperature
    ? temperature - previousTemperature
    : 0;

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">커뮤니티 온도</h3>
        {previousTemperature && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(change).toFixed(1)}</span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <span className={`text-5xl font-bold ${color}`}>
          {temperature.toFixed(1)}
        </span>
        <span className="text-2xl text-gray-400 ml-1">C</span>
      </motion.div>

      <p className={`text-center mt-2 text-sm ${color}`}>
        {status}
      </p>
    </div>
  );
}
```

#### 건강 지표 위젯 (관심 필요 멤버)

```tsx
// /components/admin/AttentionNeededWidget.tsx
'use client';

import { User, MessageCircle } from 'lucide-react';

interface AttentionMember {
  id: string;
  name: string;
  reason: 'consecutive_cancel' | 'inactive' | 'first_meeting_no_praise';
  lastActivity?: string;
  phone?: string;
}

interface AttentionNeededWidgetProps {
  members: AttentionMember[];
  onContactClick: (member: AttentionMember, template: string) => void;
}

const REASON_LABELS = {
  consecutive_cancel: '2회 연속 취소',
  inactive: '3일 이상 미활동',
  first_meeting_no_praise: '첫 모임 후 칭찬 없음',
};

export function AttentionNeededWidget({ members, onContactClick }: AttentionNeededWidgetProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">관심 필요</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {members.length}명
        </span>
      </div>

      <div className="space-y-3">
        {members.slice(0, 5).map((member) => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{REASON_LABELS[member.reason]}</p>
              </div>
            </div>
            <button
              onClick={() => onContactClick(member, 'concern')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="안부 묻기"
            >
              <MessageCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            지금은 모두 잘 지내고 있어요
          </p>
        )}
      </div>
    </div>
  );
}
```

#### Scenario (검증 기준)

**SC-M12-001: 커뮤니티 온도 표시**
- Given: 관리자가 로그인한 상태
- When: 대시보드에 접근
- Then: 커뮤니티 온도가 37.5C 형식으로 표시되고, 전월 대비 변화가 함께 표시됨

**SC-M12-002: 관심 필요 멤버 표시**
- Given: 2회 연속 취소한 멤버가 있음
- When: 대시보드 건강 지표 위젯 확인
- Then: 해당 멤버가 "관심 필요" 위젯에 표시됨

**SC-M12-003: 모임 한 문장 입력**
- Given: 관리자가 모임 생성 화면에 있음
- When: quote 필드에 "삶을 변화시키는 한 권의 책"을 입력
- Then: 저장 후 모임 상세에서 해당 문장이 표시됨

**SC-M12-004: 비운영자 대시보드 접근 차단**
- Given: 일반 회원(role: 'member')이 로그인한 상태
- When: /admin/dashboard URL로 직접 접근 시도
- Then:
  - 접근이 차단됨
  - "권한이 없습니다" 메시지와 함께 홈으로 리다이렉트
  - 관리자 대시보드 컨텐츠가 노출되지 않음

#### 완료 검증

- [ ] community_health_logs 테이블 생성됨
- [ ] meetings 테이블에 quote, quote_source 컬럼 추가됨
- [ ] 커뮤니티 온도가 숫자(37.5C)로 표시됨
- [ ] 전월 대비 온도 변화(상승/하락) 표시됨
- [ ] 관심 필요 멤버 위젯에 해당 멤버 표시됨
- [ ] 떠오르는 샛별 위젯에 신규 활발 멤버 표시됨
- [ ] 휴면 위험 위젯에 60일+ 미활동 멤버 표시됨
- [ ] 기념일 위젯에 1주년/100회 참여 멤버 표시됨
- [ ] 모임 생성 시 quote 입력 가능

#### 사용자 가치 (운영자)

> "운영자가 커뮤니티 건강 상태를 한눈에 파악하고, 관심이 필요한 멤버를 즉시 식별할 수 있다"

---

### Phase 12.2: One-Click Action + 대시보드 재배치

**목표:** 인사이트에서 바로 행동으로 연결, 대시보드 레이아웃 최적화

**예상 소요:** 3~4일

#### 작업 목록 (A: One-Click Action)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.2.1 | 카톡 템플릿 정의 | `/lib/constants/kakao-templates.ts` | 안부/축하 템플릿 |
| 12.2.2 | 카톡 연결 유틸 | `/lib/utils/kakao-link.ts` | 딥링크 생성 |
| 12.2.3 | One-Click 버튼 컴포넌트 | `OneClickAction.tsx` | 안부/축하 버튼 |
| 12.2.4 | 위젯 → 카톡 연결 | 위젯 수정 | 클릭 시 카톡 열림 |
| 12.2.5 | 템플릿 치환 로직 | 유틸 함수 | 이름/날짜 등 변수 |

#### 작업 목록 (B: 대시보드 재배치)

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 12.2.6 | "지금 해야 할 일" 섹션 | `TodoSection.tsx` | 최상단 배치 |
| 12.2.7 | 모임 현황 섹션 | 기존 컴포넌트 재배치 | 중단 배치 |
| 12.2.8 | 통계 섹션 | 기존 컴포넌트 재배치 | 하단 배치 |
| 12.2.9 | 대시보드 레이아웃 수정 | `/app/admin/dashboard/page.tsx` | 새 구조 적용 |
| 12.2.10 | 반응형 레이아웃 | CSS/Tailwind | 모바일 최적화 |

#### 카톡 템플릿

```typescript
// /lib/constants/kakao-templates.ts
export const KAKAO_TEMPLATES = {
  concern: {
    id: 'concern',
    name: '안부 묻기',
    template: `안녕하세요 {name}님,

지독해 운영진이에요.
요즘 어떻게 지내고 계신지 궁금해서 연락드려요.

혹시 바쁘시거나 불편한 점이 있으셨다면
편하게 말씀해 주세요.

언제든 다시 만나뵐 수 있기를 바랍니다.`,
  },
  congratulation: {
    id: 'congratulation',
    name: '축하하기',
    template: `{name}님, 축하드려요!

지독해와 함께한 {milestone}을 진심으로 축하합니다.

앞으로도 함께 좋은 책을 읽어가요.
감사합니다.`,
  },
  welcome: {
    id: 'welcome',
    name: '환영하기',
    template: `{name}님, 환영합니다!

지독해 첫 모임에서 뵙게 되어 기쁩니다.
{meetingName}에서 좋은 시간 보내셨길 바랍니다.

다음 모임에서 또 만나요!`,
  },
} as const;

export type KakaoTemplateId = keyof typeof KAKAO_TEMPLATES;
```

#### 카톡 연결 유틸

```typescript
// /lib/utils/kakao-link.ts

interface KakaoLinkParams {
  phoneNumber: string;
  message: string;
}

export function generateKakaoDeepLink({ phoneNumber, message }: KakaoLinkParams): string {
  // 카카오톡 1:1 채팅 딥링크
  const encodedMessage = encodeURIComponent(message);

  // 모바일 환경 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // 카카오톡 앱 딥링크
    return `kakaoplus://plusfriend/chat/send?phone=${phoneNumber}&text=${encodedMessage}`;
  }

  // 웹 fallback (SMS)
  return `sms:${phoneNumber}?body=${encodedMessage}`;
}

export function substituteTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}
```

#### One-Click 버튼 컴포넌트

```tsx
// /components/admin/OneClickAction.tsx
'use client';

import { MessageCircle, PartyPopper, Sparkles } from 'lucide-react';
import { KAKAO_TEMPLATES, KakaoTemplateId } from '@/lib/constants/kakao-templates';
import { generateKakaoDeepLink, substituteTemplate } from '@/lib/utils/kakao-link';

interface OneClickActionProps {
  templateId: KakaoTemplateId;
  recipientName: string;
  phoneNumber: string;
  variables?: Record<string, string>;
}

const ICONS = {
  concern: MessageCircle,
  congratulation: PartyPopper,
  welcome: Sparkles,
};

const COLORS = {
  concern: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  congratulation: 'bg-green-50 text-green-600 hover:bg-green-100',
  welcome: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
};

export function OneClickAction({
  templateId,
  recipientName,
  phoneNumber,
  variables = {},
}: OneClickActionProps) {
  const template = KAKAO_TEMPLATES[templateId];
  const Icon = ICONS[templateId];

  const handleClick = () => {
    const allVariables = { name: recipientName, ...variables };
    const message = substituteTemplate(template.template, allVariables);
    const link = generateKakaoDeepLink({ phoneNumber, message });
    window.open(link, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${COLORS[templateId]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{template.name}</span>
    </button>
  );
}
```

#### 대시보드 레이아웃 (재배치)

```
+-----------------------------------------------------------+
|                    Admin Dashboard                         |
+-----------------------------------------------------------+
|                                                            |
|  [지금 해야 할 일] -------------------------------- TOP     |
|  +---------------+ +---------------+ +---------------+    |
|  | 관심 필요    | | 입금대기      | | 문의 미답변   |    |
|  | 3명 [보기]   | | 2건 [확인]    | | 1건 [답변]    |    |
|  +---------------+ +---------------+ +---------------+    |
|                                                            |
|  [커뮤니티 상태] --------------------------------- MID-TOP  |
|  +-------------------------+ +-------------------------+  |
|  | 커뮤니티 온도           | | 이번 달 하이라이트      |  |
|  |        37.5C            | | 떠오르는 샛별: 김철수   |  |
|  |    건강한 상태예요      | | 기념일: 박영희 1주년    |  |
|  +-------------------------+ +-------------------------+  |
|                                                            |
|  [모임 현황] ------------------------------------ MIDDLE   |
|  +-------------------------------------------------------+|
|  | 모임명           | 일시        | 참가  | 상태         ||
|  | 경주 정기모임    | 1/27 14:00  | 12/14 | 모집중       ||
|  | 포항 토론모임    | 2/3 14:00   | 14/14 | 마감         ||
|  +-------------------------------------------------------+|
|                                                            |
|  [통계] ---------------------------------------- BOTTOM    |
|  +---------------+ +---------------+ +---------------+    |
|  | 이번 달 참가   | | 이번 달 수입 | | 재참여율      |    |
|  | 42건 (+5)     | | 420,000콩   | | 68%           |    |
|  +---------------+ +---------------+ +---------------+    |
|                                                            |
+-----------------------------------------------------------+
```

#### Scenario (검증 기준)

**SC-M12-005: 관심 필요 멤버 카톡 연결**
- Given: "관심 필요" 위젯에 김철수님이 표시됨
- When: 김철수님 옆 메시지 아이콘 클릭
- Then: 카카오톡이 열리고 안부 메시지 템플릿이 자동 입력됨

**SC-M12-006: 떠오르는 샛별 축하 연결**
- Given: "떠오르는 샛별" 위젯에 박영희님이 표시됨
- When: 박영희님 옆 축하 버튼 클릭
- Then: 카카오톡이 열리고 축하 메시지 템플릿이 자동 입력됨

**SC-M12-007: 전화번호 없는 멤버 카톡 연결 시도**
- Given: 전화번호가 등록되지 않은 멤버가 위젯에 표시됨
- When: 해당 멤버의 메시지 아이콘 클릭
- Then:
  - 카카오톡이 열리지 않음
  - "연락처가 등록되지 않은 멤버입니다" 토스트 메시지 표시
  - 멤버 프로필로 이동 제안 (연락처 확인 유도)

**SC-M12-008: 대시보드 레이아웃 확인**
- Given: 관리자가 대시보드에 접근
- When: 페이지 로드 완료
- Then: "지금 해야 할 일"이 최상단에, 통계가 하단에 배치됨

#### 완료 검증

- [ ] 관심 필요 멤버 클릭 시 카톡 템플릿 연결됨
- [ ] 떠오르는 샛별 클릭 시 축하 템플릿 연결됨
- [ ] 기념일 멤버 클릭 시 축하 템플릿 연결됨
- [ ] 대시보드 최상단에 "지금 해야 할 일" 섹션 표시됨
- [ ] 모임 현황이 중단에 배치됨
- [ ] 통계가 하단에 배치됨
- [ ] 모바일에서 레이아웃이 깨지지 않음

#### 사용자 가치 (운영자)

> "운영자가 인사이트를 확인하고 One-Click으로 즉시 행동할 수 있다"

---

## 3. 기술 검토 사항

| 항목 | 내용 | 참고 |
|------|------|------|
| 온도 계산 | 신청률/출석률/칭찬빈도/재참여율 기반 | 가중치 조정 가능 |
| 건강 지표 쿼리 | 실시간 vs 배치 처리 | 초기에는 실시간, 데이터 증가 시 캐싱 |
| 카톡 딥링크 | kakaoplus:// 스킴 | 모바일만 지원 |
| SMS fallback | sms: 스킴 | 데스크톱 환경 |
| RLS 정책 | admin/super_admin만 접근 | 기존 정책 활용 |

---

## 4. 파일 구조

```
/lib
├── constants/
│   └── kakao-templates.ts    # 카톡 메시지 템플릿
├── services/
│   ├── community-health.ts   # 온도 계산 로직
│   └── member-insights.ts    # 건강 지표 쿼리
└── utils/
    └── kakao-link.ts         # 카톡 딥링크 생성

/components/admin
├── TemperatureGauge.tsx      # 온도계 컴포넌트
├── AttentionNeededWidget.tsx # 관심 필요 위젯
├── RisingStarWidget.tsx      # 떠오르는 샛별 위젯
├── DormantRiskWidget.tsx     # 휴면 위험 위젯
├── MilestoneWidget.tsx       # 기념일 위젯
├── OneClickAction.tsx        # One-Click 버튼
└── TodoSection.tsx           # 지금 해야 할 일 섹션

/app/admin/dashboard
└── page.tsx                  # 대시보드 (재배치)

/app/api/admin/health
├── route.ts                  # 건강 기록 저장
└── current/route.ts          # 현재 온도 조회

/supabase
└── migrations/
    └── m12-admin-evolution.sql  # 스키마 변경
```

---

## 5. 검증 체크리스트

### Phase 12.1 완료 조건
- [ ] community_health_logs 테이블 생성
- [ ] meetings 테이블 quote 필드 추가
- [ ] 커뮤니티 온도 표시 (37.5C 형식)
- [ ] 전월 대비 변화 표시
- [ ] 건강 지표 위젯 4종 동작
- [ ] 모임 생성 시 quote 입력 가능

### Phase 12.2 완료 조건
- [ ] 카톡 템플릿 3종 정의
- [ ] One-Click 버튼 동작
- [ ] 위젯 → 카톡 연결
- [ ] 대시보드 레이아웃 재배치 완료
- [ ] 반응형 레이아웃 동작

---

## 6. 의존성

```
[M8 완료]
    |
[Phase 12.1] 커뮤니티 온도계 + 건강 지표
    |
[Phase 12.2] One-Click Action + 대시보드 재배치
    |
[M12 완료] -> 큐레이터 허브 완성
    (M9~M11과 병행 가능)
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
| 2026-01-26 | 1.0 | 최초 작성 |
