#!/bin/bash
# ===========================================
# 커밋 전 검사 스크립트
# 사용: ./scripts/pre-commit.sh
# Git Hook으로 설정 가능: cp scripts/pre-commit.sh .git/hooks/pre-commit
# ===========================================

echo "🔍 커밋 전 검사..."
echo ""

# 1. .env 파일 체크
ENV_STAGED=$(git diff --cached --name-only | grep -E "\.env")
if [ -n "$ENV_STAGED" ]; then
  echo "❌ .env 파일이 커밋에 포함되어 있습니다!"
  echo "파일: $ENV_STAGED"
  echo ""
  echo "제거하려면:"
  echo "  git reset HEAD $ENV_STAGED"
  exit 1
fi

# 2. 민감정보 체크
SENSITIVE=$(git diff --cached | grep -iE "(api_key|secret|password|token).*=.*['\"][^'\"]+['\"]")
if [ -n "$SENSITIVE" ]; then
  echo "⚠️ 민감정보가 포함된 것 같습니다!"
  echo ""
  echo "발견된 패턴:"
  echo "$SENSITIVE"
  echo ""
  echo "환경변수로 분리해주세요."
  exit 1
fi

# 3. 빠른 타입 체크
echo "타입 체크 중..."
npx tsc --noEmit --pretty 2>&1 | head -20
TYPE_RESULT=$?

if [ $TYPE_RESULT -ne 0 ]; then
  echo ""
  echo "❌ 타입 에러가 있습니다. 수정 후 커밋하세요."
  exit 1
fi

echo ""
echo "✅ 커밋 전 검사 통과!"
