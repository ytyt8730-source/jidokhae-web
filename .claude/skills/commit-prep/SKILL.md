---
name: commit-prep
description: 커밋 전 품질 검사 및 준비. 작업 완료 후 커밋 전에 사용.
disable-model-invocation: true
---

커밋 준비를 위한 품질 검사 및 메시지 생성을 수행합니다.

## 검사 단계

1. **git status 확인**
   ```bash
   cd jidokhae && git status
   ```

2. **inspector 에이전트 호출**
   - TypeScript 타입 체크
   - ESLint 린트
   - 프로덕션 빌드

3. **code-reviewer 에이전트 호출** (선택적)
   - 변경 파일에 대한 빠른 리뷰
   - Critical 이슈만 확인

## 커밋 메시지 생성

형식: `[M번호] 타입: 한글 설명`

타입:
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 변경
- `test`: 테스트 추가
- `chore`: 기타 변경

예시:
```
[M10] feat: 칭찬 시스템 API 구현
[M6] fix: 온보딩 리다이렉트 버그 수정
```

## 사용 예시

```
/commit-prep
/commit-prep M10
```
