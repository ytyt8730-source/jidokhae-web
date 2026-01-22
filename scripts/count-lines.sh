#!/bin/bash
# ===========================================
# 파일 줄 수 체크 스크립트 (200줄 초과 탐지)
# 사용: ./scripts/count-lines.sh [최대줄수]
# 예시: ./scripts/count-lines.sh 200
# ===========================================

MAX_LINES=${1:-200}
DIR="jidokhae/src"

echo "📊 파일 줄 수 분석"
echo "📁 대상: $DIR"
echo "⚠️ 기준: ${MAX_LINES}줄 초과"
echo "─────────────────────────────────"
echo ""

# 모든 ts, tsx 파일의 줄 수 계산
OVER_LIMIT=$(find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} \; | awk -v max="$MAX_LINES" '$1 > max {print}' | sort -rn)

if [ -z "$OVER_LIMIT" ]; then
  echo "✅ ${MAX_LINES}줄 초과 파일 없음"
else
  echo "⚠️ ${MAX_LINES}줄 초과 파일:"
  echo ""
  echo "$OVER_LIMIT"
  echo ""
  echo "─────────────────────────────────"
  COUNT=$(echo "$OVER_LIMIT" | wc -l)
  echo "📊 총 ${COUNT}개 파일이 기준 초과"
  echo ""
  echo "💡 권장: 컴포넌트 분리 또는 서비스 레이어 분리"
fi

echo ""
echo "─────────────────────────────────"
echo "📈 전체 통계:"
echo ""

# 전체 파일 수
TOTAL_FILES=$(find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l)
echo "총 파일 수: ${TOTAL_FILES}개"

# 총 줄 수
TOTAL_LINES=$(find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec cat {} \; | wc -l)
echo "총 줄 수: ${TOTAL_LINES}줄"

# 평균
if [ "$TOTAL_FILES" -gt 0 ]; then
  AVG=$((TOTAL_LINES / TOTAL_FILES))
  echo "평균: ${AVG}줄/파일"
fi

echo ""
echo "📁 가장 큰 파일 Top 10:"
find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} \; | sort -rn | head -10
