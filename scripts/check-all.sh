#!/bin/bash
# ===========================================
# 전체 검사 스크립트 (@agent-검사 자동화)
# 사용: ./scripts/check-all.sh
# ===========================================

echo "=== 전체 검사 시작 ==="
echo ""

# 결과 저장 변수
TYPE_RESULT=0
BUILD_RESULT=0
LINT_RESULT=0

# 1. 타입 체크
echo "1️⃣ 타입 체크..."
npx tsc --noEmit 2>&1
TYPE_RESULT=$?
if [ $TYPE_RESULT -eq 0 ]; then
  echo "   ✅ 타입 체크 통과"
else
  echo "   ❌ 타입 에러 있음"
fi
echo ""

# 2. 빌드
echo "2️⃣ 빌드..."
npm run build 2>&1
BUILD_RESULT=$?
if [ $BUILD_RESULT -eq 0 ]; then
  echo "   ✅ 빌드 성공"
else
  echo "   ❌ 빌드 실패"
fi
echo ""

# 3. 린트
echo "3️⃣ 린트..."
npm run lint 2>&1
LINT_RESULT=$?
if [ $LINT_RESULT -eq 0 ]; then
  echo "   ✅ 린트 통과"
else
  echo "   ❌ 린트 에러 있음"
fi
echo ""

# 4. .env 체크
echo "4️⃣ .env 파일 staged 체크..."
ENV_STAGED=$(git diff --cached --name-only | grep -E "\.env")
if [ -n "$ENV_STAGED" ]; then
  echo "   ❌ .env 파일이 staged 되어 있습니다!"
  echo "   파일: $ENV_STAGED"
  echo "   git reset HEAD $ENV_STAGED 로 제거하세요."
else
  echo "   ✅ .env 파일 안전"
fi
echo ""

# 결과 요약
echo "=== 검사 결과 ==="
echo ""
echo "| 항목 | 결과 |"
echo "|------|:----:|"
[ $TYPE_RESULT -eq 0 ] && echo "| 타입 체크 | ✅ |" || echo "| 타입 체크 | ❌ |"
[ $BUILD_RESULT -eq 0 ] && echo "| 빌드 | ✅ |" || echo "| 빌드 | ❌ |"
[ $LINT_RESULT -eq 0 ] && echo "| 린트 | ✅ |" || echo "| 린트 | ❌ |"
echo ""

# 최종 결과
if [ $TYPE_RESULT -eq 0 ] && [ $BUILD_RESULT -eq 0 ] && [ $LINT_RESULT -eq 0 ]; then
  echo "✅ 모든 검사 통과! 커밋 가능합니다."
  echo ""
  echo "💡 다음 명령어:"
  echo "  @agent-Git 커밋해줘"
  exit 0
else
  echo "❌ 검사 실패! 수정이 필요합니다."
  echo ""
  echo "💡 다음 명령어:"
  echo "  @agent-수리 [에러 유형] 수정해줘"
  exit 1
fi
