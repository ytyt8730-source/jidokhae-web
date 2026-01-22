#!/bin/bash
# ===========================================
# 코딩 시작 전 체크 스크립트
# 사용: ./scripts/start-coding.sh
# ===========================================

echo "🔍 코딩 시작 전 체크..."
echo ""

# 1. 브랜치 확인
BRANCH=$(git branch --show-current)
echo "📌 현재 브랜치: $BRANCH"

if [ "$BRANCH" = "main" ]; then
  echo ""
  echo "❌ main 브랜치에서 작업 중입니다!"
  echo ""
  echo "브랜치를 생성하세요:"
  echo "  git checkout -b feature/m[번호]-[작업명]"
  echo ""
  exit 1
fi

echo "✅ 브랜치 OK"
echo ""

# 2. 변경사항 확인
CHANGES=$(git status --porcelain)
if [ -n "$CHANGES" ]; then
  echo "📝 커밋되지 않은 변경사항:"
  git status --short
  echo ""
fi

# 3. 현재 상태 요약
echo "📄 현재 상태 (current-state.md):"
echo "---"
if [ -f "log/current-state.md" ]; then
  head -30 log/current-state.md
else
  echo "(파일 없음)"
fi
echo "---"
echo ""

echo "✅ 준비 완료! 코딩을 시작하세요."
echo ""
echo "💡 다음 명령어:"
echo "  @agent-코딩 Phase [N] 구현해줘"
