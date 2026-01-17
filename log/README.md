# 개발 로그 (Development Log)

이 폴더는 AI 에이전트와의 협업을 위한 개발 로그를 관리합니다.

## 목적

1. **세션 간 컨텍스트 유지**: AI 에이전트가 이전 작업 상태를 파악
2. **트러블슈팅 기록**: 발생한 문제와 해결 방법 기록
3. **작업 진행 추적**: Work Package별 완료 상태 관리

## 파일 명명 규칙

### WP 완료 로그
```
WP[번호]-[작업명]-완료-로그.md
예: WP-M1-기반구축-완료-로그.md
```

### 비정규 작업 (접두사 사용)
```
FEAT-[기능명].md       # 새 기능 추가
FIX-[버그명].md        # 버그 수정
REFACTOR-[대상].md     # 코드 리팩토링
PERF-[개선사항].md     # 성능 개선
HOTFIX-[긴급수정].md   # 긴급 핫픽스
```

### 주요 파일

| 파일 | 용도 |
|------|------|
| `current-state.md` | 현재 작업 상태 (AI 에이전트용) |
| `user-progress-note.md` | 비개발자용 진행 요약 |
| `troubleshooting.md` | 문제 해결 기록 |

---

## WP 완료 로그 템플릿

```markdown
# WP[번호]: [작업명] 완료 로그

> **작성일**: YYYY-MM-DD  
> **Work Package**: WP[번호]  
> **목표**: [한 줄 목표]  
> **상태**: ✅ 완료

## 📌 요약 (3줄 이내)
- 
- 
- 

## ✅ 완료된 작업

| 작업 | 설명 | 상태 |
|------|------|------|
| 작업 1 | 설명 | ✅ |
| 작업 2 | 설명 | ✅ |

## 📁 수정된 파일

> 코드는 포함하지 않고 경로만 기록

- `src/app/page.tsx` - 홈 화면 UI 구성
- `src/lib/supabase/server.ts` - Supabase 클라이언트

## 🔧 필요한 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## ⚡ 빠른 참조 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build
```

## ⚠️ 트러블슈팅

### 문제 1: [문제 제목]
- **증상**: 
- **원인**: 
- **해결**: 

## 🔙 롤백 방법

```bash
# 이전 커밋으로 롤백
git revert HEAD --no-edit
git push

# 또는 Vercel 롤백
vercel rollback
```

## 📋 다음 작업

- [ ] 다음 WP 시작
- [ ] 남은 이슈 처리
```

---

## 현재 상태 파일 규칙

매 작업 세션 종료 시 `current-state.md` 업데이트:
- 현재 작업 중인 WP
- 마지막 완료 작업
- 다음 작업
- 현재 이슈/블로커
- 관련 파일 (최근 수정)

---

## 코드 기록 금지

- 파일 경로만 기록 (코드 전체 복사 X)
- 변경 의도/이유 기록
- Git 커밋 메시지 수준의 요약
- 100~200줄 이내로 유지

---

## 관련 문서

- [Milestones](/roadmap/milestones.md)
- [Work Packages](/roadmap/work-packages/)
- [Scenarios](/roadmap/scenarios/)

