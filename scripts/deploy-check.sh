#!/bin/bash
# ===========================================
# 배포 전 종합 검사 스크립트
# 사용: ./scripts/deploy-check.sh
# ===========================================

echo "🚀 배포 전 종합 검사"
echo "===================="
echo ""

ERRORS=0
WARNINGS=0

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "  ${GREEN}✅${NC} $1"
}

check_fail() {
  echo -e "  ${RED}❌${NC} $1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "  ${YELLOW}⚠️${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Git 상태 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ Git 상태"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  check_pass "main 브랜치"
else
  check_warn "현재 브랜치: $BRANCH (main이 아님)"
fi

UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -eq 0 ]; then
  check_pass "커밋되지 않은 변경 없음"
else
  check_fail "커밋되지 않은 변경: ${UNCOMMITTED}개 파일"
fi

# 원격과 동기화 확인
git fetch origin main 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "")
if [ "$LOCAL" = "$REMOTE" ]; then
  check_pass "원격(origin/main)과 동기화됨"
else
  check_warn "원격과 동기화 필요 (git push)"
fi
echo ""

# 2. 환경 변수 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ 환경 변수"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "jidokhae/.env.local" ]; then
  check_pass ".env.local 존재"

  # 필수 변수 확인
  SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" jidokhae/.env.local | cut -d'=' -f2-)
  if [ -n "$SUPABASE_URL" ]; then
    check_pass "SUPABASE_URL 설정됨"
  else
    check_fail "SUPABASE_URL 누락"
  fi
else
  check_fail ".env.local 없음"
fi
echo ""

# 3. 의존성 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ 의존성"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "jidokhae/node_modules" ]; then
  check_pass "node_modules 존재"
else
  check_fail "node_modules 없음 (npm install 필요)"
fi

# package-lock.json 동기화 확인
if [ -f "jidokhae/package-lock.json" ]; then
  check_pass "package-lock.json 존재"
else
  check_warn "package-lock.json 없음"
fi
echo ""

# 4. 타입 체크
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ TypeScript 타입 체크"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd jidokhae
npx tsc --noEmit > /tmp/tsc-output.txt 2>&1
TSC_RESULT=$?
cd ..

if [ $TSC_RESULT -eq 0 ]; then
  check_pass "타입 에러 없음"
else
  check_fail "타입 에러 있음"
  echo ""
  echo "  에러 상세:"
  head -10 /tmp/tsc-output.txt | sed 's/^/    /'
fi
echo ""

# 5. 빌드 테스트
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣ 프로덕션 빌드"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd jidokhae
npm run build > /tmp/build-output.txt 2>&1
BUILD_RESULT=$?
cd ..

if [ $BUILD_RESULT -eq 0 ]; then
  check_pass "빌드 성공"
else
  check_fail "빌드 실패"
  echo ""
  echo "  에러 상세:"
  tail -20 /tmp/build-output.txt | sed 's/^/    /'
fi
echo ""

# 6. 린트 체크
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣ ESLint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd jidokhae
npm run lint > /tmp/lint-output.txt 2>&1
LINT_RESULT=$?
cd ..

if [ $LINT_RESULT -eq 0 ]; then
  # 에러 개수 확인
  LINT_ERRORS=$(grep -c "Error:" /tmp/lint-output.txt 2>/dev/null || echo "0")
  if [ "$LINT_ERRORS" -eq 0 ]; then
    check_pass "린트 에러 없음"
  else
    check_fail "린트 에러: ${LINT_ERRORS}개"
  fi
else
  check_fail "린트 실패"
fi
echo ""

# 7. SQL 마이그레이션 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣ SQL 마이그레이션"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SQL_FILES=$(find jidokhae/supabase -name "*.sql" -type f 2>/dev/null | wc -l)
if [ "$SQL_FILES" -gt 0 ]; then
  check_pass "SQL 파일: ${SQL_FILES}개"
  echo ""
  echo "  📄 마이그레이션 파일:"
  find jidokhae/supabase -name "*.sql" -type f | while read f; do
    echo "     - $(basename $f)"
  done
else
  check_warn "SQL 마이그레이션 파일 없음"
fi
echo ""

# 8. Vercel 설정 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣ Vercel 설정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "jidokhae/vercel.json" ]; then
  check_pass "vercel.json 존재"

  # Cron 작업 개수
  CRON_COUNT=$(grep -c '"path":' jidokhae/vercel.json 2>/dev/null || echo "0")
  if [ "$CRON_COUNT" -gt 0 ]; then
    check_pass "Cron 작업: ${CRON_COUNT}개"
  fi
else
  check_warn "vercel.json 없음"
fi
echo ""

# 결과 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 검사 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ 모든 검사 통과! 배포 준비 완료${NC}"
  echo ""
  echo "💡 다음 단계:"
  echo "   1. Vercel 대시보드에서 환경 변수 설정 확인"
  echo "   2. git push origin main"
  echo "   3. Vercel 자동 배포 확인"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️ 경고 ${WARNINGS}개 (배포 가능)${NC}"
  echo ""
  echo "경고 항목을 확인하고 필요시 수정하세요."
  exit 0
else
  echo -e "${RED}❌ 에러 ${ERRORS}개, 경고 ${WARNINGS}개${NC}"
  echo ""
  echo "에러를 수정한 후 다시 실행하세요:"
  echo "  ./scripts/deploy-check.sh"
  exit 1
fi
