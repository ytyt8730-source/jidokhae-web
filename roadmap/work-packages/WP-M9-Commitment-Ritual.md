# Work Package: M9 - Commitment Ritual (결심 리추얼)

---

**문서 버전:** 1.0
**작성일:** 2026-01-26
**Milestone:** M9
**예상 기간:** 2~3주
**선행 조건:** M8 완료

---

## 1. 개요

"신청 -> 결제 -> 확정" 과정을 단순한 트랜잭션에서 **특별한 리추얼**로 전환합니다. 티켓 발권 시스템, 콩(Kong) 물성 애니메이션, 확정 Celebration을 통해 회원이 모임 참여를 "결심"하는 순간을 기억에 남는 경험으로 만듭니다.

**핵심 목표:**
- 티켓 발권 시스템 (Seat No., 참여 횟수)
- 결제 및 확정 애니메이션 (발권, 콩, 도장)
- 티켓 보관함 및 이미지 저장
- 취소 Flow UX 개선

---

## 2. Phase 구성 개요

```
[M8 완료: Ritual Foundation]
    |
    v
[Phase 9.1] DB 스키마 + 티켓 컴포넌트 기반
    |
    v
[Phase 9.2] 발권 애니메이션 + 콩 물성
    |
    v
[Phase 9.3] 확정 Celebration + 입금대기
    |
    v
[Phase 9.4] 티켓 보관함 + 취소 Flow 개선
    |
    v
[M9 완료] -> M10 시작 가능
```

---

## 3. Phase 상세

### Phase 9.1: DB 스키마 + 티켓 컴포넌트 기반

**목표:** 티켓 데이터 모델 확장 및 기본 Ticket 컴포넌트 구현

**예상 소요:** 3~4일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 9.1.1 | DB 스키마 마이그레이션 작성 | `migration-m9-ticket.sql` | seat_number, participation_count 컬럼 추가 |
| 9.1.2 | Seat No. 자동 부여 로직 구현 | `lib/ticket.ts` | 모임별 순번 자동 생성 |
| 9.1.3 | 참여 횟수 계산 로직 구현 | `lib/ticket.ts` | "나의 N번째 지독해" 계산 |
| 9.1.4 | Ticket 컴포넌트 기본 구조 | `components/ticket/Ticket.tsx` | 정적 티켓 UI 렌더링 |
| 9.1.5 | TicketStub 컴포넌트 구현 | `components/ticket/TicketStub.tsx` | 보관함용 작은 스텁 |
| 9.1.6 | 절취선(Perforation) 디자인 | CSS/SVG | 점선 절취선 스타일 |
| 9.1.7 | TypeScript 타입 정의 | `types/ticket.ts` | TicketData, TicketStatus 타입 |

#### DB 스키마 변경

```sql
-- migration-m9-ticket.sql

-- registrations 테이블 확장
ALTER TABLE registrations ADD COLUMN seat_number INTEGER;
ALTER TABLE registrations ADD COLUMN participation_count INTEGER;

-- 좌석 번호 자동 부여 함수
CREATE OR REPLACE FUNCTION assign_seat_number()
RETURNS TRIGGER AS $$
DECLARE
  next_seat INTEGER;
BEGIN
  SELECT COALESCE(MAX(seat_number), 0) + 1
  INTO next_seat
  FROM registrations
  WHERE meeting_id = NEW.meeting_id
    AND status IN ('confirmed', 'pending_payment', 'pending_transfer');

  NEW.seat_number := next_seat;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER tr_assign_seat_number
BEFORE INSERT ON registrations
FOR EACH ROW
WHEN (NEW.seat_number IS NULL)
EXECUTE FUNCTION assign_seat_number();

-- 참여 횟수 계산 함수
CREATE OR REPLACE FUNCTION calculate_participation_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM registrations r
    JOIN meetings m ON r.meeting_id = m.id
    WHERE r.user_id = p_user_id
      AND r.status = 'confirmed'
      AND m.meeting_date < NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

#### 티켓 컴포넌트 구조

```typescript
// types/ticket.ts
export interface TicketData {
  id: string;
  meetingTitle: string;
  meetingDate: Date;
  meetingLocation: string;
  seatNumber: number;
  participationCount: number;
  userName: string;
  status: 'pending' | 'confirmed' | 'used' | 'cancelled';
  issuedAt: Date;
}

export type TicketVariant = 'full' | 'stub' | 'mini';
```

```typescript
// components/ticket/Ticket.tsx
interface TicketProps {
  data: TicketData;
  variant?: TicketVariant;
  showPerforation?: boolean;
  onTear?: () => void;
}
```

#### Scenario (검증 기준)

:red_circle: **SC-M9-001: 결제 완료 시 Seat No. 자동 부여**
- Given: 사용자가 모임 결제를 완료함
- When: 결제 성공 웹훅 처리됨
- Then: registrations에 seat_number가 1부터 순차 부여됨

:red_circle: **SC-M9-002: 참여 횟수 정확히 계산**
- Given: 사용자가 이전에 5개 모임에 참여 완료함
- When: 새 모임 결제 완료
- Then: participation_count가 6으로 설정됨 (이번이 6번째)

:yellow_circle: **SC-M9-003: Ticket 컴포넌트 정상 렌더링**
- Given: TicketData가 전달됨
- When: Ticket 컴포넌트 렌더링
- Then: 모임명, 날짜, 장소, Seat No., 참여 횟수가 모두 표시됨

:yellow_circle: **SC-M9-004: Seat No. 동시 부여 시 중복 방지**
- Given: 동일 모임에 사용자 A, B가 거의 동시에 결제 완료
- When: 두 결제 성공 웹훅이 동시에 처리됨
- Then: seat_number가 중복 없이 순차 부여됨 (A=1, B=2 또는 A=2, B=1)
- 선행: SC-M9-001

:yellow_circle: **SC-M9-005: 취소된 신청 건 seat_number 처리**
- Given: seat_number 3번이 부여된 신청이 취소됨
- When: 새로운 사용자가 결제 완료
- Then: 다음 순번 4번이 부여됨 (3번 재사용 안함)
- 선행: SC-M9-001

#### 사용자 가치
> "결제가 완료되면 나만의 좌석 번호가 부여되고, 지금까지 몇 번째 지독해인지 확인할 수 있다"

---

### Phase 9.2: 발권 애니메이션 + 콩 물성

**목표:** 결제 순간의 시청각 피드백 완성 (티켓 발권, 콩 애니메이션)

**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 9.2.1 | 슬릿(Slit) 등장 애니메이션 | Framer Motion variants | 화면 하단에서 슬릿 올라옴 |
| 9.2.2 | 티켓 인쇄 애니메이션 | `TicketPrinting.tsx` | 위->아래 타자기처럼 출력 |
| 9.2.3 | 텍스트 타자 효과 (Typewriter) | `useTypewriter.ts` 훅 | 글자가 한 글자씩 나타남 |
| 9.2.4 | 발권 사운드 연동 | M8 useFeedback 활용 | printer-whir + typewriter 재생 |
| 9.2.5 | 발권 Haptic 연동 | M8 useFeedback 활용 | Tick-Tick 패턴 |
| 9.2.6 | KongIcon 리디자인 | `components/icons/KongIcon.tsx` | Gold/Brown 그라데이션 |
| 9.2.7 | Kong Idle 애니메이션 | Framer Motion | 살랑살랑 흔들림 |
| 9.2.8 | Kong 쏟아지는 애니메이션 | `KongPour.tsx` | 결제 시 콩이 쏟아지는 효과 |
| 9.2.9 | Kong 사운드/Haptic 연동 | useFeedback | beans-pour + Heavy |
| 9.2.10 | TicketIssuance 전체 Flow 통합 | `TicketIssuance.tsx` | 결제 -> 콩 -> 발권 순서 |

#### 애니메이션 상세

```typescript
// lib/animations.ts (추가)
export const ticketAnimations = {
  slit: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },

  printing: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    transition: { duration: 2, ease: 'linear' }
  },

  kongIdle: {
    animate: {
      rotate: [-3, 3, -3],
      y: [-1, 1, -1]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },

  kongPour: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      staggerChildren: 0.05
    }
  }
};
```

```typescript
// hooks/useTypewriter.ts
export const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text[index]);
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayText, isComplete };
};
```

#### KongIcon 디자인

```typescript
// components/icons/KongIcon.tsx
export const KongIcon = ({ className, size = 24 }: KongIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <defs>
      <linearGradient id="kong-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4A574" /> {/* Light Gold */}
        <stop offset="50%" stopColor="#8B6914" /> {/* Gold */}
        <stop offset="100%" stopColor="#5C4033" /> {/* Brown */}
      </linearGradient>
    </defs>
    <ellipse
      cx="12"
      cy="12"
      rx="8"
      ry="10"
      fill="url(#kong-gradient)"
      stroke="#3D2B1F"
      strokeWidth="0.5"
    />
    {/* 콩 광택 하이라이트 */}
    <ellipse
      cx="9"
      cy="9"
      rx="2"
      ry="3"
      fill="rgba(255,255,255,0.3)"
    />
  </svg>
);
```

#### Scenario (검증 기준)

:red_circle: **SC-M9-006: 결제 완료 후 티켓 발권 애니메이션 재생**
- Given: 사용자가 카카오페이/토스페이 결제 완료
- When: 결제 성공 콜백 수신
- Then: 슬릿 등장 -> 티켓 인쇄 -> 타자 효과 순서로 2~3초간 애니메이션 재생

:red_circle: **SC-M9-007: 콩 결제 시 쏟아지는 애니메이션**
- Given: 결제 금액이 15,000콩
- When: 결제 버튼 클릭 직후
- Then: 콩 아이콘들이 위에서 쏟아지며 beans-pour.mp3 재생 + Heavy Haptic

:yellow_circle: **SC-M9-008: 타자 효과 + 사운드 동기화**
- Given: 티켓 정보가 타자 효과로 출력 중
- When: 각 글자 출력 시
- Then: typewriter.mp3의 타닥 소리와 Tick Haptic 동기화

:yellow_circle: **SC-M9-009: KongIcon Idle 애니메이션**
- Given: 결제 전 화면에서 콩 아이콘 표시
- When: 아이콘이 화면에 렌더링됨
- Then: 살랑살랑 좌우 흔들림 + 위아래 미세 움직임

:yellow_circle: **SC-M9-010: 사운드 off 설정 시 애니메이션만 재생**
- Given: 사용자가 설정에서 사운드를 off로 설정함
- When: 결제 완료 후 발권 Flow 진행
- Then: 애니메이션은 정상 재생되고, 사운드는 재생되지 않음
- 선행: SC-M9-006

#### 사용자 가치
> "결제하면 콩이 쏟아지고, 내 이름과 좌석번호가 적힌 티켓이 '찍혀 나오는' 느낌을 받는다"

---

### Phase 9.3: 확정 Celebration + 입금대기

**목표:** 확정/대기 상태의 시각적 피드백 완성

**예상 소요:** 3~4일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 9.3.1 | 입금대기 티켓 상태 UI | Ticket 컴포넌트 확장 | 50% opacity + PENDING 스탬프 |
| 9.3.2 | "확인을 기다리는 중" 상태 표시 | 상태 배지 | 점 애니메이션 포함 |
| 9.3.3 | Confetti 효과 구현 | `Confetti.tsx` | 확정 시 화면 상단에서 떨어짐 |
| 9.3.4 | CONFIRMED 도장 애니메이션 | `ConfirmStamp.tsx` | 쿵 찍히는 효과 |
| 9.3.5 | 도장 사운드/Haptic 연동 | useFeedback | stamp-thud + Success |
| 9.3.6 | 자동 확정 모달 구현 | `ConfirmationModal.tsx` | 접속 시 상태 변화 감지 |
| 9.3.7 | Supabase Realtime 연동 | 상태 변화 구독 | pending -> confirmed 감지 |
| 9.3.8 | 절취선 드래그 제스처 | `useTearGesture.ts` | 드래그 시 찢어지는 인터랙션 |
| 9.3.9 | 찢어지는 애니메이션 | Framer Motion | 좌우 분리 + paper-tear 사운드 |
| 9.3.10 | Stub 이동 효과 | `StubFlyaway.tsx` | 스텁이 보관함으로 날아감 |

#### 확정 도장 애니메이션

```typescript
// components/ticket/ConfirmStamp.tsx
export const ConfirmStamp = ({ onComplete }: { onComplete?: () => void }) => {
  const { feedback } = useFeedback();

  return (
    <motion.div
      initial={{ scale: 3, opacity: 0, rotate: -15 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        onComplete: () => {
          feedback('confirm');
          onComplete?.();
        }
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="border-4 border-brand-600 text-brand-600 px-4 py-2
                      font-bold text-lg rotate-[-5deg] rounded">
        CONFIRMED
      </div>
    </motion.div>
  );
};
```

#### Confetti 구현

```typescript
// components/effects/Confetti.tsx
import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.3 },
    colors: ['#355E3B', '#D4A574', '#8B6914', '#c77654'],
  });
};
```

#### 절취선 드래그 제스처

```typescript
// hooks/useTearGesture.ts
export const useTearGesture = (onTear: () => void) => {
  const [dragProgress, setDragProgress] = useState(0);
  const { feedback } = useFeedback();

  const bind = useDrag(({ movement: [mx], down, cancel }) => {
    const progress = Math.min(Math.abs(mx) / 150, 1);
    setDragProgress(down ? progress : 0);

    if (progress >= 1 && down) {
      feedback('tear');
      onTear();
      cancel();
    }
  });

  return { bind, dragProgress };
};
```

#### Scenario (검증 기준)

:red_circle: **SC-M9-011: 입금대기 상태 티켓 표시**
- Given: 계좌이체 선택 후 "입금했습니다" 체크
- When: 티켓 화면 표시
- Then: 티켓이 50% 투명도 + "PENDING" 스탬프 표시

:red_circle: **SC-M9-012: 입금 확정 시 Celebration 효과**
- Given: 운영자가 입금 확인 버튼 클릭
- When: 사용자가 앱 접속 중 또는 재접속
- Then: Confetti 효과 + CONFIRMED 도장 애니메이션 + stamp-thud 사운드

:red_circle: **SC-M9-013: 절취선 드래그 인터랙션**
- Given: 확정된 티켓에서 절취선 영역 터치
- When: 150px 이상 드래그
- Then: 찢어지는 애니메이션 + paper-tear 사운드 + 스텁이 보관함으로 이동

:yellow_circle: **SC-M9-014: Realtime 상태 변화 감지**
- Given: 사용자가 앱 접속 중
- When: 운영자가 입금 확인 처리
- Then: 3초 이내 자동으로 확정 모달 표시

:yellow_circle: **SC-M9-015: 절취선 150px 미만 드래그 시 원위치**
- Given: 확정된 티켓에서 절취선 영역 터치
- When: 100px 드래그 후 손을 뗌
- Then: 티켓이 원위치로 돌아감 (찢어지지 않음), dragProgress가 0으로 리셋됨
- 선행: SC-M9-013

#### 사용자 가치
> "운영자가 입금을 확인하면, 내 티켓에 '확정' 도장이 쿵 찍히고 축하 효과가 터진다"

---

### Phase 9.4: 티켓 보관함 + 취소 Flow 개선

**목표:** 티켓 관리 및 취소 경험 개선

**예상 소요:** 4~5일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 9.4.1 | 마이페이지 티켓 보관함 UI | `/my-page/tickets` 페이지 | 예정/완료 탭 분리 |
| 9.4.2 | 티켓 목록 컴포넌트 | `TicketList.tsx` | 스텁 형태로 나열 |
| 9.4.3 | 티켓 상세 모달 | `TicketDetailModal.tsx` | 전체 티켓 보기 |
| 9.4.4 | 이미지 저장 기능 | html2canvas 활용 | PNG 다운로드 |
| 9.4.5 | 캘린더 추가 기능 | ICS 파일 생성 | Google/Apple 캘린더 연동 |
| 9.4.6 | 취소 Bottom Sheet | `CancelBottomSheet.tsx` | 팝업 대신 하단 시트 |
| 9.4.7 | 긍정적 리마인더 메시지 | Micro-copy | 죄책감 유발 없는 문구 |
| 9.4.8 | 취소 완료 화면 | `CancelComplete.tsx` | 부드러운 작별 |
| 9.4.9 | 환불 규정 더보기 UI | 접힘/펼침 | 기본 접힌 상태 |

#### 티켓 보관함 UI

```typescript
// app/my-page/tickets/page.tsx
export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <div className="space-y-6">
      <h1 className="text-h1">티켓 보관함</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">예정된 모임</TabsTrigger>
          <TabsTrigger value="past">지난 모임</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <TicketList status="upcoming" />
        </TabsContent>

        <TabsContent value="past">
          <TicketList status="past" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 이미지 저장

```typescript
// lib/ticket-export.ts
import html2canvas from 'html2canvas';

export const saveTicketAsImage = async (ticketElement: HTMLElement) => {
  const canvas = await html2canvas(ticketElement, {
    scale: 2,
    backgroundColor: '#FDFBF7', // warm-50 배경
  });

  const link = document.createElement('a');
  link.download = `jidokhae-ticket-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
```

#### 캘린더 추가

```typescript
// lib/calendar.ts
export const generateICS = (ticket: TicketData): string => {
  const start = formatISO(ticket.meetingDate).replace(/[-:]/g, '').split('.')[0];
  const end = formatISO(addHours(ticket.meetingDate, 2)).replace(/[-:]/g, '').split('.')[0];

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${ticket.meetingTitle} - 지독해
LOCATION:${ticket.meetingLocation}
DESCRIPTION:나의 ${ticket.participationCount}번째 지독해\\nSeat No. ${ticket.seatNumber}
END:VEVENT
END:VCALENDAR`;
};

export const addToCalendar = (ticket: TicketData) => {
  const ics = generateICS(ticket);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `jidokhae-${ticket.seatNumber}.ics`;
  link.click();
};
```

#### 취소 Bottom Sheet

```typescript
// components/cancel/CancelBottomSheet.tsx
export const CancelBottomSheet = ({
  isOpen,
  onClose,
  registration,
  onConfirmCancel
}: CancelBottomSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>다음 기회에 만나요</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {/* 긍정적 리마인더 */}
          <p className="text-body text-gray-600">
            언제든 다시 돌아오실 수 있어요.<br/>
            다음 모임에서 기다릴게요.
          </p>

          {/* 환불 규정 더보기 */}
          <Collapsible>
            <CollapsibleTrigger className="text-sm text-gray-500 flex items-center gap-1">
              환불 규정 보기 <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-sm text-gray-500">
              {/* 환불 규정 내용 */}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            조금 더 생각해볼게요
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmCancel}
            className="flex-1"
          >
            취소할게요
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

#### 취소 완료 Micro-copy

```typescript
// lib/constants/microcopy.ts (추가)
export const CANCEL_MICROCOPY = {
  title: '다음 기회에 만나요',
  message: '언제든 다시 돌아오실 수 있어요.\n다음 모임에서 기다릴게요.',
  buttonStay: '조금 더 생각해볼게요',
  buttonCancel: '취소할게요',
  completeTitle: '취소가 완료되었어요',
  completeMessage: '다음에 꼭 함께해요.',
} as const;
```

#### Scenario (검증 기준)

:red_circle: **SC-M9-016: 티켓 보관함 접근 및 목록 표시**
- Given: 로그인한 사용자
- When: 마이페이지 > 티켓 보관함 접근
- Then: 예정된 모임 / 지난 모임 탭으로 구분된 티켓 목록 표시

:red_circle: **SC-M9-017: 티켓 이미지 저장 성공**
- Given: 티켓 상세 화면에서 "이미지 저장" 버튼 클릭
- When: html2canvas 처리
- Then: PNG 파일이 다운로드됨

:yellow_circle: **SC-M9-018: 캘린더 추가**
- Given: 예정된 모임 티켓에서 "캘린더 추가" 버튼 클릭
- When: ICS 파일 생성
- Then: 기기 캘린더 앱에 일정 추가 화면 표시

:red_circle: **SC-M9-019: 취소 Flow - 긍정적 리마인더**
- Given: 확정된 모임에서 "다음 기회에" 버튼 클릭
- When: Bottom Sheet 열림
- Then: "언제든 다시 돌아오실 수 있어요" 메시지 표시 (Facepile 없음, 죄책감 유발 요소 없음)

:yellow_circle: **SC-M9-020: 환불 규정 접힘 상태**
- Given: 취소 Bottom Sheet 열림
- When: 초기 상태
- Then: 환불 규정은 "더보기"로 접힌 상태, 클릭 시 펼쳐짐

:yellow_circle: **SC-M9-021: 이미지 저장 실패 시 에러 처리**
- Given: 티켓 상세 화면에서 "이미지 저장" 버튼 클릭
- When: html2canvas 처리 중 오류 발생 (CORS, 메모리 부족 등)
- Then: "이미지 저장에 실패했습니다. 다시 시도해주세요." 토스트 메시지 표시, 버튼 다시 활성화
- 선행: SC-M9-017

#### 사용자 가치
> "티켓을 이미지로 저장하고 캘린더에 추가할 수 있다. 취소해도 부담 없이 다음에 다시 올 수 있다는 느낌을 받는다"

---

## 4. 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| 애니메이션 | Framer Motion | 티켓 발권, 도장, 절취선 |
| 제스처 | @use-gesture/react | 드래그 인터랙션 |
| 이미지 | html2canvas | 티켓 PNG 저장 |
| 효과 | canvas-confetti | Confetti 효과 |
| 캘린더 | ICS 파일 생성 | 캘린더 연동 |
| 실시간 | Supabase Realtime | 상태 변화 감지 |
| UI | Radix Sheet | Bottom Sheet |
| 사운드/Haptic | M8 useFeedback | 피드백 시스템 |

---

## 5. 파일 구조

```
/lib
├── ticket.ts                 # 티켓 로직 (좌석 부여, 참여 횟수)
├── ticket-export.ts          # 이미지/캘린더 내보내기
└── animations.ts             # ticketAnimations 추가

/hooks
├── useTypewriter.ts          # 타자 효과
└── useTearGesture.ts         # 절취선 드래그

/components
├── ticket/
│   ├── Ticket.tsx            # 메인 티켓 컴포넌트
│   ├── TicketStub.tsx        # 스텁 (보관함용)
│   ├── TicketPrinting.tsx    # 발권 애니메이션
│   ├── ConfirmStamp.tsx      # 확정 도장
│   └── TicketDetailModal.tsx # 상세 모달
├── effects/
│   ├── Confetti.tsx          # Confetti 효과
│   ├── KongPour.tsx          # 콩 쏟아지는 효과
│   └── StubFlyaway.tsx       # 스텁 날아가는 효과
├── cancel/
│   ├── CancelBottomSheet.tsx # 취소 Bottom Sheet
│   └── CancelComplete.tsx    # 취소 완료 화면
└── issuance/
    └── TicketIssuance.tsx    # 발권 전체 Flow

/app/my-page/tickets
└── page.tsx                  # 티켓 보관함 페이지

/types
└── ticket.ts                 # 티켓 타입 정의

/supabase
└── migration-m9-ticket.sql   # DB 마이그레이션
```

---

## 6. 전체 완료 검증

### Phase 9.1 완료 조건
- [ ] seat_number, participation_count 컬럼 추가 완료
- [ ] Seat No. 자동 부여 트리거 동작
- [ ] 참여 횟수 계산 함수 동작
- [ ] Ticket/TicketStub 컴포넌트 렌더링

### Phase 9.2 완료 조건
- [ ] 슬릿 등장 -> 인쇄 -> 타자 애니메이션 시퀀스 동작
- [ ] 발권 시 printer-whir, typewriter 사운드 재생
- [ ] KongIcon Gold/Brown 그라데이션 렌더링
- [ ] 콩 쏟아지는 효과 + beans-pour 사운드

### Phase 9.3 완료 조건
- [ ] 입금대기 티켓 50% opacity + PENDING 스탬프
- [ ] 확정 시 Confetti + CONFIRMED 도장 + stamp-thud 사운드
- [ ] 절취선 드래그 시 찢어지는 효과 + paper-tear 사운드
- [ ] Realtime 상태 변화 시 자동 모달

### Phase 9.4 완료 조건
- [ ] 티켓 보관함 예정/완료 탭 동작
- [ ] 티켓 이미지 PNG 다운로드
- [ ] 캘린더 ICS 파일 생성/다운로드
- [ ] 취소 Bottom Sheet + 긍정적 리마인더
- [ ] 환불 규정 "더보기" 접힘/펼침

### 전체 M9 완료 조건
- [ ] 모든 Phase 완료
- [ ] 모든 Scenario 통과
- [ ] TypeScript 에러 0개
- [ ] 빌드 성공
- [ ] main 머지 완료

---

## 7. 의존성 다이어그램

```
[M8 완료: Ritual Foundation]
├── Micro-copy 시스템
├── No-Emoji Policy
├── Sound System
└── Haptic System
    |
    v
[Phase 9.1] DB + 컴포넌트 기반
    |
    v
[Phase 9.2] 발권 + 콩 애니메이션
    |
    v
[Phase 9.3] 확정 + 입금대기 (Phase 9.2 완료 후)
    |
    v
[Phase 9.4] 보관함 + 취소 (Phase 9.3 완료 후)
    |
    v
[M9 완료] -> M10 시작 가능
```

---

## 8. 위험 관리

| 위험 | 영향 | 대응 방안 |
|------|------|----------|
| 애니메이션 성능 저하 | 모바일에서 끊김 | will-change 적용, requestAnimationFrame 최적화 |
| html2canvas 크로스브라우저 이슈 | 이미지 저장 실패 | Fallback으로 서버 사이드 렌더링 검토 |
| 사운드 자동 재생 제한 (iOS) | 첫 발권 시 무음 | 유저 인터랙션 후 재생, 안내 메시지 |
| Realtime 연결 끊김 | 확정 모달 미표시 | 재연결 로직, 폴링 Fallback |
| 절취선 드래그 민감도 | UX 혼란 | 150px 임계값 조정 가능하게 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-26 | 1.0 | 최초 작성 |
