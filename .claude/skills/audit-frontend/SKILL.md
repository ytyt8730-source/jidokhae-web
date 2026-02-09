---
name: audit-frontend
description: 프론트엔드 전수 품질 검사 오케스트레이터. 8개 카테고리 교차 검사 후 P0/P1/P2 분류 리포트 생성.
disable-model-invocation: true
---

프론트엔드 전수 품질 검사를 수행합니다.

## 사용법

```
/audit-frontend              # 전체 8개 카테고리
/audit-frontend z-index      # z-index 교차 검사만
/audit-frontend a11y         # 접근성 검사만
/audit-frontend tokens       # 디자인 토큰 검사만
/audit-frontend layout       # 레이아웃/반응형 검사만
```

## 실행 구조

3개 에이전트를 **병렬**로 실행합니다:

### 에이전트 1: frontend-auditor (Sonnet)
시스템 단위 교차 검사:
- z-index 체계 (충돌 행렬 생성)
- 레이아웃 정합성 (사이드바 오프셋)
- Safe Area & Viewport (미등록 유틸리티 탐지)
- 오버플로우 & 클리핑
- 애니메이션 일관성

### 에이전트 2: a11y-checker (Sonnet)
접근성 검사:
- Dialog 시맨틱 (role, aria-modal, ESC, 포커스 트랩)
- 키보드 접근성 (div onClick 3종 세트)
- 폼 라벨링 (label-input 연결)
- 색상 대비 (#CCFF00 텍스트 금지)

### 에이전트 3: ux-verifier (Opus)
디자인 토큰 검사:
- No-Emoji Policy
- 하드코딩 색상 (bg-white, bg-red-* 등)
- 아이콘 strokeWidth (1.5)
- CSS 변수 사용 여부

## 실행 방법

### 전체 검사

3개 에이전트를 병렬 Task로 실행:

```
Task(frontend-auditor): "jidokhae/src 전수 교차 검사 실행. Pre-Flight 단계부터 시작하여 5개 검사 영역 모두 수행. 결과를 P0/P1/P2로 분류하여 보고."

Task(a11y-checker): "jidokhae/src 접근성 전수 검사 실행. 4개 검사 영역(Dialog, 키보드, 폼, 색상) 모두 수행. 결과를 P0/P1/P2로 분류하여 보고."

Task(ux-verifier): "jidokhae/src 디자인 토큰 전수 검사 실행. grep 검색 패턴 섹션의 모든 패턴을 순서대로 실행. 결과를 Critical/Warning으로 분류하여 보고."
```

### 카테고리별 검사

| 인자 | 실행 에이전트 | 검사 범위 |
|------|--------------|-----------|
| `z-index` | frontend-auditor | z-index 체계만 |
| `a11y` | a11y-checker | 접근성 4개 영역 |
| `tokens` | ux-verifier | 디자인 토큰 |
| `layout` | frontend-auditor | 레이아웃 + safe-area |

## 결과 통합

3개 에이전트 결과를 수집한 후 아래 형식으로 통합:

### 통합 리포트

```
## 전수 검사 결과 요약

| 카테고리 | P0 | P1 | P2 | 담당 에이전트 |
|----------|:--:|:--:|:--:|:------------:|
| z-index 충돌 | - | - | - | frontend-auditor |
| 레이아웃 정합성 | - | - | - | frontend-auditor |
| Safe Area | - | - | - | frontend-auditor |
| 오버플로우 | - | - | - | frontend-auditor |
| 애니메이션 | - | - | - | frontend-auditor |
| 접근성 | - | - | - | a11y-checker |
| 디자인 토큰 | - | - | - | ux-verifier |
| 아이콘/이모지 | - | - | - | ux-verifier |
| **합계** | **-** | **-** | **-** | |

## P0 수정 로드맵

| # | 파일 | 이슈 | 카테고리 | 수정 방법 |
|---|------|------|----------|-----------|
| 1 | ... | ... | ... | ... |

## P1 수정 로드맵

| # | 파일 | 이슈 | 카테고리 | 수정 방법 |
|---|------|------|----------|-----------|
| 1 | ... | ... | ... | ... |
```

## 주의사항

- 에이전트 결과에서 중복 이슈는 병합 (예: z-index가 frontend-auditor와 ux-verifier 양쪽에서 발견)
- P0 이슈에는 반드시 구체적 수정 코드 예시 포함
- 검사 대상은 `jidokhae/src/` 디렉토리 전체
- `node_modules`, `.next`, `*.test.*` 파일은 제외
