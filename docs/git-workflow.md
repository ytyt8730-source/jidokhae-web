# Git 워크플로우 (1인 개발 + AI 에이전트)

> **버전**: 2.0  
> **마지막 업데이트**: 2026-01-17  
> **대상**: 영탁님 + AI 에이전트 (Cursor, Claude Code 등)

---

## 1. 이 프로젝트의 Git 원칙

```
✅ 단순하게 - 1인 개발이니까 복잡한 브랜치 전략 불필요
✅ 안전하게 - 민감정보 절대 커밋 금지
✅ 자주 커밋 - 작은 단위로 자주 저장
✅ 항상 동기화 - 작업 전 pull, 작업 후 push
```

---

## 2. 브랜치 전략 (단순화)

### 2.1 브랜치 구조

```
main                    ← 항상 동작하는 상태 유지
  └── feature/m[번호]-[작업명]  ← 마일스톤 단위 개발
```

**이게 끝입니다.** 복잡한 develop, release 브랜치 불필요.

### 2.2 브랜치 네이밍

| 상황 | 패턴 | 예시 |
|------|------|------|
| 마일스톤 작업 | `feature/m[번호]-[작업명]` | `feature/m3-notification` |
| 버그 수정 | `fix/[간단한설명]` | `fix/login-error` |
| 급한 수정 | main에 직접 | - |

### 2.3 브랜치 생명주기

```
1. main에서 feature 브랜치 생성
2. 작업 (여러 번 커밋)
3. 마일스톤 완료되면 main에 머지
4. feature 브랜치 삭제
```

---

## 3. 커밋 규칙

### 3.1 커밋 메시지 형식

```
[M번호] 타입: 한글 설명

예시:
[M2] feat: 카카오 로그인 연동
[M2] fix: 결제 웹훅 검증 오류 수정
[M3] docs: 알림 서비스 문서 추가
```

### 3.2 타입 종류

| 타입 | 언제 사용 |
|------|----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 정리 (기능 변화 없음) |
| `docs` | 문서 수정 |
| `chore` | 설정, 패키지 등 |

### 3.3 커밋 타이밍

| 상황 | 커밋 여부 |
|------|:--------:|
| Phase 하나 완료 | ✅ 필수 |
| 중간 저장 (퇴근 전, 자리 비움) | ✅ 권장 |
| 작은 기능 하나 완료 | ✅ 권장 |
| 코드 작성 중 (미완성) | ⚠️ WIP 접두사 |

**WIP 커밋** (작업 중 저장):
```
[M3] WIP: 알림 서비스 작업 중
```

---

## 4. AI 에이전트 필수 규칙

### 4.1 커밋 전 반드시 확인

```bash
# 1. 민감정보 체크 (필수!)
git diff --staged | grep -i "password\|secret\|key\|token"

# 2. .env 파일 포함 여부 (절대 안 됨!)
git status | grep ".env"

# 3. 타입 에러
npx tsc --noEmit

# 4. 빌드 확인
npm run build
```

### 4.2 절대 커밋하면 안 되는 것

```
❌ .env.local (실제 API 키)
❌ .env*.local (모든 로컬 환경변수)
❌ node_modules/
❌ .next/
❌ 하드코딩된 API 키, 비밀번호
❌ 개인정보 (전화번호, 이메일 등)
```

### 4.3 AI가 Git 작업 시 순서

```
1. 현재 브랜치 확인
   git branch

2. 원격 변경사항 확인
   git fetch origin
   git status

3. 변경사항 있으면 pull 먼저
   git pull origin [브랜치명]

4. 작업 수행

5. 커밋 전 체크
   - npx tsc --noEmit
   - npm run build
   - 민감정보 확인

6. 커밋 + 푸시
   git add .
   git commit -m "[M번호] 타입: 설명"
   git push origin [브랜치명]
```

### 4.4 AI가 절대 하면 안 되는 것

```
❌ git push --force (히스토리 덮어쓰기)
❌ main 브랜치에서 직접 작업 (feature 브랜치 사용)
❌ 사용자 확인 없이 브랜치 삭제
❌ 사용자 확인 없이 머지
```

---

## 5. 여러 컴퓨터에서 작업할 때

### 5.1 작업 시작 전 (필수!)

```bash
# 1. 최신 코드 가져오기
git fetch origin
git pull origin [현재브랜치]

# 2. 충돌 있으면 해결 후 진행
```

### 5.2 작업 종료 시 (필수!)

```bash
# 1. 모든 변경사항 커밋
git add .
git commit -m "[M번호] 타입: 설명"

# 2. 푸시
git push origin [현재브랜치]
```

### 5.3 컴퓨터 전환 시 주의

```
⚠️ A 컴퓨터에서 푸시 안 하고 → B 컴퓨터에서 작업 시작
   = 충돌 발생!

✅ 항상 푸시하고 자리 뜨기
✅ 항상 풀 하고 작업 시작
```

---

## 6. 마일스톤별 Git 흐름

### 6.1 마일스톤 시작

```bash
# main에서 새 브랜치 생성
git checkout main
git pull origin main
git checkout -b feature/m3-notification
git push -u origin feature/m3-notification
```

### 6.2 마일스톤 진행 중

```bash
# Phase 완료마다 커밋
git add .
git commit -m "[M3] feat: Phase 1 알림 인프라 구축"
git push origin feature/m3-notification
```

### 6.3 마일스톤 완료

```bash
# 1. 최종 커밋
git add .
git commit -m "[M3] feat: M3 알림시스템 완료"
git push origin feature/m3-notification

# 2. main으로 머지 (사용자 확인 후)
git checkout main
git pull origin main
git merge feature/m3-notification
git push origin main

# 3. feature 브랜치 삭제 (선택)
git branch -d feature/m3-notification
git push origin --delete feature/m3-notification
```

---

## 7. 문제 상황 대응

### 7.1 충돌 발생 시

```bash
# 1. 충돌 파일 확인
git status

# 2. 파일 열어서 충돌 해결
#    <<<<<<< HEAD
#    현재 내 코드
#    =======
#    원격 코드
#    >>>>>>> origin/main

# 3. 해결 후 커밋
git add .
git commit -m "[M3] fix: 머지 충돌 해결"
git push
```

### 7.2 실수로 민감정보 커밋했을 때

```bash
# ⚠️ 즉시 사용자에게 알리기!
# 1. 아직 푸시 안 했으면
git reset --soft HEAD~1  # 커밋 취소
# 민감정보 제거 후 다시 커밋

# 2. 이미 푸시했으면
# → 해당 API 키/비밀번호 즉시 재발급 필요!
# → 사용자에게 반드시 알리기
```

### 7.3 잘못된 브랜치에서 작업했을 때

```bash
# 1. 변경사항 임시 저장
git stash

# 2. 올바른 브랜치로 이동
git checkout feature/m3-notification

# 3. 변경사항 복원
git stash pop
```

---

## 8. 빠른 참조

### 자주 쓰는 명령어

| 상황 | 명령어 |
|------|--------|
| 현재 상태 확인 | `git status` |
| 브랜치 확인 | `git branch` |
| 원격 변경 확인 | `git fetch origin` |
| 변경사항 가져오기 | `git pull origin [브랜치]` |
| 커밋 | `git add . && git commit -m "메시지"` |
| 푸시 | `git push origin [브랜치]` |
| 브랜치 생성+이동 | `git checkout -b [브랜치명]` |
| 브랜치 이동 | `git checkout [브랜치명]` |

### 커밋 메시지 예시

```
[M1] feat: 회원가입 폼 UI 구현
[M2] feat: 포트원 결제 연동
[M2] fix: 환불 금액 계산 오류 수정
[M3] docs: 알림 서비스 설정 문서 추가
[M3] WIP: 솔라피 연동 작업 중
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-14 | 1.0 | 최초 작성 (팀 개발용) |
| 2026-01-17 | 2.0 | 1인 개발 + AI 에이전트용으로 전면 개편 |
