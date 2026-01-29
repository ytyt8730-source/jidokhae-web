# AI 빠른 참조 가이드 (Quick Reference)

> **버전**: 1.3
> **마지막 업데이트**: 2026-01-28
> **용도**: AI 에이전트가 작업 중 빠르게 참조할 치트시트

---

## 🚀 현재 프로젝트 상태

| 마일스톤 | 상태 | 완료일 |
|----------|:----:|:------:|
| M1 기반구축 | ✅ 완료 | 2026-01-14 |
| M2 핵심결제흐름 | ✅ 완료 | 2026-01-16 |
| M3 알림시스템 | ✅ 완료 | 2026-01-17 |
| M4 소속감 | ✅ 완료 | 2026-01-18 |
| M5 운영자도구 | ✅ 완료 | 2026-01-21 |
| M6 신규회원/출시 | ✅ 완료 | 2026-01-21 |
| M7 Polish & Growth | ✅ 완료 | 2026-01-22 |
| **Experience Enhancement** | | |
| M8 Ritual Foundation | ⏳ 대기 | - |
| M9 Commitment Ritual | ⏳ 대기 | - |
| M10 Connection & Memory | ⏳ 대기 | - |
| M11 Community Hub | ⏳ 대기 | - |
| M12 Admin Evolution | ⏳ 대기 | - |
| **백오피스 MVP** | | |
| M13 Admin Foundation | ⏳ 대기 | - |
| M14 결제 운영 | ⏳ 대기 | - |
| M15 모임 관리 | ⏳ 대기 | - |
| M16 회원 관리 | ⏳ 대기 | - |
| M17 설정 관리 | ⏳ 대기 | - |
| M18 알림/Audit | ⏳ Post-MVP | - |

**상세 현황**: [`/log/current-state.md`](/log/current-state.md)

---

## 📍 자주 찾는 문서

### 작업 관련

| 문서 | 경로 |
|------|------|
| 현재 상태 | `/log/current-state.md` |
| Work Packages | `/roadmap/work-packages/` |
| Scenarios | `/roadmap/scenarios/` |

### 기획 문서

| 문서 | 경로 |
|------|------|
| 서비스 개요 | `/core/0__ 지독해 웹서비스 - 서비스 개요_v1.3.md` |
| PRD | `/core/1__지독해_웹서비스_-_PRD_v1.4.md` |
| 기술 스택 | `/core/2__지독해_웹서비스_-_기술_스택_및_개발_로드맵_v1.2.md` |
| 시스템 구조 | `/core/3__지독해_웹서비스_-_시스템_구조_v1.3.md` |

### 기술 문서

| 문서 | 경로 |
|------|------|
| 외부 서비스 | `/docs/external-services.md` |
| 환경 변수 | `/docs/env-variables.md` |
| 트러블슈팅 | `/docs/troubleshooting-patterns.md` |

---

## ✅ 작업 전 체크리스트

```
□ /log/current-state.md 확인
□ 해당 WP 문서 확인
□ 관련 Scenario 확인
□ 선행 조건 충족 여부 확인
```

## ✅ 작업 완료 시 체크리스트

```
□ 완료 기준 전체 확인
□ npx tsc --noEmit (타입 체크)
□ npm run build (빌드 확인)
□ /log/current-state.md 업데이트
```

---

## 📌 Git 빠른 참조

> 상세: `/docs/git-workflow.md`

| 상황 | 명령어 |
|------|--------|
| 세션 시작 | `git fetch && git pull` |
| 새 작업 | `git checkout -b feature/m3-xxx` |
| 커밋 | `git commit -m "[M3] feat: 설명"` |
| 푸시 | `git push origin feature/m3-xxx` |

**금지**: `.env.local` 커밋, `--force`, main 직접 작업

---

## 🔴 핵심 개발 원칙

| 항목 | 규칙 |
|------|------|
| 모바일 우선 | 360px에서 먼저 확인 |
| 환불 규정 | **하드코딩 금지**, DB에서 관리 |
| 알림 서비스 | 추상화 레이어 필수 |
| 동시성 | 결제/정원 체크 시 **트랜잭션** 사용 |
| 로그 | 100~200줄 이내, 코드 복사 금지 |

---

## ⚠️ 자주 발생하는 문제

| 문제 | 해결 |
|------|------|
| 포트원 Store ID 오류 | `store-xxxxx` 형식 확인 (V1: TC0ONETIM ❌) |
| 카카오 로그인 실패 | 현재 포트 Redirect URI 등록 |
| 환경 변수 안 읽힘 | 서버 재시작 (`Ctrl+C` → `npm run dev`) |
| RLS 무한 재귀 | `auth.uid() = id` 단순 조건 사용 |

---

## 🔗 폴더 구조

```
C:\Web project_vibecoding\
├── core/           ← 핵심 기획 문서
├── roadmap/        ← 마일스톤, WP, Scenarios
├── log/            ← 개발 로그
├── docs/           ← 기술 문서
└── jidokhae/       ← 프로젝트 소스
```

---

## 📚 관련 문서

- **메타 가이드**: [`/core/AI_AGENT_GUIDE.md`](/core/AI_AGENT_GUIDE.md) - 문서 준수 규칙
- **기술 가이드**: [`/CLAUDE.md`](/CLAUDE.md) - 코드 컨벤션, API 패턴
