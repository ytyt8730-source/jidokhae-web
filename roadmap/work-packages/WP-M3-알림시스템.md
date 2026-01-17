# Work Package: M3 - 알림 시스템

---

**Milestone:** M3  
**목표:** 회원이 모임을 잊지 않게, 자동 리마인드 시스템 구축  
**기간:** 1~2주  
**선행 조건:** M2 완료  
**핵심 가치:** 잊지 않게

---

## 1. Work Package 개요

M3는 **4개의 Phase**로 구성됩니다. 각 Phase가 끝나면 "동작하는" 소프트웨어 상태가 됩니다.

```
Phase 1: 알림 인프라 구축 (솔라피)
    ↓ [동작 확인: 테스트 알림톡 발송 성공]
Phase 2: 모임 리마인드 자동화
    ↓ [동작 확인: 3일 전 리마인드 자동 발송]
Phase 3: 대기자 알림 자동화
    ↓ [동작 확인: 취소 시 대기자에게 자동 알림]
Phase 4: 월말 독려 & 운영자 수동 발송
    ↓ [동작 확인: 월말 알림 + 운영자 수동 발송 가능]
```

---

## 2. Phase 상세

### Phase 1: 알림 인프라 구축 (솔라피)

**목표:** 솔라피 연동 완료, 테스트 알림톡 발송 성공

**예상 소요:** 1일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 1.1 | 솔라피 계정 생성 | API 키 | 계정 활성화 |
| 1.2 | 카카오 비즈니스 채널 연동 | 채널 연결 | 알림톡 발송 권한 |
| 1.3 | 알림톡 템플릿 등록 (카카오) | 템플릿 승인 | 최소 3개 템플릿 |
| 1.4 | 알림 서비스 추상화 레이어 | `/lib/notification/` | 인터페이스 정의 |
| 1.5 | 솔라피 어댑터 구현 | `/lib/notification/solapi.ts` | API 연동 |
| 1.6 | notification_logs 테이블 | SQL 마이그레이션 | 발송 기록 저장 |
| 1.7 | 테스트 알림 발송 | 테스트 API | 수동 테스트 성공 |

#### 알림 서비스 추상화

```typescript
// /lib/notification/types.ts
interface NotificationService {
  sendAlimtalk(params: AlimtalkParams): Promise<NotificationResult>;
  getTemplates(): Promise<Template[]>;
}

interface AlimtalkParams {
  templateId: string;
  phone: string;
  variables: Record<string, string>;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// /lib/notification/index.ts
export function getNotificationService(): NotificationService {
  // 현재: 솔라피
  // 추후: NHN Cloud 등으로 교체 가능
  return new SolapiAdapter();
}
```

#### notification_logs 테이블

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  meeting_id UUID REFERENCES meetings(id),
  template_id VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- reminder_3d, reminder_1d, waitlist, etc.
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending, sent, failed
  message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 알림톡 템플릿 (카카오 승인 필요)

**템플릿 1: 모임 리마인드 (3일 전)**
```
[지독해] #{모임명} 리마인드

안녕하세요, #{회원명}님!

#{날짜} #{시간}에 #{모임명}이 있어요.

📍 장소: #{장소}
💰 참가비: #{참가비}콩

모임에서 만나요! 📚
```

**템플릿 2: 대기자 자리 발생**
```
[지독해] 자리가 생겼어요!

안녕하세요, #{회원명}님!

대기 중이던 #{모임명}에 자리가 생겼어요.

#{응답시간} 내로 결제하시면 참여 확정됩니다.

[지금 신청하기]
```

**템플릿 3: 월말 참여 독려**
```
[지독해] #{회원명}님, 이번 달 모임은 어떠세요?

이번 달에 아직 신청한 모임이 없으시네요.

함께 책 읽는 시간, 지독해에서 만나요! 📚

[모임 보러가기]
```

#### 완료 검증

- [ ] 솔라피 API 연동 완료
- [ ] 카카오 알림톡 템플릿 승인 (최소 3개)
- [ ] 테스트 번호로 알림톡 발송 성공
- [ ] notification_logs에 발송 기록 저장

#### 사용자 가치

> 🎯 **"알림톡을 발송할 수 있는 인프라가 준비되었다"**

---

### Phase 2: 모임 리마인드 자동화

**목표:** 모임 3일 전, 1일 전, 당일 리마인드 자동 발송

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 2.1 | Vercel Cron 설정 | `vercel.json` | cron 스케줄 |
| 2.2 | 리마인드 대상 조회 함수 | `/lib/reminder.ts` | 3일/1일/당일 구분 |
| 2.3 | 리마인드 발송 Cron API | `/app/api/cron/reminder/route.ts` | 매일 실행 |
| 2.4 | 중복 발송 방지 | notification_logs 체크 | 같은 건 재발송 안 함 |
| 2.5 | 발송 시간 설정 | 오전 7~8시 | 시간대 고려 |
| 2.6 | 발송 결과 로깅 | 로그 저장 | 성공/실패 기록 |

#### Vercel Cron 설정

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reminder",
      "schedule": "0 22 * * *"  // 한국 시간 오전 7시 (UTC 22시)
    }
  ]
}
```

#### 리마인드 대상 조회 로직

```typescript
// /lib/reminder.ts
async function getReminderTargets(daysBeforeMeeting: number) {
  const targetDate = addDays(new Date(), daysBeforeMeeting);
  const startOfDay = startOfDayKST(targetDate);
  const endOfDay = endOfDayKST(targetDate);
  
  // 해당 날짜에 모임이 있고, confirmed 상태인 신청 조회
  const { data } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      users (name, phone),
      meeting_id,
      meetings (title, datetime, location, fee)
    `)
    .eq('status', 'confirmed')
    .gte('meetings.datetime', startOfDay.toISOString())
    .lt('meetings.datetime', endOfDay.toISOString());
  
  // 이미 발송한 건 제외
  const notSentTargets = await filterNotSent(data, daysBeforeMeeting);
  
  return notSentTargets;
}
```

#### 완료 검증

- [ ] 매일 오전 7시에 Cron 실행
- [ ] 모임 3일 전 대상자에게 리마인드 발송
- [ ] 모임 1일 전 대상자에게 리마인드 발송
- [ ] 모임 당일 대상자에게 리마인드 발송
- [ ] 같은 건에 대해 중복 발송 안 됨
- [ ] notification_logs에 발송 기록 저장

#### 사용자 가치

> 🎯 **"회원이 모임 전에 자동으로 알림을 받아 잊지 않고 참여할 수 있다"**

---

### Phase 3: 대기자 알림 자동화

**목표:** 취소 발생 시 대기자에게 자동 알림, 응답 대기 시간 관리

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 3.1 | 취소 시 대기자 알림 트리거 | 취소 API 수정 | 자동 알림 발송 |
| 3.2 | 응답 대기 시간 계산 | 로직 | 24h/6h/2h 구분 |
| 3.3 | 대기자 알림 발송 | 알림톡 | 템플릿 사용 |
| 3.4 | waitlists 상태 업데이트 | notified 상태 | 알림 발송 시각 기록 |
| 3.5 | 응답 기한 초과 체크 Cron | `/app/api/cron/waitlist/route.ts` | 매시간 실행 |
| 3.6 | 다음 대기자 알림 발송 | 순차 처리 | 기한 초과 시 다음 |

#### 응답 대기 시간 규칙

```typescript
function getResponseDeadline(meetingDate: Date): Date {
  const now = new Date();
  const daysUntilMeeting = differenceInDays(meetingDate, now);
  
  if (daysUntilMeeting > 3) {
    return addHours(now, 24); // 24시간
  } else if (daysUntilMeeting >= 1) {
    return addHours(now, 6);  // 6시간
  } else {
    return addHours(now, 2);  // 2시간
  }
}
```

#### 대기자 처리 흐름

```
취소 발생
    ↓
자리 확인 (current_participants < capacity)
    ↓ [자리 있음]
1순위 대기자 조회
    ↓
대기자에게 알림톡 발송
    ↓
waitlists 상태 업데이트 (notified, deadline 설정)
    ↓
[응답 기한 내 결제] → 신청 확정, waitlists 삭제
[응답 기한 초과] → 다음 대기자에게 알림, 해당 대기자 expired 처리
```

#### Cron 스케줄

```json
{
  "crons": [
    {
      "path": "/api/cron/waitlist",
      "schedule": "0 * * * *"  // 매시간
    }
  ]
}
```

#### 완료 검증

- [ ] 취소 발생 시 1순위 대기자에게 자동 알림
- [ ] 응답 대기 시간이 모임 임박도에 따라 다름 (24h/6h/2h)
- [ ] 응답 기한 초과 시 다음 대기자에게 자동 알림
- [ ] waitlists 상태가 정확히 업데이트됨

#### 사용자 가치

> 🎯 **"대기자가 자리가 생기면 자동으로 알림을 받고, 빠르게 신청할 수 있다"**

---

### Phase 4: 월말 독려 & 세그먼트별 알림 & 운영자 수동 발송

**목표:** 월말 참여 독려 알림, 세그먼트 기반 자동 리마인드, 운영자 수동 알림 발송 기능

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 4.1 | 월말 독려 대상 조회 | 로직 | 해당 월 미신청 회원 |
| 4.2 | 월말 독려 Cron | `/app/api/cron/monthly/route.ts` | 매월 25일 실행 |
| 4.3 | 세그먼트별 리마인드 Cron | `/app/api/cron/segment-reminder/route.ts` | 매일 실행 |
| 4.4 | 온보딩 이탈 위험 알림 | 로직 | 첫 참여 후 45일 경과, 두 번째 참여 없음 |
| 4.5 | 휴면 위험 알림 | 로직 | 마지막 참여 후 3개월 경과 |
| 4.6 | 자격 만료 임박 알림 | 로직 | 마지막 정기모임 참여 후 5개월 경과 |
| 4.7 | 리마인드 우선순위 적용 | 로직 | 중복 발송 방지 (자격만료 > 휴면 > 온보딩) |
| 4.8 | 운영자 알림 발송 화면 | `/app/admin/notifications/page.tsx` | 수동 발송 UI |
| 4.9 | 대상 회원 선택 | 체크박스/필터 | 전체 또는 선택 |
| 4.10 | 수동 알림 발송 API | `/app/api/admin/notifications/route.ts` | POST 요청 |
| 4.11 | 발송 기록 확인 | 운영자 화면 | 발송 이력 조회 |

#### 세그먼트별 리마인드 로직

```typescript
// /lib/segment-reminder.ts
async function getSegmentReminderTargets() {
  const today = new Date();
  
  // 우선순위 1: 자격 만료 임박 (마지막 정기모임 5개월 경과)
  const eligibilityWarning = await supabase
    .from('users')
    .select('id, name, phone, last_regular_meeting_at')
    .eq('is_new_member', false)
    .lte('last_regular_meeting_at', subMonths(today, 5))
    .gt('last_regular_meeting_at', subMonths(today, 6));
  
  // 우선순위 2: 휴면 위험 (마지막 참여 3개월 경과, 모든 모임 기준)
  // last_regular_meeting_at 또는 last_any_meeting_at 활용
  
  // 우선순위 3: 온보딩 이탈 위험 (첫 참여 후 45일 경과)
  const onboardingRisk = await supabase
    .from('users')
    .select('id, name, phone, first_regular_meeting_at')
    .eq('is_new_member', false)
    .lte('first_regular_meeting_at', subDays(today, 45))
    .gt('first_regular_meeting_at', subDays(today, 60))
    // 두 번째 참여 완료 여부 체크 필요
    .eq('total_participations', 1);
  
  // 중복 제거: 상위 우선순위에 포함된 회원은 하위에서 제외
  return applyPriority(eligibilityWarning, dormantRisk, onboardingRisk);
}
```

#### 리마인드 우선순위

```
자격 만료 임박 > 휴면 위험 > 온보딩 이탈 위험 > 월말 독려
```
※ 같은 날 여러 세그먼트에 해당하면 우선순위가 높은 알림만 발송

#### 월말 독려 대상 조회

```typescript
async function getMonthlyReminderTargets() {
  const currentMonth = getCurrentMonthRange();
  
  // 이번 달에 신청한 모임이 없는 회원
  const { data: allMembers } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('role', 'member');
  
  const { data: registeredUsers } = await supabase
    .from('registrations')
    .select('user_id')
    .eq('status', 'confirmed')
    .gte('created_at', currentMonth.start)
    .lt('created_at', currentMonth.end);
  
  const registeredUserIds = new Set(registeredUsers?.map(r => r.user_id));
  
  return allMembers?.filter(m => !registeredUserIds.has(m.id));
}
```

#### 운영자 수동 발송 UI

```
┌─────────────────────────────────────────┐
│ 📢 알림 발송                             │
├─────────────────────────────────────────┤
│                                          │
│ 발송 유형: [▼ 공지사항]                   │
│                                          │
│ 대상 선택:                               │
│ ○ 전체 회원 (250명)                      │
│ ○ 활성 회원만 (80명)                     │
│ ○ 특정 모임 참가자                        │
│   └ [▼ 1월 20일 경주 정기모임]            │
│                                          │
│ 메시지 내용:                             │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ 예상 발송: 80건 (약 720원)                │
│                                          │
│            [미리보기]  [발송하기]          │
└─────────────────────────────────────────┘
```

#### 완료 검증

- [ ] 매월 25일에 월말 독려 알림 발송
- [ ] 이번 달 미신청 회원에게만 발송
- [ ] 온보딩 이탈 위험 회원에게 45일 경과 시 알림 발송
- [ ] 휴면 위험 회원에게 3개월 경과 시 알림 발송
- [ ] 자격 만료 임박 회원에게 5개월 경과 시 알림 발송
- [ ] 리마인드 우선순위 적용 (중복 발송 방지)
- [ ] 운영자가 수동으로 알림 발송 가능
- [ ] 발송 대상 필터링 가능
- [ ] 발송 기록 확인 가능

#### 사용자 가치

> 🎯 **"회원이 세그먼트에 따라 적절한 리마인드를 받고, 운영자가 필요시 수동으로 공지할 수 있다"**

---

## 3. M3 완료 검증 체크리스트

### 기능 검증

- [ ] 모임 3일 전 리마인드 자동 발송
- [ ] 모임 1일 전 리마인드 자동 발송
- [ ] 모임 당일 리마인드 자동 발송
- [ ] 취소 시 대기자에게 자동 알림
- [ ] 응답 기한 초과 시 다음 대기자에게 자동 알림
- [ ] 월말 참여 독려 알림 발송
- [ ] 운영자 수동 알림 발송 가능

### 기술 검증

- [ ] Vercel Cron 정상 동작
- [ ] 솔라피 API 연동 안정적
- [ ] 중복 발송 방지 동작
- [ ] notification_logs 기록 정상

---

## 4. 기술적 주의사항

### AI 에이전트 가이드

1. **알림 서비스 추상화**
   - 인터페이스 기반 설계
   - 추후 NHN Cloud 등으로 30분 내 교체 가능하도록

2. **시간대 처리**
   - 한국 시간(KST) 기준으로 처리
   - UTC → KST 변환 유틸리티 함수 사용

3. **중복 발송 방지**
   - notification_logs 테이블에서 체크
   - 같은 user_id + meeting_id + notification_type + 날짜

4. **에러 핸들링**
   - 발송 실패 시 로그 기록
   - 부분 실패 허용 (일부만 발송되어도 진행)

---

## 5. 다음 단계 (M4 준비)

M3 완료 후 M4 시작 전 확인:

- [ ] "모임 후 어떠셨어요?" 알림 템플릿 추가 등록
- [ ] praises, badges, bookshelf 테이블 설계 검토

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | WP-M3 최초 작성 |
| 2026-01-14 | 1.1 | Phase 4에 세그먼트별 리마인드 Cron 추가 (온보딩 이탈 위험, 휴면 위험, 자격 만료 임박) |

