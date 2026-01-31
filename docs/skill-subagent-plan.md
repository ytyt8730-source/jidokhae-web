# 스킬/서브에이전트 생성 계획

> UI/UX 개선 작업을 통해 도출된 필요 스킬 및 서브에이전트 목록
>
> **검토일**: 2026-01-31
> **상태**: 검토 완료 - 최적화된 계획

---

## 0. 요약 (Executive Summary)

### 최종 권장 사항

| 구분 | 항목 | 우선순위 | 상태 |
|------|------|----------|------|
| **스킬** | `theme-migrate` | P0 | 신규 생성 |
| **스킬** | `component-refactor` | P1 | 신규 생성 |
| **스킬** | `db-migration` | P2 | 신규 생성 |
| **에이전트** | `DesignSystem-Agent` | P1 | 신규 생성 |
| **기존 활용** | `frontend-design` | - | 활용 강화 |
| **기존 활용** | `deep-review` | - | 활용 강화 |

### 제외된 항목 (과잉/중복)

| 항목 | 제외 이유 | 대안 |
|------|----------|------|
| `animation-apply` | animations.ts로 표준화됨 | CLAUDE.md 가이드 |
| `accessibility-audit` | Alpha 단계에서 불필요 | Lighthouse 활용 |
| `responsive-check` | DevTools로 충분 | 수동 체크리스트 |
| `Animation-Agent` | frontend-design과 중복 | 기존 스킬 활용 |
| `Quality-Agent` | ESLint/TS가 커버 | CI/CD 통합 |

---

## 1. 필요성 분석

### 반복된 작업 패턴

| 패턴 | 빈도 | 자동화 가치 | 권장 |
|------|------|------------|------|
| 테마 변수 적용 (CSS 변수) | 매우 높음 | ★★★★★ | ✅ 스킬 생성 |
| 컴포넌트 분리/리팩토링 | 높음 | ★★★★★ | ✅ 스킬 생성 |
| DB 스키마 마이그레이션 | 중간 | ★★★★☆ | ✅ 스킬 생성 |
| Framer Motion 애니메이션 | 높음 | ★★★☆☆ | ❌ 문서화로 충분 |
| 접근성(ARIA) 속성 | 중간 | ★★☆☆☆ | ❌ 정식 출시 전 검토 |
| 반응형 스타일 | 높음 | ★★☆☆☆ | ❌ DevTools 활용 |

### 현재 사용 중인 스킬 (활용 강화)

| 스킬 | 현재 활용 | 권장 활용 |
|------|----------|----------|
| `frontend-design` | 중간 | **UI 구현 전 필수 호출** + 애니메이션 가이드 포함 |
| `fix-types` | 낮음 | **TypeScript 오류 시 즉시 호출** |
| `deep-review` | 낮음 | **커밋 전 필수 실행** |
| `generate-docs` | 낮음 | API 변경 시 호출 |
| `feature-dev` | 중간 | 복잡한 기능 시 호출 |

---

## 2. 제안 스킬

### 2.1 `component-refactor` (컴포넌트 리팩토링)

**목적**: 대형 컴포넌트를 체계적으로 분리

**트리거 조건**:
- 파일이 200줄 초과
- 단일 컴포넌트 내 렌더링 블록 3개 이상
- Props가 10개 초과

**자동화 내용**:
```
1. 코드 분석 → 분리 대상 식별
2. 폴더 구조 생성 (components/index.ts 패턴)
3. Props 인터페이스 추출
4. 테스트 파일 연동 확인
```

**예상 입력**:
```bash
/component-refactor src/app/mypage/page.tsx
```

**예상 출력**:
```
✅ Created 5 components in src/app/mypage/components/
   - ProfileCard.tsx (45 lines)
   - StatsGrid.tsx (62 lines)
   - BadgeSection.tsx (58 lines)
   - QualificationStatus.tsx (43 lines)
   - RegistrationList.tsx (89 lines)
✅ Updated page.tsx (154 lines, -256 lines reduced)
✅ Barrel export created: index.ts
```

---

### 2.2 `animation-apply` (애니메이션 적용)

**목적**: Framer Motion 애니메이션 일괄 적용

**프로젝트 표준**:
- `lib/animations.ts`의 사전 정의 variants 사용
- Spring 물리 기반 모션 우선
- Stagger 패턴 리스트 적용

**자동화 내용**:
```
1. 대상 컴포넌트 분석
2. 적합한 애니메이션 패턴 선택
   - Card → springCard
   - List → springStaggerContainer + springStaggerItem
   - Modal → springModalEnter
   - Section → springSectionFadeIn
3. motion.div 래핑
4. 접근성 유지 (reduced-motion 대응)
```

**예상 입력**:
```bash
/animation-apply src/components/MeetingCard.tsx --pattern=card
```

---

### 2.3 `theme-migrate` (테마 변수 마이그레이션)

**목적**: 하드코딩된 색상을 CSS 변수로 전환

**프로젝트 표준**:
- `text-gray-*` → `text-text`, `text-text-muted`
- `bg-white` → `bg-[var(--bg-base)]`
- `bg-gray-*` → `bg-[var(--surface)]`
- `border-gray-*` → `border-[var(--border)]`
- `text-brand-*` → `text-primary`

**자동화 내용**:
```
1. Tailwind 클래스 스캔
2. 매핑 테이블 적용
3. 다크모드 호환 확인
4. 변경 리포트 생성
```

**예상 입력**:
```bash
/theme-migrate src/components/ --report
```

**예상 출력**:
```
📊 Theme Migration Report
Files scanned: 34
Changes needed: 127

By category:
  - Background colors: 45 changes
  - Text colors: 52 changes
  - Border colors: 30 changes

Top files to migrate:
  1. MeetingCard.tsx (23 changes)
  2. Button.tsx (18 changes)
  3. Header.tsx (15 changes)
```

---

### 2.4 `accessibility-audit` (접근성 감사)

**목적**: WCAG 기준 접근성 검사 및 수정

**검사 항목**:
- ARIA 레이블 누락
- 색상 대비 비율 (4.5:1 이상)
- 키보드 네비게이션
- focus-visible 스타일
- 스크린 리더 호환성

**자동화 내용**:
```
1. 컴포넌트별 접근성 스캔
2. 위반 사항 리포트
3. 자동 수정 가능 항목 제안
4. 수동 검토 필요 항목 표시
```

**예상 입력**:
```bash
/accessibility-audit src/components/BottomSheet.tsx
```

---

### 2.5 `responsive-check` (반응형 검사)

**목적**: 모바일/태블릿/데스크톱 레이아웃 검증

**프로젝트 표준**:
- Mobile-first (360px 기준)
- Breakpoints: `sm:`, `md:`, `lg:`
- Sticky CTA (모바일), Fixed Header 등

**자동화 내용**:
```
1. Tailwind 반응형 클래스 분석
2. 누락된 breakpoint 감지
3. overflow 위험 요소 식별
4. 터치 타겟 크기 검증 (44x44px 이상)
```

---

## 3. 제안 서브에이전트

### 3.1 `DesignSystem-Agent` (디자인 시스템 에이전트)

**역할**: 디자인 시스템 일관성 유지 및 확장

**기능**:
- 컴포넌트 생성 시 디자인 토큰 적용
- 신규 컴포넌트의 기존 패턴 준수 검증
- 색상, 타이포그래피, 스페이싱 가이드 제공

**호출 시점**:
- 새 컴포넌트 생성 시
- 기존 컴포넌트 수정 시
- 디자인 리뷰 요청 시

---

### 3.2 `Animation-Agent` (애니메이션 에이전트)

**역할**: Framer Motion 애니메이션 전문가

**기능**:
- 상황에 맞는 애니메이션 패턴 추천
- 성능 최적화 (layoutId, AnimatePresence)
- 접근성 고려 (prefers-reduced-motion)
- 기존 variants 재사용 극대화

**지식 베이스**:
- `lib/animations.ts` 전체 variants
- Framer Motion 최신 API
- 프로젝트별 애니메이션 컨벤션

---

### 3.3 `Quality-Agent` (품질 에이전트)

**역할**: 코드 품질 및 성능 감시

**기능**:
- 린트 규칙 위반 감지
- 번들 사이즈 영향 분석
- 불필요한 re-render 감지
- 타입 안전성 검증

**자동 실행**:
- PR 생성 시
- 대규모 리팩토링 후
- 새 의존성 추가 시

---

## 4. 구현 우선순위 (수정됨)

| 순위 | 스킬/에이전트 | 이유 | 예상 효과 |
|------|--------------|------|----------|
| **P0** | `theme-migrate` | 즉시 효과, 50+ 파일 적용 필요 | 작업 시간 80% 단축 |
| **P1** | `component-refactor` | 유지보수성 향상, mypage 분리 성공 사례 | 코드 품질 향상 |
| **P1** | `DesignSystem-Agent` | Design System v3.3 일관성 | 브랜드 톤 유지 |
| **P2** | `db-migration` | 스키마 변경 안전성 | 데이터 무결성 |

### 제외된 항목

| 항목 | 제외 이유 |
|------|----------|
| `animation-apply` | `lib/animations.ts` 표준화로 충분, 문서화가 더 효과적 |
| `accessibility-audit` | Alpha 단계에서 ROI 낮음, 정식 출시 전 Lighthouse 활용 |
| `responsive-check` | 브라우저 DevTools로 충분, 자동화 ROI 낮음 |
| `Animation-Agent` | `frontend-design` 스킬이 이미 커버 가능 |
| `Quality-Agent` | ESLint + TypeScript가 역할 수행, CI/CD 통합 권장 |

---

## 5. 기존 스킬 활용 극대화

현재 사용 가능한 스킬들을 더 적극적으로 활용:

| 스킬 | 현재 활용도 | 권장 활용 |
|------|------------|----------|
| `frontend-design` | 중간 | UI 구현 전 반드시 호출 |
| `fix-types` | 낮음 | 빌드 오류 발생 시 즉시 호출 |
| `deep-review` | 낮음 | PR 전 필수 호출 |
| `feature-dev` | 중간 | 복잡한 기능 구현 시 호출 |

---

## 6. 스킬 정의 템플릿

새 스킬 생성 시 다음 구조 사용:

```markdown
# skill-name

## 목적
한 줄 설명

## 트리거
- 명시적: `/skill-name [args]`
- 자동: 조건 설명

## 입력
- 필수: ...
- 선택: ...

## 출력
- 형식: ...
- 예시: ...

## 의존성
- 필요 도구: ...
- 참조 파일: ...

## 주의사항
- ...
```

---

## 7. 다음 단계 (수정됨)

### 즉시 실행 (비용 0)

1. **CLAUDE.md 업데이트**: 애니메이션 가이드 추가 (animation-apply 대체)
2. **기존 스킬 활용 규칙화**: `deep-review` 커밋 전 필수

### 단기 (1-2주)

3. **`theme-migrate` 스킬 프로토타입**: 테마 변수 마이그레이션 자동화
4. **`component-refactor` 스킬 구현**: 대형 컴포넌트 분리 자동화

### 중기 (Beta 전)

5. **`DesignSystem-Agent` 설계**: Design System v3.3 일관성 에이전트
6. **`db-migration` 스킬 검토**: 스키마 변경 자동화 필요성 재평가

### 지속적

7. 기존 스킬 활용 패턴 문서화
8. 스킬 효과 측정 및 개선

---

## 8. 비용-효과 분석

| 접근 방식 | 비용 | 효과 | ROI |
|----------|------|------|-----|
| 기존 스킬 활용 강화 | 0 | 중간 | ⭐⭐⭐⭐⭐ |
| CLAUDE.md 가이드 추가 | 낮음 | 중간 | ⭐⭐⭐⭐⭐ |
| theme-migrate 스킬 | 중간 | 높음 | ⭐⭐⭐⭐ |
| component-refactor | 중간 | 높음 | ⭐⭐⭐⭐ |
| DesignSystem-Agent | 높음 | 높음 | ⭐⭐⭐ |
| accessibility-audit | 높음 | 낮음 (현 단계) | ⭐ |

---

*작성일: 2026-01-31*
*검토일: 2026-01-31*
*작성자: Claude Code (UI/UX 개선 작업 기반)*
