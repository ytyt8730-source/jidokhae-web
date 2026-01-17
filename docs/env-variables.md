# 환경 변수 목록

> **버전**: 1.1  
> **마지막 업데이트**: 2026-01-17

---

## 빠른 시작

환경 변수 템플릿을 복사하여 사용하세요:
- **템플릿**: [`/jidokhae/ENV_TEMPLATE.md`](/jidokhae/ENV_TEMPLATE.md)

외부 서비스 설정 방법은 다음 문서를 참조하세요:
- **설정 가이드**: [`/docs/external-services.md`](/docs/external-services.md)

---

## 필수 환경 변수

### Supabase

| 변수명 | 설명 | 노출 범위 |
|--------|------|:---------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 익명 API 키 | 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키 | **서버 전용** |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되면 안됩니다.

### 결제 (포트원 V2)

| 변수명 | 설명 | 노출 범위 |
|--------|------|:---------:|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | V2 Store ID | 클라이언트 |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | 결제 채널 키 | 클라이언트 |
| `PORTONE_API_SECRET` | V2 API 시크릿 | **서버 전용** |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 검증용 | **서버 전용** |

> ⚠️ **V1/V2 주의**: `TC0ONETIM`은 V1용 테스트 코드입니다. V2는 `store-xxxxx` 형식입니다.  
> 상세 내용: [외부 서비스 설정 - 포트원](/docs/external-services.md#3-포트원-v2-결제)

### 알림톡 (솔라피) - M3 이후

| 변수명 | 설명 | 노출 범위 |
|--------|------|:---------:|
| `SOLAPI_API_KEY` | API 키 | **서버 전용** |
| `SOLAPI_API_SECRET` | API 시크릿 | **서버 전용** |
| `SOLAPI_SENDER` | 발신 번호 | **서버 전용** |
| `SOLAPI_KAKAO_PFID` | 카카오 채널 ID | **서버 전용** |

---

## 선택 환경 변수

### 모니터링

| 변수명 | 설명 | 기본값 |
|--------|------|:------:|
| `SENTRY_DSN` | Sentry 프로젝트 DSN | - |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | - |

### 개발/디버그

| 변수명 | 설명 | 기본값 |
|--------|------|:------:|
| `LOG_LEVEL` | 로그 레벨 | `info` |
| `NOTIFICATION_PROVIDER` | 알림 서비스 | `solapi` |

---

## 환경별 설정

### 개발 환경 (`.env.local`)

[`/jidokhae/ENV_TEMPLATE.md`](/jidokhae/ENV_TEMPLATE.md)를 복사하여 실제 값 입력

### 프로덕션 환경 (Vercel)

Vercel 대시보드 → Settings → Environment Variables에서 설정

---

## 보안 주의사항

1. **Git 커밋 금지**: `.env.local`은 `.gitignore`에 포함
2. **클라이언트 노출 주의**: `NEXT_PUBLIC_` 접두사만 클라이언트에 노출
3. **환경별 키 분리**: 개발/스테이징/프로덕션 각각 다른 키 사용
4. **서버 재시작 필수**: 환경 변수 변경 후 `Ctrl+C` → `npm run dev`

---

## 트러블슈팅

환경 변수 관련 문제는 다음 문서를 참조하세요:
- [트러블슈팅 패턴](/docs/troubleshooting-patterns.md)

### 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| `process.env.XXX` undefined | 파일 위치/오타/재시작 | 확인 후 서버 재시작 |
| "Store ID not recognized" | V1 코드를 V2에서 사용 | `store-` 형식 확인 |
| 카카오 callback 실패 | Redirect URI 미등록 | 현재 포트 URI 등록 |

---

## 관련 문서

- [환경 변수 템플릿](/jidokhae/ENV_TEMPLATE.md) - 복사해서 바로 사용
- [외부 서비스 설정](/docs/external-services.md) - 서비스별 상세 설정 방법
- [트러블슈팅 패턴](/docs/troubleshooting-patterns.md) - 문제 해결 가이드
