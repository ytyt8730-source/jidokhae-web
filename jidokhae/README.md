# 지독해 웹서비스

경주·포항 독서모임 **지독해**의 공식 웹서비스입니다.

## 프로젝트 개요

회원들이 쉽게 모임에 참여하고, 운영자는 효율적으로 모임을 관리할 수 있는 서비스입니다.

### 핵심 가치
- **쉬운 연결**: 일정 확인부터 신청/결제/취소까지 최소한의 동작으로
- **잊지 않게**: 자동 리마인드로 모임과의 연결 유지
- **소속감**: 활동 기록, 배지, 칭찬을 통해 "나는 지독해 회원"이라는 느낌
- **신뢰**: 결제/환불이 투명하고 빠르게 처리됨

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 14 + TypeScript + Tailwind CSS 3.4 |
| 애니메이션 | Framer Motion |
| 백엔드/DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (이메일/비밀번호, 카카오 로그인) |
| 결제 | 포트원 V2 + 카카오페이/토스페이 |
| 알림톡 | 솔라피 (Kakao Alimtalk) |
| 모니터링 | Sentry |
| 배포 | Vercel |

## 폴더 구조

```
jidokhae/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── auth/           # 인증 (로그인/회원가입)
│   │   ├── meetings/       # 모임 (목록/상세/신청)
│   │   ├── mypage/         # 마이페이지 (티켓, 책장)
│   │   ├── admin/          # 관리자 대시보드
│   │   └── api/            # API Routes
│   ├── components/         # React 컴포넌트 (65+)
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # 유틸리티
│   │   └── supabase/       # Supabase 클라이언트
│   └── types/              # TypeScript 타입
├── supabase/
│   └── schema-complete.sql # DB 스키마
└── public/                 # 정적 파일
```

## 시작하기

### 1. 환경 변수 설정

`ENV_TEMPLATE.md` 파일을 참고하여 `.env.local` 파일을 생성합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

### 3. 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run typecheck    # 타입 체크
npm run test         # 테스트 실행
```

## 개발 마일스톤

| 마일스톤 | 내용 | 상태 |
|----------|------|------|
| M1 | 프로젝트 기반 구축 | ✅ 완료 |
| M2 | 핵심 결제 흐름 | ✅ 완료 |
| M3 | 알림 시스템 | ✅ 완료 |
| M4 | 소속감 기능 | ✅ 완료 |
| M5 | 운영자 도구 | ✅ 완료 |
| M6 | 신규 회원 & 출시 준비 | ✅ 완료 |
| M7 | 전환율 최적화 | ✅ 완료 |
| M8 | Ritual Foundation | ✅ 완료 |
| M9 | Commitment Ritual | ✅ 완료 |
| M10-M12 | Experience Enhancement | ⏳ WP 완료 |
| M13-M17 | Backoffice MVP | ⏳ WP 완료 |

**현재 상태:** Beta-ready (M1-M9 코드 완료)

## 관련 문서

- 서비스 개요: `../core/0__ 지독해 웹서비스 - 서비스 개요_v1.4.md`
- PRD: `../core/1__지독해_웹서비스_-_PRD_v1.5.md`
- 기술 스택: `../core/2__지독해_웹서비스_-_기술_스택_및_개발_로드맵_v1.3.md`
- 시스템 구조: `../core/3__지독해_웹서비스_-_시스템_구조_v1.3.md`
- 마일스톤: `../roadmap/milestones.md`
- 디자인 시스템: `../docs/design-system.md`

## 개발 원칙

1. **모바일 우선**: 모든 UI는 모바일(360px)에서 먼저 확인
2. **No-Emoji**: 이모지 대신 Lucide React 아이콘 사용
3. **One-Page**: Bottom Sheet 패턴으로 페이지 이동 최소화
4. **환불 규정 유연성**: 하드코딩 금지, DB에서 관리
5. **권한 관리 확장성**: role 기반 설계

---

© 2026 지독해. All rights reserved.
