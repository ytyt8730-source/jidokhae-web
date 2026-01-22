# 자동화 스크립트

> 지독해 웹서비스 개발을 위한 자동화 스크립트 모음

## 빠른 시작

```bash
# Windows에서 Git Bash 또는 WSL 사용 권장
cd C:/Cursor/jidokhae-web

# 스크립트 실행 권한 부여
chmod +x scripts/*.sh
```

---

## 스크립트 목록

### 개발 워크플로우

| 스크립트 | 용도 | 사용 시점 |
|---------|------|----------|
| `start-coding.sh` | 코딩 시작 전 체크 | 작업 시작할 때 |
| `status.sh` | 현재 상태 확인 | 언제든지 |
| `check-all.sh` | 전체 검사 (타입/빌드/린트) | 커밋 전 |
| `pre-commit.sh` | 커밋 전 검사 (빠른 버전) | 커밋 직전 |

### 코드 생성

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `create-component.sh` | 컴포넌트 템플릿 생성 | `./scripts/create-component.sh Button client` |
| `create-api.sh` | API 라우트 템플릿 생성 | `./scripts/create-api.sh admin/users GET,POST` |
| `scaffold-phase.sh` | 빈 깡통 파일 구조 생성 | `./scripts/scaffold-phase.sh M5 1` |

### 환경 & 배포

| 스크립트 | 용도 | 사용 시점 |
|---------|------|----------|
| `check-env.sh` | 환경 변수 검증 | 개발 시작 시, 배포 전 |
| `deploy-check.sh` | 배포 전 종합 검사 | 프로덕션 배포 전 |

### 데이터베이스

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `db-migrate.sh` | 마이그레이션 가이드 | `./scripts/db-migrate.sh order` |
| `gen-types.sh` | Supabase 타입 생성 | `./scripts/gen-types.sh` |

### 테스트

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `test-cron.sh` | Cron 작업 로컬 테스트 | `./scripts/test-cron.sh reminder` |
| `test-api.sh` | API 엔드포인트 테스트 | `./scripts/test-api.sh` |

### Git 관리

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `clean-branches.sh` | 브랜치 정리 | `./scripts/clean-branches.sh merged` |

### 컨텍스트 생성 (Claude 대화용)

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `pack_context.py` | 전체 컨텍스트 패킹 | `python scripts/pack_context.py` |
| `context-diff.sh` | 변경분 컨텍스트 | `./scripts/context-diff.sh 3` |
| `check-file-size.py` | 파일 크기 검사 (Hook용) | 자동 실행 |

### S급 품질 관리 (v2.5)

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `quality-gate.sh` | S급 품질 검사 | `./scripts/quality-gate.sh` |
| `pipeline-logger.sh` | 파이프라인 로깅 | `./scripts/pipeline-logger.sh phase-start M5 1` |
| `rollback.sh` | 자동 롤백 | `./scripts/rollback.sh M5 1` |

### 유틸리티

| 스크립트 | 용도 | 예시 |
|---------|------|------|
| `count-lines.sh` | 코드 라인 수 통계 | `./scripts/count-lines.sh` |
| `find-pattern.sh` | 코드 패턴 검색 | `./scripts/find-pattern.sh "console.log"` |

---

## 상세 사용법

### 1. start-coding.sh - 코딩 시작

```bash
./scripts/start-coding.sh
```

**체크 항목:**
- 현재 브랜치가 main인지 확인 (main이면 경고)
- 커밋되지 않은 변경사항 표시
- current-state.md 요약 출력

**출력 예시:**
```
🔍 코딩 시작 전 체크...

📌 현재 브랜치: feature/m7-polish
✅ 브랜치 OK

📝 커밋되지 않은 변경사항:
 M src/app/page.tsx

✅ 준비 완료! 코딩을 시작하세요.

💡 다음 명령어:
  @agent-코딩 Phase [N] 구현해줘
```

---

### 2. check-all.sh - 전체 검사

```bash
./scripts/check-all.sh
```

**검사 항목:**
1. TypeScript 타입 체크 (`npx tsc --noEmit`)
2. 프로덕션 빌드 (`npm run build`)
3. ESLint (`npm run lint`)
4. .env 파일 staged 여부

**출력 예시:**
```
=== 전체 검사 시작 ===

1️⃣ 타입 체크...
   ✅ 타입 체크 통과

2️⃣ 빌드...
   ✅ 빌드 성공

3️⃣ 린트...
   ✅ 린트 통과

4️⃣ .env 파일 staged 체크...
   ✅ .env 파일 안전

=== 검사 결과 ===

| 항목 | 결과 |
|------|:----:|
| 타입 체크 | ✅ |
| 빌드 | ✅ |
| 린트 | ✅ |

✅ 모든 검사 통과! 커밋 가능합니다.

💡 다음 명령어:
  @agent-Git 커밋해줘
```

---

### 3. create-component.sh - 컴포넌트 생성

```bash
./scripts/create-component.sh [컴포넌트명] [타입]
```

**타입:**
- `client` - 클라이언트 컴포넌트 (기본)
- `server` - 서버 컴포넌트
- `page` - 페이지 컴포넌트

**예시:**
```bash
./scripts/create-component.sh Button client
./scripts/create-component.sh UserList server
./scripts/create-component.sh AdminDashboard page
```

---

### 4. create-api.sh - API 라우트 생성

```bash
./scripts/create-api.sh [경로] [메소드]
```

**예시:**
```bash
./scripts/create-api.sh admin/users GET,POST
./scripts/create-api.sh registrations/cancel POST
./scripts/create-api.sh cron/cleanup GET
```

**생성되는 파일:**
- `jidokhae/src/app/api/{경로}/route.ts`

---

### 5. check-env.sh - 환경 변수 검증

```bash
./scripts/check-env.sh
```

**검사 항목:**
- 필수 변수: SUPABASE_URL, SUPABASE_ANON_KEY 등
- 결제 변수: PORTONE_* (선택)
- 알림 변수: SOLAPI_* (선택)

---

### 6. deploy-check.sh - 배포 전 검사

```bash
./scripts/deploy-check.sh
```

**검사 항목:**
1. Git 상태 (main 브랜치, 커밋 상태)
2. 환경 변수
3. 의존성 (node_modules)
4. TypeScript 타입 체크
5. 프로덕션 빌드
6. ESLint
7. SQL 마이그레이션 파일
8. Vercel 설정

---

### 7. test-cron.sh - Cron 테스트

```bash
# 개발 서버 실행 필요
cd jidokhae && npm run dev

# 다른 터미널에서
./scripts/test-cron.sh reminder
./scripts/test-cron.sh afterglow
./scripts/test-cron.sh all  # 전체 테스트
```

**사용 가능한 Cron:**
- reminder, waitlist, monthly
- segment-reminder, post-meeting, auto-complete
- welcome, first-meeting-followup, eligibility-warning
- afterglow, transfer-timeout

---

### 8. db-migrate.sh - DB 마이그레이션

```bash
./scripts/db-migrate.sh list   # 파일 목록
./scripts/db-migrate.sh order  # 실행 순서 가이드
./scripts/db-migrate.sh check  # 문법 검사
./scripts/db-migrate.sh show migration-v1.2.0-full-reset.sql
```

---

### 9. clean-branches.sh - 브랜치 정리

```bash
./scripts/clean-branches.sh list    # 모든 브랜치
./scripts/clean-branches.sh merged  # 머지된 브랜치
./scripts/clean-branches.sh stale   # 오래된 브랜치
./scripts/clean-branches.sh clean   # 머지된 브랜치 삭제
./scripts/clean-branches.sh prune   # 원격 참조 정리
```

---

### 10. context-diff.sh - 변경분 컨텍스트

```bash
./scripts/context-diff.sh      # 최근 1일 (기본)
./scripts/context-diff.sh 3    # 최근 3일
./scripts/context-diff.sh 7    # 최근 7일
```

**출력 내용:**
- 현재 Git 상태 (브랜치, 미커밋 파일)
- 최근 커밋 목록
- 변경된 파일
- current-state.md 요약

**사용 시점:**
- Claude와 이어서 작업할 때
- 빠른 현황 파악이 필요할 때

---

### Claude와 대화 시작할 때

```bash
# 방법 1: 에이전트 사용 (권장)
@agent-컨텍스트 전체 파악해줘

# 방법 2: 직접 스크립트 실행 후 결과 공유
python scripts/pack_context.py --max-tokens 30000
# → _CONTEXT_PACK.txt 내용을 Claude에게 공유

# 방법 3: 변경분만 빠르게
./scripts/context-diff.sh
```

---

### 11. scaffold-phase.sh - 빈 깡통 생성 (컨텍스트 엔지니어링)

```bash
./scripts/scaffold-phase.sh M5 1    # M5 Phase 1
./scripts/scaffold-phase.sh M6 2    # M6 Phase 2
```

**빈 깡통 전략**:
- Scenario/WP 문서에서 파일 경로 추출
- 빈 파일 미리 생성 (기본 템플릿 포함)
- 에이전트는 내용만 채우면 됨 → 컨텍스트 절약

**출력 예시**:
```
🏗️ M5 Phase 1 파일 구조 생성 중...

📄 참조 파일: roadmap/scenarios/SC-M5.md

📁 발견된 파일 경로:
   src/app/admin/page.tsx
   src/components/Dashboard.tsx

  ✅ Created: src/app/admin/page.tsx
  ⏭️ Exists: src/components/Dashboard.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ 생성된 파일: 1개
  ⏭️ 이미 존재: 1개

👉 이제 @agent-파이프라인이 내용을 채웁니다.
```

---

### 12. quality-gate.sh - S급 품질 검사

```bash
./scripts/quality-gate.sh
```

**검사 항목:**
| 항목 | 기준 | 결과 |
|------|------|------|
| 파일 크기 | 200줄 이하 | ❌ 에러 |
| console.log | 0개 | ❌ 에러 |
| as any | 0개 | ❌ 에러 |
| 미구현 TODO | 경고만 | ⚠️ 경고 |
| 접근성 | aria-label, alt | ⚠️ 경고 |

**출력 예시:**
```
🔍 품질 게이트 검사 시작...

1️⃣ 파일 크기 검사 (200줄 제한)...
   ✅ 통과

2️⃣ console.log 검사...
   ✅ 통과

3️⃣ 'as any' 타입 검사...
   ✅ 통과

4️⃣ 미구현 TODO 검사...
   ✅ 통과

5️⃣ 접근성 검사...
   ✅ 통과

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 품질 게이트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ❌ 에러: 0개
   ⚠️ 경고: 0개

✅ 품질 게이트 통과!
```

---

### 13. pipeline-logger.sh - 파이프라인 로깅

```bash
# 마일스톤 시작
./scripts/pipeline-logger.sh start M5

# Phase 시작
./scripts/pipeline-logger.sh phase-start M5 1

# Phase 완료
./scripts/pipeline-logger.sh phase-end M5 1

# 에러 기록
./scripts/pipeline-logger.sh error M5 1 "빌드 실패"

# 마일스톤 완료
./scripts/pipeline-logger.sh complete M5

# 롤백 기록
./scripts/pipeline-logger.sh rollback M5 1 "이전 Phase로 롤백"
```

**로그 파일:**
- `log/pipeline-M5.log` - 텍스트 로그
- `log/pipeline-status.json` - JSON 상태

---

### 14. rollback.sh - 자동 롤백

```bash
./scripts/rollback.sh M5 2    # M5 Phase 2 롤백
```

**동작:**
1. 이전 Phase 커밋 찾기
2. 현재 변경사항 스태시 백업
3. git reset --hard로 롤백
4. 복구 안내 출력

**복구 방법:**
```bash
# 스태시된 변경사항 복구
git stash pop

# 스태시 목록 확인
git stash list
```

---

### 15. test-api.sh - API 엔드포인트 테스트

```bash
# 기본 (localhost:3000)
./scripts/test-api.sh

# 커스텀 URL
./scripts/test-api.sh http://localhost:3001
```

**사전 조건:** 개발 서버 실행 필요
```bash
cd jidokhae && npm run dev
```

**테스트 항목:**
- 홈페이지 (GET /)
- 공개 API (GET /api/meetings, /api/banners)
- 인증 필요 API (401 예상)
- 관리자 API (401 예상)

---

## 권장 워크플로우

### 일반 개발

```bash
# 1. 상태 확인
./scripts/status.sh

# 2. 코딩 시작 체크
./scripts/start-coding.sh

# 3. 코딩...

# 4. 커밋 전 검사
./scripts/check-all.sh

# 5. 커밋 (에이전트 사용)
# @agent-Git 커밋해줘
```

### 새 기능 개발

```bash
# 1. 컴포넌트 생성
./scripts/create-component.sh NewFeature client

# 2. API 라우트 생성
./scripts/create-api.sh features/new GET,POST

# 3. 개발...

# 4. Cron 테스트 (필요시)
./scripts/test-cron.sh new-feature
```

### 배포

```bash
# 1. 배포 전 종합 검사
./scripts/deploy-check.sh

# 2. 환경 변수 검증
./scripts/check-env.sh

# 3. 브랜치 정리
./scripts/clean-branches.sh clean

# 4. 배포
git push origin main
```

---

## Git Hook 설정 (선택)

커밋 시 자동 검사를 원하면:

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## 트러블슈팅

### 스크립트 실행 권한 오류

```bash
chmod +x scripts/*.sh
```

### Windows에서 실행 안 됨

Git Bash 또는 WSL 사용:
```bash
# Git Bash
/c/Cursor/jidokhae-web/scripts/check-all.sh

# WSL
cd /mnt/c/Cursor/jidokhae-web && ./scripts/check-all.sh
```

### 경로 오류

프로젝트 루트(`C:/Cursor/jidokhae-web`)에서 실행하세요.

---

## 버전

- Last updated: 2026-01-22
- 버전: v2.5 (S급 품질 시스템)
- 총 스크립트: 22개
