---
name: commit-guide
description: 지독해 Git 커밋 및 워크플로우 규칙
disable-model-invocation: true
---

# 지독해 Git & Commit Guide

> 이 스킬은 Git 워크플로우와 커밋 메시지 규칙을 제공합니다.

## 커밋 메시지 형식

```
[M번호] 타입: 한글 설명

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 타입
| 타입 | 설명 | 예시 |
|------|------|------|
| feat | 새 기능 | `[M2] feat: 결제 API 구현` |
| fix | 버그 수정 | `[M2] fix: 결제 금액 계산 오류 수정` |
| refactor | 리팩토링 | `[M1] refactor: 인증 로직 분리` |
| perf | 성능 개선 | `[M5] perf: 목록 쿼리 최적화` |
| style | 스타일 변경 | `[M1.5] style: 버튼 호버 애니메이션` |
| docs | 문서 변경 | `[M1] docs: API 명세 추가` |
| test | 테스트 추가 | `[M1] test: 유틸리티 함수 테스트` |
| chore | 빌드/설정 | `chore: ESLint 규칙 업데이트` |

## 브랜치 전략

### 브랜치 네이밍
```
feature/m[번호]-[작업명]   # 기능 개발
fix/[이슈명]              # 버그 수정
refactor/[대상]           # 리팩토링
```

예시:
- `feature/m2-payment`
- `fix/login-error`
- `refactor/auth-logic`

### 워크플로우

```bash
# 1. 최신 코드 동기화
git fetch && git pull origin main

# 2. 작업 브랜치 생성
git checkout -b feature/m[번호]-[작업명]

# 3. 작업 후 커밋 전 검증
npx tsc --noEmit && npm run build && npm run lint

# 4. 커밋 (HEREDOC 사용)
git commit -m "$(cat <<'EOF'
[M번호] 타입: 한글 설명

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# 5. 푸시
git push -u origin feature/m[번호]-[작업명]

# 6. PR 생성 (사용자 확인 후)
gh pr create --title "[M번호] 제목" --body "..."
```

## 커밋 전 체크리스트

### 필수 검증
```bash
npx tsc --noEmit    # 타입 에러 0개
npm run build       # 빌드 성공
npm run lint        # 린트 통과
npm run test:run    # 테스트 통과 (있는 경우)
```

### 커밋 금지 파일
- ❌ `.env.local`
- ❌ `*.log`
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ 민감 정보 포함 파일

## 절대 금지

### Git 명령어
- ❌ `git push --force` (main/master)
- ❌ `git reset --hard` (확인 없이)
- ❌ `git checkout .` (확인 없이)
- ❌ `git clean -f` (확인 없이)
- ❌ `git branch -D` (확인 없이)

### 행동
- ❌ main 브랜치에서 직접 작업
- ❌ 사용자 확인 없이 머지/삭제
- ❌ pre-commit hook 우회 (--no-verify)
- ❌ 커밋 후 amend (새 커밋 생성)

## PR 템플릿

```markdown
## Summary
- 변경 사항 1
- 변경 사항 2

## Test plan
- [ ] 테스트 항목 1
- [ ] 테스트 항목 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 마일스톤 참조

| M | 이름 | 범위 |
|---|------|------|
| M1 | Infrastructure | 인증, 기본 UI |
| M1.5 | Design System | Framer Motion, 폰트 |
| M2 | Payment | 결제, 환불 |
| M3 | Notification | 알림톡 |
| M4 | Engagement | 칭찬, 뱃지 |
| M5 | Admin | 관리자 도구 |
| M6 | Launch | 랜딩, 출시 |
| M7 | Polish | 개선, 성장 |
