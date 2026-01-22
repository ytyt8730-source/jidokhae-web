# 지독해 웹서비스 - 기술 문서

> **버전**: 1.2
> **마지막 업데이트**: 2026-01-22

이 폴더는 개발 및 운영에 필요한 기술 문서를 관리합니다.

---

## 폴더 구조

```
docs/
├── README.md                    # 이 문서
├── 서브에이전트-사용-가이드.md    # ⭐ 서브에이전트 사용법 (비전공자용)
├── external-services.md         # ⭐ 외부 서비스 설정 (통합 가이드)
├── env-variables.md             # 환경 변수 목록
├── troubleshooting-patterns.md  # 트러블슈팅 패턴
├── adr/                         # 아키텍처 결정 기록
│   ├── README.md
│   └── ADR-001 ~ ADR-006
├── runbook/                     # 운영 가이드
│   ├── incident-response.md
│   └── rollback-procedure.md
├── testing/                     # 테스트 전략
│   ├── e2e-scenarios.md
│   ├── local-test-plan.md
│   └── manual-test-scenario.md
├── code-quality.md              # 코드 품질 가이드
├── design-system.md             # 디자인 시스템
├── git-workflow.md              # Git 워크플로
└── tech-stack-versions.md       # 기술 스택 버전
```

---

## 주요 문서

| 문서 | 용도 | 대상 |
|------|------|------|
| **서브에이전트-사용-가이드.md** | 서브에이전트 사용법 (친절한 설명) | 개발자 |
| **git-workflow.md** | Git 브랜치/커밋/푸시 규칙 | 개발자, AI |
| **external-services.md** | 외부 서비스 설정 통합 가이드 | 개발자, AI |
| **env-variables.md** | 환경 변수 목록 및 설명 | 개발자, AI |
| **troubleshooting-patterns.md** | 자주 발생하는 문제 해결 | 개발자, AI |

---

## 문서 관리 원칙

### 1. ADR (아키텍처 결정 기록)

- 중요한 기술적 결정은 반드시 ADR로 기록
- 결정의 맥락, 이유, 결과를 명확히 문서화
- AI 에이전트가 참조할 수 있도록 상세하게 작성

### 2. 운영 가이드 (Runbook)

- 장애 발생 시 즉시 참조 가능하도록 구체적 절차 기술
- 명령어, URL, 담당자 연락처 포함

### 3. 외부 서비스 문서

- 모든 외부 서비스 설정은 `external-services.md`에 통합
- 환경 변수는 `env-variables.md`에서 참조
- 중복 방지를 위해 한 곳에서 관리

### 4. 버전 관리

- 모든 문서에 버전 및 업데이트 날짜 기록
- 주요 변경 시 버전 번호 증가

---

## 관련 문서

| 문서 | 경로 |
|------|------|
| 서비스 개요 | `/core/0__ 지독해 웹서비스 - 서비스 개요_v1.3.md` |
| PRD | `/core/1__지독해_웹서비스_-_PRD_v1.4.md` |
| 기술 스택 | `/core/2__지독해_웹서비스_-_기술_스택_및_개발_로드맵_v1.2.md` |
| 시스템 구조 | `/core/3__지독해_웹서비스_-_시스템_구조_v1.3.md` |
| AI 에이전트 가이드 | `/core/AI_AGENT_GUIDE.md` |
| AI 빠른 참조 | `/core/AI_QUICK_REFERENCE.md` |
| 개발 로드맵 | `/roadmap/milestones.md` |
| 환경 변수 템플릿 | `/jidokhae/ENV_TEMPLATE.md` |
| 서브에이전트 시스템 | `/.claude/agents/README.md` |
| 스크립트 가이드 | `/scripts/README.md` |
