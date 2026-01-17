# 환경 변수 템플릿

> **사용법**: 이 파일을 복사하여 `.env.local`로 저장한 후 실제 값을 입력하세요.
>
> **주의**: `.env.local`은 절대 Git에 커밋하지 마세요!

---

## 필수 환경 변수

```bash
# ============================================
# Supabase
# ============================================
# Supabase Dashboard → Settings → API에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# ============================================
# 포트원 V2 결제
# ============================================
# 포트원 관리자 → 결제연동 → 연동 정보 → V2 API 탭
# ⚠️ TC0ONETIM은 V1용입니다. V2는 store-로 시작합니다.
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 서버 전용 (환불/취소 처리에 필요)
# 포트원 관리자 → 결제연동 → 연동 정보에서 확인
PORTONE_API_SECRET=PortOneSecret-xxxxx
PORTONE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## M3 이후 추가 (알림톡)

```bash
# ============================================
# 솔라피 (알림톡)
# ============================================
# 솔라피 콘솔 → 설정 → API 키 관리
SOLAPI_API_KEY=xxxxx
SOLAPI_API_SECRET=xxxxx
SOLAPI_SENDER=01012345678
SOLAPI_KAKAO_PFID=@지독해
```

---

## 선택 환경 변수

```bash
# ============================================
# 모니터링 (선택)
# ============================================
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# 개발/디버그 (선택)
# ============================================
LOG_LEVEL=debug
```

---

## 환경 변수 확인 방법

| 서비스 | 확인 경로 |
|--------|----------|
| Supabase | https://supabase.com/dashboard → 프로젝트 → Settings → API |
| 포트원 V2 | https://admin.portone.io → 결제연동 → 연동 정보 → **V2 API** 탭 |
| 솔라피 | https://console.solapi.com → 설정 → API 키 관리 |

---

## 상세 문서

환경 변수에 대한 자세한 설명은 [`/docs/env-variables.md`](/docs/env-variables.md)를 참조하세요.
