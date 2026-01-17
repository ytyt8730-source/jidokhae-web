# 롤백 절차 가이드

## Vercel 배포 롤백

### 방법 1: Vercel CLI

```bash
# 최근 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback <deployment-url>

# 예시
vercel rollback jidokhae-abc123.vercel.app
```

### 방법 2: Vercel 대시보드

1. https://vercel.com/dashboard 접속
2. 프로젝트 선택 → Deployments 탭
3. 안정적인 이전 배포 찾기
4. 우측 메뉴 (⋮) → "Promote to Production" 클릭

### 방법 3: Git Revert

```bash
# 마지막 커밋 되돌리기
git revert HEAD --no-edit
git push origin main

# 특정 커밋으로 되돌리기
git revert <commit-hash> --no-edit
git push origin main
```

---

## 데이터베이스 롤백

### Supabase 백업 복원

1. Supabase 대시보드 → Database → Backups
2. 복원할 시점 선택
3. "Restore" 클릭

⚠️ **주의**: 복원 시 현재 데이터가 덮어씌워집니다.

### 수동 SQL 롤백

마이그레이션 실행 전 롤백 스크립트 준비:

```sql
-- 예시: 테이블 추가 롤백
DROP TABLE IF EXISTS new_table;

-- 예시: 컬럼 추가 롤백
ALTER TABLE users DROP COLUMN IF EXISTS new_column;

-- 예시: 트리거 삭제
DROP TRIGGER IF EXISTS trigger_name ON table_name;
DROP FUNCTION IF EXISTS function_name();
```

---

## 환경 변수 롤백

### Vercel 환경 변수

1. Vercel 대시보드 → Settings → Environment Variables
2. 이전 값으로 수동 변경
3. Redeploy 트리거

### 로컬 환경

```bash
# .env.local 백업
cp .env.local .env.local.backup

# 이전 버전으로 복원
cp .env.local.previous .env.local

# 서버 재시작
npm run dev
```

---

## 롤백 체크리스트

### 배포 롤백 전

- [ ] 현재 문제 상황 정확히 파악
- [ ] 롤백 대상 버전 확인 (문제 없던 버전인지)
- [ ] 데이터베이스 호환성 확인 (스키마 변경 여부)
- [ ] 팀원/운영자에게 알림

### 배포 롤백 후

- [ ] 서비스 정상 동작 확인
- [ ] 핵심 기능 테스트 (로그인, 결제 등)
- [ ] 에러 로그 모니터링
- [ ] 장애 리포트 작성

---

## 롤백 불가능한 경우

### 1. 데이터베이스 스키마가 변경된 경우

- 이전 코드가 새 스키마와 호환되지 않음
- **해결**: 핫픽스 배포 또는 DB 롤백 병행

### 2. 외부 API 버전이 변경된 경우

- 이전 코드가 새 API와 호환되지 않음
- **해결**: API 버전 협의 또는 핫픽스

### 3. 사용자 데이터가 마이그레이션된 경우

- 데이터 롤백 시 사용자 데이터 손실 위험
- **해결**: 신중히 검토 후 결정

