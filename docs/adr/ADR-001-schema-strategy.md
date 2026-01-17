# ADR-001: 데이터베이스 스키마 관리 전략

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- AI 에이전트가 여러 Work Package에서 테이블을 생성하게 됨
- 분산된 마이그레이션 파일은 함수 충돌, 스키마 불일치 위험
- 개발 환경 재구축 시 복잡한 마이그레이션 순서 관리 필요

### 현재 상황
- `/supabase/migrations/001_initial_schema.sql` 단일 파일로 시작
- MVP 개발 중 스키마 변경이 빈번할 예정

## 고려한 대안

### 대안 1: 분산 마이그레이션 파일
```
supabase/migrations/
├── 001_users.sql
├── 002_meetings.sql
├── 003_registrations.sql
└── 004_add_praises.sql
```
- 장점: Git 히스토리로 변경 추적 용이
- 단점: 함수/트리거 충돌 위험, 순서 관리 복잡

### 대안 2: 단일 마스터 스키마 파일 (선택)
```
supabase/
├── schema.sql              # 마스터 스키마
└── migrations/             # 프로덕션 변경 기록
    └── 001_initial_schema.sql
```
- 장점: 전체 스키마 한눈에 파악, 충돌 방지, 새 환경 설정 1단계
- 단점: 프로덕션 마이그레이션 별도 관리 필요

## 결정

**단일 마스터 스키마 파일** 방식 채택

### 관리 규칙

1. **개발 중 (MVP)**
   - `supabase/schema.sql` 파일이 진실의 원천(source of truth)
   - 각 WP 작업 후 schema.sql에 변경사항 통합
   - 개발 DB는 schema.sql 전체 재실행으로 동기화

2. **프로덕션 반영 시**
   - 변경 사항만 추출하여 migrations/ 폴더에 순차적 SQL 생성
   - 예: `migrations/002_add_praises_table.sql`

3. **AI 에이전트 규칙**
   - 새 테이블/함수 추가 시 반드시 schema.sql에 통합
   - 분산 파일 생성 금지

## 결과

### 긍정적 영향
- 스키마 충돌 위험 제거
- 새 개발 환경 설정이 단일 SQL 실행으로 완료
- AI 에이전트가 전체 스키마 파악 용이

### 주의사항
- 프로덕션 배포 전 변경 사항 추출 작업 필요
- schema.sql과 실제 DB 동기화 상태 수시 확인

---

## 관련 파일
- `jidokhae/supabase/schema.sql` ✅ 생성됨
- `jidokhae/supabase/migrations/001_initial_schema.sql` ✅ 생성됨

