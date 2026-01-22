#!/bin/bash
# ===========================================
# 코드 패턴 검색 스크립트
# 사용: ./scripts/find-pattern.sh "패턴" [디렉토리]
# 예시: ./scripts/find-pattern.sh "as any" jidokhae/src
# ===========================================

PATTERN=$1
DIR=${2:-"jidokhae/src"}

if [ -z "$PATTERN" ]; then
  echo "사용법: ./scripts/find-pattern.sh \"패턴\" [디렉토리]"
  echo ""
  echo "자주 쓰는 패턴:"
  echo "  ./scripts/find-pattern.sh \"as any\"        # any 타입 사용"
  echo "  ./scripts/find-pattern.sh \"console.log\"   # 콘솔 로그"
  echo "  ./scripts/find-pattern.sh \"style={{\"      # 인라인 스타일"
  echo "  ./scripts/find-pattern.sh \"TODO\"          # TODO 주석"
  echo "  ./scripts/find-pattern.sh \"FIXME\"         # FIXME 주석"
  exit 1
fi

echo "🔍 패턴 검색: \"$PATTERN\""
echo "📁 대상: $DIR"
echo "─────────────────────────────────"

RESULTS=$(grep -rn "$PATTERN" "$DIR" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null)

if [ -z "$RESULTS" ]; then
  echo ""
  echo "✅ 발견된 패턴 없음"
else
  echo ""
  echo "$RESULTS"
  echo ""
  echo "─────────────────────────────────"
  COUNT=$(echo "$RESULTS" | wc -l)
  echo "📊 총 ${COUNT}개 발견"
  
  # 파일별 집계
  echo ""
  echo "📁 파일별 집계:"
  echo "$RESULTS" | cut -d: -f1 | sort | uniq -c | sort -rn
fi
