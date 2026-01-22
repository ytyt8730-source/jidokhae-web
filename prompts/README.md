# 프롬프트 아카이브

> 반복 사용되는 고성능 프롬프트를 자산화하는 폴더

## 목적

1. 효과적인 프롬프트 재사용
2. 서브에이전트 지침으로 즉시 변환 가능
3. 팀 지식 자산화

## 구조

```
prompts/
├── README.md                      # 이 파일
├── coding/                        # 코딩 관련 프롬프트
│   └── implement-phase.md         # Phase 구현 템플릿
└── testing/                       # 테스트 관련 프롬프트
    └── verify-phase.md            # Phase 검증 템플릿
```

## 변수 규칙

프롬프트 내 변수는 `${variable}` 형식 사용:

```markdown
# Example
${component_name} 컴포넌트를 생성해줘.
위치: ${file_path}
```

## 프롬프트 작성 가이드

### 파일 명명 규칙

```
[카테고리]/[동작]-[대상].md

예시:
- coding/create-component.md
- testing/verify-api.md
- refactoring/split-large-file.md
```

### 프롬프트 구조

```markdown
# [프롬프트 제목]

## 목적
[이 프롬프트가 해결하는 문제]

## 입력
- ${variable1}: 설명
- ${variable2}: 설명

## 프롬프트

[실제 프롬프트 내용]

## 예상 출력
[기대하는 결과]

## 사용 예시
[실제 사용 예시]
```

## 에이전트 변환

이 폴더의 프롬프트는 `.claude/agents/`로 쉽게 변환 가능:

```markdown
---
name: component-creator
description: 컴포넌트 생성 전문가
tools: Read, Write, Edit
---

[prompts/coding/create-component.md 내용]
```

## 프롬프트 품질 기준

| 항목 | 기준 |
|------|------|
| 명확성 | 모호한 표현 없이 구체적 |
| 재현성 | 같은 입력에 같은 출력 |
| 컨텍스트 효율 | 필요한 정보만 포함 |
| 변수화 | 재사용 가능한 변수 사용 |

## 컨텍스트 엔지니어링 원칙

```
1. 필요한 정보만 포함 (최소 컨텍스트)
2. 큰 파일은 필요한 부분만 참조
3. 결과만 요청, 과정 설명 불필요
4. 명확한 출력 형식 지정
```

## 사용 방법

### 1. 직접 참조

```bash
# 프롬프트 내용 확인
cat prompts/coding/create-component.md

# Claude에 직접 전달
# (프롬프트 내용을 복사하여 사용)
```

### 2. 에이전트로 변환

```bash
# 프롬프트를 에이전트로 변환
cp prompts/coding/create-component.md .claude/agents/컴포넌트생성.md
# → 프론트매터 추가 필요
```

### 3. 파이프라인에서 활용

```markdown
# 파이프라인 에이전트가 프롬프트 참조
"prompts/coding/create-component.md의 지침에 따라 컴포넌트를 생성합니다."
```

---

## 버전

- Created: 2026-01-22
- Last updated: 2026-01-22
