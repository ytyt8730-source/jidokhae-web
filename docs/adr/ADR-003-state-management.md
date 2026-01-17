# ADR-003: 상태 관리 전략

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- Next.js 14 App Router 사용 (React Server Components 기본)
- 실시간 참가 인원 업데이트 필요 (Supabase Realtime)
- MVP 규모에서 과도한 상태 관리 도구는 불필요

## 고려한 대안

### 대안 1: Redux / Zustand 전역 상태
- 장점: 복잡한 상태 로직 관리
- 단점: MVP 규모에 과함, 보일러플레이트

### 대안 2: React Query (TanStack Query) 단독
- 장점: 서버 상태 캐싱, 자동 갱신
- 단점: 클라이언트 상태 별도 관리 필요

### 대안 3: Server Components + 최소 클라이언트 상태 (선택)
- 장점: Next.js 14 권장 패턴, 단순함
- 단점: 복잡한 클라이언트 상태 시 한계

## 결정

**Server Components 우선 + 필요 시 클라이언트 상태** 방식

### 상태 분류

| 구분 | 처리 방식 | 예시 |
|------|----------|------|
| 서버 데이터 | Server Component에서 직접 fetch | 모임 목록, 사용자 정보 |
| 실시간 데이터 | Supabase Realtime 구독 | 참가 인원 수 |
| 폼 상태 | React useState/useReducer | 신청 폼, 로그인 폼 |
| UI 상태 | React useState | 모달 열기/닫기, 토글 |

### 구현 패턴

```tsx
// Server Component (기본)
async function MeetingList() {
  const supabase = await createClient()
  const { data: meetings } = await supabase.from('meetings').select()
  return <MeetingCards meetings={meetings} />
}

// Client Component (상호작용 필요 시)
'use client'
function MeetingCard({ meeting }) {
  const [isApplying, setIsApplying] = useState(false)
  // ...
}

// 실시간 구독 (참가 인원 등)
'use client'
function ParticipantCount({ meetingId }) {
  const [count, setCount] = useState(initialCount)
  
  useEffect(() => {
    const channel = supabase
      .channel(`meeting:${meetingId}`)
      .on('postgres_changes', { ... }, payload => {
        setCount(payload.new.current_participants)
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [meetingId])
  
  return <span>{count}명 참여</span>
}
```

### 클라이언트 상태 도구

- **폼**: React Hook Form (복잡한 폼) 또는 useState (단순 폼)
- **전역 UI 상태**: React Context (필요 시)
- **서버 상태 캐싱**: 필요 시 TanStack Query 도입 검토

## 결과

### 긍정적 영향
- 초기 로딩 빠름 (SSR)
- 코드 단순함
- AI 에이전트가 이해하기 쉬운 구조

### 주의사항
- Client/Server Component 경계 명확히 구분
- 실시간 기능은 'use client' 컴포넌트에서만

---

## 관련 파일
- `/src/app/` (Server Components)
- `/src/components/` (Client/Server 혼합)

