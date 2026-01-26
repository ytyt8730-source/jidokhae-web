# Work Package: M8 - Ritual Foundation (리추얼 기반)

---

**문서 버전:** 1.0  
**작성일:** 2026-01-26  
**Milestone:** M8  
**예상 기간:** 1~2주  
**선행 조건:** M6 완료 (M7과 병행 가능)

---

## 1. 개요

Design System v3.5를 적용하고, 모든 터치포인트의 톤앤매너를 통일합니다. 이 마일스톤은 이후 모든 Experience Enhancement의 기반이 됩니다.

**핵심 목표:**
- Micro-copy 전면 교체
- No-Emoji Policy 적용
- Sound/Haptic 시스템 구축

---

## 2. Phase 구성

### Phase 8.1: Micro-Copy 시스템

**목표:** 전체 서비스의 텍스트를 감성적 톤으로 통일

#### Tasks

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.1.1 | Micro-copy 상수 파일 생성 | `/lib/constants/microcopy.ts` |
| 8.1.2 | 버튼 텍스트 교체 | 신청하기→함께 읽기, 취소하기→다음 기회에 등 |
| 8.1.3 | 상태 메시지 교체 | 결제 완료→자리가 준비되었습니다 등 |
| 8.1.4 | 에러 메시지 교체 | 오류 발생→잠시 문제가 생겼어요 등 |
| 8.1.5 | 폼 검증 메시지 교체 | 필수 입력→이 부분을 채워주세요 등 |

#### Micro-Copy 매핑 테이블

```typescript
// /lib/constants/microcopy.ts
export const MICROCOPY = {
  // 버튼
  buttons: {
    register: '함께 읽기',
    cancel: '다음 기회에',
    login: '돌아오기',
    signup: '함께하기',
    logout: '잠시 자리 비우기',
    waitlist: '다음 기회를 기다리기',
    addBook: '책장에 꽂기',
    writeReview: '오늘의 기억 남기기',
    sendPraise: '마음 전하기',
    editProfile: '나를 소개하기',
  },
  
  // 상태
  status: {
    paymentComplete: '자리가 준비되었습니다',
    pendingPayment: '확인을 기다리는 중',
    confirmed: '함께하게 되었습니다',
    closed: '이번 자리는 마감되었습니다',
    cancelled: '다음에 꼭 만나요',
  },
  
  // 에러
  errors: {
    generic: '잠시 문제가 생겼어요',
    network: '연결이 불안정해요. 다시 시도해주세요',
    validation: '이 부분을 채워주세요',
  },
  
  // 페이지 타이틀
  pages: {
    mypage: '나의 지독해',
    notifications: '소식',
  }
} as const;
```

#### 검증 포인트

- [ ] 모든 버튼에 새 텍스트 적용
- [ ] 토스트/알림 메시지 교체 완료
- [ ] 폼 검증 메시지 교체 완료
- [ ] 상수 파일에서 중앙 관리

---

### Phase 8.2: No-Emoji Policy

**목표:** 모든 이모지를 Lucide React 아이콘으로 대체

#### Tasks

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.2.1 | 이모지 사용 현황 조사 | 이모지 사용 목록 |
| 8.2.2 | Lucide 아이콘 매핑 | 이모지→아이콘 매핑 테이블 |
| 8.2.3 | Custom SVG 아이콘 생성 | KongIcon, LeafIcon 등 |
| 8.2.4 | 전체 컴포넌트 이모지 제거 | - |
| 8.2.5 | 아이콘 컴포넌트 정리 | `/components/icons/` |

#### 아이콘 매핑 테이블

| 기존 이모지 | Lucide 아이콘 | 용도 |
|------------|--------------|------|
| 📚 | `Book` | 책/모임 |
| 📅 | `Calendar` | 날짜 |
| 📍 | `MapPin` | 장소 |
| 💰 | `Coins` | 콩/금액 |
| ✅ | `Check` | 완료 |
| ❌ | `X` | 취소 |
| ⭐ | `Star` | 인기/추천 |
| 💛 | `Heart` | 칭찬/좋아요 |
| 🔔 | `Bell` | 알림 |
| 👤 | `User` | 프로필 |
| 👥 | `Users` | 참가자 |
| 🏠 | `Home` | 홈 |
| ⚙️ | `Settings` | 설정 |
| 🎉 | `PartyPopper` | 축하 |
| 💬 | `MessageCircle` | 대화 |
| 📝 | `Edit` | 작성 |

#### Custom SVG 아이콘

```typescript
// /components/icons/KongIcon.tsx
export const KongIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} {...props}>
    {/* 콩 모양 SVG path */}
  </svg>
);

// /components/icons/LeafIcon.tsx (지독해 로고용)
export const LeafIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} {...props}>
    {/* 잎사귀 모양 SVG path */}
  </svg>
);
```

#### 검증 포인트

- [ ] 전체 서비스에서 이모지 0개
- [ ] Lucide 아이콘 일관되게 적용
- [ ] Custom 아이콘 정상 렌더링

---

### Phase 8.3: Sound System

**목표:** ASMR 피드백 사운드 시스템 구축

#### Tasks

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.3.1 | 사운드 파일 준비 | `/public/sounds/*.mp3` |
| 8.3.2 | 사운드 매니저 구현 | `/lib/sound.ts` |
| 8.3.3 | useFeedback 훅 생성 | `/hooks/useFeedback.ts` |
| 8.3.4 | 사운드 설정 UI | 설정 페이지 토글 |
| 8.3.5 | localStorage 연동 | 사운드 on/off 저장 |

#### 사운드 파일 목록

| 파일명 | 용도 | Duration |
|--------|------|----------|
| `beans-pour.mp3` | 콩 결제 시 | ~0.5s |
| `printer-whir.mp3` | 티켓 인쇄 | ~2.0s |
| `typewriter.mp3` | 타자 효과 | ~1.5s |
| `paper-tear.mp3` | 절취선/봉인 뜯기 | ~0.8s |
| `stamp-thud.mp3` | 도장 찍힘 | ~0.3s |
| `whoosh.mp3` | 전송 효과 | ~0.5s |

#### 구현 코드

```typescript
// /lib/sound.ts
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.enabled = localStorage.getItem('sound_enabled') !== 'false';
  }

  preload(soundId: string, path: string) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.sounds.set(soundId, audio);
  }

  play(soundId: string) {
    if (!this.enabled) return;
    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('sound_enabled', String(enabled));
  }

  isEnabled() {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();

// 초기화
soundManager.preload('beans', '/sounds/beans-pour.mp3');
soundManager.preload('printer', '/sounds/printer-whir.mp3');
soundManager.preload('typewriter', '/sounds/typewriter.mp3');
soundManager.preload('tear', '/sounds/paper-tear.mp3');
soundManager.preload('stamp', '/sounds/stamp-thud.mp3');
soundManager.preload('whoosh', '/sounds/whoosh.mp3');
```

```typescript
// /hooks/useFeedback.ts
import { soundManager } from '@/lib/sound';

export const useFeedback = () => {
  const playSound = (soundId: string) => {
    soundManager.play(soundId);
  };

  const triggerHaptic = (pattern: 'light' | 'heavy' | 'success' | 'tick') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        heavy: [50],
        success: [30, 50, 100],
        tick: [5],
      };
      navigator.vibrate(patterns[pattern]);
    }
  };

  const feedback = (type: string) => {
    switch (type) {
      case 'payment':
        playSound('beans');
        triggerHaptic('heavy');
        break;
      case 'ticket':
        playSound('printer');
        triggerHaptic('tick');
        break;
      case 'confirm':
        playSound('stamp');
        triggerHaptic('success');
        break;
      case 'send':
        playSound('whoosh');
        triggerHaptic('light');
        break;
      case 'tear':
        playSound('tear');
        triggerHaptic('light');
        break;
    }
  };

  return { playSound, triggerHaptic, feedback };
};
```

#### 검증 포인트

- [ ] 모든 사운드 파일 정상 로드
- [ ] 사운드 on/off 토글 동작
- [ ] 설정 localStorage 저장/로드
- [ ] 모바일 Safari 사운드 재생 (유저 인터랙션 후)

---

### Phase 8.4: Haptic System

**목표:** 모바일 진동 피드백 시스템

#### Tasks

| Task | 설명 | 산출물 |
|------|------|--------|
| 8.4.1 | Haptic 패턴 정의 | 패턴 상수 |
| 8.4.2 | useFeedback 훅 확장 | Haptic 기능 추가 |
| 8.4.3 | 모바일 테스트 | iOS/Android 테스트 |

#### Haptic 패턴

```typescript
export const HAPTIC_PATTERNS = {
  light: [10],           // 일반 버튼 탭
  heavy: [50],           // 결제/발권
  success: [30, 50, 100], // 확정 도장
  tick: [5],             // 타자 효과 (반복)
  error: [100, 50, 100], // 에러
} as const;
```

#### 검증 포인트

- [ ] iOS 진동 동작 확인
- [ ] Android 진동 동작 확인
- [ ] 패턴별 차이 체감 가능

---

## 3. 기술 스택

| 영역 | 기술 |
|------|------|
| 아이콘 | Lucide React |
| 사운드 | HTML5 Audio API |
| 진동 | Navigator.vibrate() |
| 상태 관리 | localStorage |

---

## 4. 파일 구조

```
/lib
├── constants/
│   └── microcopy.ts      # Micro-copy 상수
├── sound.ts              # 사운드 매니저
└── animations.ts         # (기존) 애니메이션 variants

/hooks
└── useFeedback.ts        # Sound + Haptic 훅

/components/icons
├── index.ts              # 아이콘 export
├── KongIcon.tsx          # 콩 아이콘
└── LeafIcon.tsx          # 잎사귀 아이콘

/public/sounds
├── beans-pour.mp3
├── printer-whir.mp3
├── typewriter.mp3
├── paper-tear.mp3
├── stamp-thud.mp3
└── whoosh.mp3
```

---

## 5. 검증 체크리스트

### Phase 8.1 완료 조건
- [ ] Micro-copy 상수 파일 생성 완료
- [ ] 모든 버튼 텍스트 교체 완료
- [ ] 상태/에러 메시지 교체 완료

### Phase 8.2 완료 조건
- [ ] 이모지 사용 0개
- [ ] Lucide 아이콘 통일
- [ ] Custom SVG 아이콘 동작

### Phase 8.3 완료 조건
- [ ] 6개 사운드 파일 준비
- [ ] SoundManager 구현
- [ ] 사운드 설정 토글 동작

### Phase 8.4 완료 조건
- [ ] Haptic 패턴 정의
- [ ] 모바일 진동 동작
- [ ] useFeedback 훅 완성

---

## 6. 의존성

```
[M6 완료]
    ↓
[Phase 8.1] Micro-Copy
    ↓
[Phase 8.2] No-Emoji (8.1과 병행 가능)
    ↓
[Phase 8.3] Sound System (8.2와 병행 가능)
    ↓
[Phase 8.4] Haptic System (8.3과 병행 가능)
    ↓
[M8 완료] → M9, M12 시작 가능
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-26 | 1.0 | 최초 작성 |
