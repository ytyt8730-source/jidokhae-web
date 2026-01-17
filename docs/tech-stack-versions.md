# 기술 스택 버전 정보

> 이 문서는 프로젝트에서 사용하는 기술 스택의 정확한 버전을 명시합니다.
> AI 에이전트가 올바른 문법과 API를 사용할 수 있도록 참조합니다.

## 프레임워크 & 라이브러리

| 기술 | 버전 | 비고 |
|------|------|------|
| **Next.js** | 14.2.35 | App Router 사용 |
| **React** | 18.x | Server Components 기본 |
| **TypeScript** | 5.x | strict 모드 활성화 |
| **Tailwind CSS** | 3.4.x | v4 아님 주의! |
| **Node.js** | 20.x LTS | 권장 버전 |

## Supabase

| 기술 | 버전 | 비고 |
|------|------|------|
| **@supabase/supabase-js** | 2.90.x | 클라이언트 |
| **@supabase/ssr** | 0.8.x | SSR 지원 |
| **PostgreSQL** | 15.x | Supabase 기본 |

## 유틸리티

| 기술 | 버전 | 비고 |
|------|------|------|
| **date-fns** | 4.x | 날짜 처리 |
| **lucide-react** | 0.562.x | 아이콘 |
| **clsx** | 2.x | 클래스 조합 |
| **tailwind-merge** | 3.x | Tailwind 클래스 병합 |

---

## 주의사항

### 1. Tailwind CSS v3 vs v4

이 프로젝트는 **Tailwind CSS v3.4**를 사용합니다.
v4와 설정 방식이 완전히 다릅니다.

```javascript
// ✅ v3 방식 (현재 프로젝트)
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        warm: { ... },
        brand: { ... },
      },
    },
  },
}

// ❌ v4 방식 (사용하지 않음)
// @theme inline { ... }
```

### 2. Next.js App Router

Pages Router가 아닌 **App Router**를 사용합니다.

```
src/app/           # ✅ App Router
src/pages/         # ❌ 사용 안함
```

### 3. React Server Components

기본적으로 모든 컴포넌트는 Server Component입니다.
클라이언트 기능이 필요할 때만 `'use client'` 선언합니다.

```tsx
// Server Component (기본)
async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// Client Component (상호작용 필요시)
'use client'
function InteractiveComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState(...)}>Click</button>
}
```

---

## 버전 업데이트 정책

### 자동 업데이트 (권장)
- 패치 버전 (x.x.1 → x.x.2): 자동 허용
- 마이너 버전 (x.1.x → x.2.x): 테스트 후 적용

### 수동 검토 필요
- 메이저 버전 (1.x → 2.x): Breaking Changes 검토 필수
- Next.js 버전 업: 마이그레이션 가이드 확인

### 업데이트 명령어
```bash
# 현재 버전 확인
npm outdated

# 안전한 업데이트 (패치만)
npm update

# 특정 패키지 업데이트
npm install next@latest
```

---

## 환경 요구사항

### 개발 환경
- Node.js: 20.x LTS
- npm: 10.x
- Windows/macOS/Linux

### 배포 환경
- Vercel (권장)
- Node.js: 20.x

### Windows 특이사항

```powershell
# && 대신 ; 사용
cd C:\project; npm run dev

# Supabase CLI는 Scoop으로 설치
scoop install supabase
```

