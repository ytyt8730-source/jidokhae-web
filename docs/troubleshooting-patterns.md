# 트러블슈팅 패턴

> **버전**: 1.1  
> **마지막 업데이트**: 2026-01-17

---

## 🔴 자주 발생하는 문제

### 1. Hydration Mismatch

**증상**: `Hydration failed because the initial UI does not match what was rendered on the server.`

**원인**: 날짜/시간, `Math.random()`, 브라우저 전용 API

**해결**:
```tsx
'use client'
export default function Component() {
  const [date, setDate] = useState<string>('')
  useEffect(() => setDate(new Date().toLocaleString()), [])
  return <p>현재: {date}</p>
}
```

---

### 2. 순차 쿼리 성능 저하

**증상**: 페이지 로딩 10초+

**해결**: `Promise.all()` 병렬 처리
```typescript
const [users, meetings, stats] = await Promise.all([
  getUsers(), getMeetings(), getStats()
])
```

---

### 3. Supabase RLS 무한 재귀

**증상**: `infinite recursion detected in policy for relation "users"`

**원인**: RLS policy 내에서 같은 테이블 조회

**해결**:
```sql
-- ✅ 단순 조건 사용
CREATE POLICY "users_select" ON users FOR SELECT 
USING (auth.uid() = id);
```

---

### 4. 포트원 Store ID 오류

**증상**: `Store ID is not recognized`

**원인**: V1 테스트 코드(`TC0ONETIM`)를 V2에서 사용

**해결**: V2 Store ID 사용 (`store-xxxxx` 형식)

> 📖 상세: [외부 서비스 설정 - 포트원](/docs/external-services.md#3-포트원-v2-결제)

---

### 5. Next.js 포트 충돌

**증상**: `Port 3000 is in use, trying 3001 instead.`

**해결**:
```powershell
# Windows - 포트 점유 프로세스 종료
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**중요**: 포트 변경 시 Redirect URI 등록 필요

> 📖 상세: [외부 서비스 설정 - Redirect URI](/docs/external-services.md#22-redirect-uri-등록)

---

### 6. 카카오 로그인 Redirect 실패

**증상**: 로그인 후 callback 에러 또는 상태 미반영

**원인**: 현재 포트의 Redirect URI 미등록

**해결**: 카카오/Supabase에 해당 포트 URI 추가

> 📖 상세: [외부 서비스 설정 - 카카오 OAuth](/docs/external-services.md#2-카카오-oauth)

---

### 7. 환경 변수 미로드

**증상**: `process.env.XXX`가 undefined

**해결**:
1. `.env.local` 위치 확인 (프로젝트 루트)
2. 변수명 오타 확인
3. **서버 재시작**: `Ctrl+C` → `npm run dev`

---

### 8. TypeScript `never` 타입 에러

**증상**: `Argument of type 'never' is not assignable`

**해결**: 타입 단언 또는 정확한 타입 가드
```typescript
const value = someValue as string
```

---

### 9. Tailwind CSS 스타일 미적용

**원인**: content 경로 누락 또는 동적 클래스명

**해결**:
```typescript
// ✅ 정적 클래스명 사용
const colorClasses = { red: 'text-red-500', blue: 'text-blue-500' }
<div className={colorClasses[color]}>
```

---

### 10. Next.js 빌드 에러

**해결 순서**:
```bash
npx tsc --noEmit     # 타입 에러
npm run lint         # 린트 에러
rm -rf .next && npm run build  # 캐시 삭제
```

---

### 11. Windows PowerShell `&&` 오류

**해결**: `;` 사용
```powershell
cd C:\project; npm run build
```

---

## 🛡️ 방어 코드 패턴

### 외부 API 호출 (타임아웃 + 재시도)
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

---

## 📋 디버깅 체크리스트

### 일반
- [ ] 터미널/브라우저 콘솔 에러 확인
- [ ] `.env.local` 환경 변수 확인
- [ ] `npx tsc --noEmit` 타입 체크
- [ ] 캐시 삭제: `rm -rf .next`

### 인증
- [ ] 현재 포트 확인 (3000/3001/3003)
- [ ] Redirect URI 등록 확인
- [ ] 브라우저 쿠키 삭제

### 결제
- [ ] Store ID 형식 (`store-` 시작)
- [ ] V2 SDK 로드 확인

### RLS
- [ ] `SELECT * FROM pg_policies WHERE tablename = 'users'`
- [ ] 무한 재귀 패턴 확인

---

## 📚 관련 문서

- [외부 서비스 설정](/docs/external-services.md)
- [환경 변수](/docs/env-variables.md)
