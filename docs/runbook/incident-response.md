# 장애 대응 가이드 (Incident Response)

## 장애 등급 정의

| 등급 | 설명 | 예시 | 대응 시간 |
|------|------|------|----------|
| **P0 (Critical)** | 전체 서비스 불가 | 결제 불가, 전체 다운 | 15분 |
| **P1 (High)** | 핵심 기능 장애 | 로그인 불가, 특정 페이지 오류 | 1시간 |
| **P2 (Medium)** | 비핵심 기능 장애 | 알림 발송 실패, UI 버그 | 24시간 |
| **P3 (Low)** | 미미한 문제 | 오타, 스타일 깨짐 | 1주 |

---

## P0 대응 절차

### 1. 전체 서비스 다운

```bash
# 1. Vercel 상태 확인
# https://www.vercel-status.com/

# 2. Supabase 상태 확인
# https://status.supabase.com/

# 3. 최근 배포 롤백 (Vercel)
vercel rollback

# 또는 Git으로 이전 커밋 배포
git revert HEAD --no-edit
git push origin main
```

### 2. 결제 불가

```bash
# 1. 포트원 상태 확인
# https://portone.io/status

# 2. 웹훅 로그 확인 (Supabase)
SELECT * FROM payment_logs 
ORDER BY created_at DESC 
LIMIT 20;

# 3. 임시 조치: 계좌이체 안내
# - 공지 배너 "현재 카드 결제 점검 중. 계좌이체 문의: xxx"
```

### 3. 데이터베이스 접근 불가

```bash
# 1. Supabase 대시보드 접속
# https://supabase.com/dashboard

# 2. 연결 수 확인 (무료 티어 제한)

# 3. 긴급 연락
# - Supabase Support: support@supabase.io
```

---

## P1 대응 절차

### 1. 로그인/회원가입 불가

```typescript
// 1. Supabase Auth 상태 확인
const { data, error } = await supabase.auth.getSession()
console.log({ data, error })

// 2. 환경 변수 확인
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### 2. 특정 페이지 500 에러

```bash
# 1. Vercel 로그 확인
vercel logs --follow

# 2. 에러 발생 시점 배포 확인
vercel ls

# 3. 해당 배포 롤백
vercel rollback <deployment-url>
```

---

## P2 대응 절차

### 1. 알림톡 발송 실패

```bash
# 1. 솔라피 대시보드 확인
# https://console.solapi.com/

# 2. 발송 로그 확인
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 50;

# 3. 수동 재발송 (Supabase Function 또는 API 호출)
```

### 2. 실시간 업데이트 안됨

```typescript
// Supabase Realtime 채널 상태 확인
const channel = supabase.channel('test')
channel.subscribe((status) => {
  console.log('Channel status:', status)
})
```

---

## 연락처

| 역할 | 이름 | 연락처 |
|------|------|--------|
| 메인 운영자 | - | - |
| 개발 담당 | - | - |

---

## 외부 서비스 상태 페이지

| 서비스 | 상태 페이지 |
|--------|------------|
| Vercel | https://www.vercel-status.com/ |
| Supabase | https://status.supabase.com/ |
| 포트원 | https://portone.io/status |
| 솔라피 | https://console.solapi.com/ |
| 카카오 | https://developers.kakao.com/status |

---

## 사후 분석 (Post-mortem)

장애 해결 후 반드시 기록:

```markdown
## [날짜] 장애 리포트

### 요약
- 장애 등급: P?
- 발생 시간: HH:MM ~ HH:MM (약 X분)
- 영향 범위: 

### 타임라인
- HH:MM - 장애 감지
- HH:MM - 원인 파악
- HH:MM - 조치 완료
- HH:MM - 정상화 확인

### 근본 원인
- 

### 조치 내용
- 

### 재발 방지
- 
```

