---
name: phase-complete
description: Phase 또는 WP 완료 시 검증 및 기록 자동화. 구현 완료 후 사용.
disable-model-invocation: true
---

Phase/WP 완료 검증 및 기록을 수행합니다.

## 검증 단계

1. **inspector 에이전트 호출**
   - TypeScript 타입 체크
   - ESLint 린트 검사
   - 프로덕션 빌드 테스트

2. **테스트 실행**
   ```bash
   cd jidokhae && npm run test:run
   ```

3. **검증 결과 확인**
   - 모두 통과 시 → 기록 단계로
   - 실패 시 → 수정 후 재시도

## 기록 단계

1. **current-state.md 업데이트**
   - 완료된 Phase 추가
   - 다음 단계 업데이트
   - 마지막 업데이트 날짜 갱신

2. **작업 요약**
   - 변경된 파일 목록
   - 주요 변경 사항
   - 검증 결과

## 사용 예시

```
/phase-complete M6-Onboarding Phase 3
/phase-complete WP-M10 Phase 1
```
