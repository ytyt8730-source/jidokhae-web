#!/bin/bash
# ===========================================
# 빠른 상태 확인 스크립트
# 사용: ./scripts/status.sh
# ===========================================

echo "📊 현재 상태"
echo "==========="
echo ""

# 1. 브랜치
echo "🌿 브랜치: $(git branch --show-current)"
echo ""

# 2. 변경사항
CHANGES=$(git status --porcelain | wc -l)
echo "📝 변경된 파일: ${CHANGES}개"
if [ "$CHANGES" -gt 0 ]; then
  git status --short
fi
echo ""

# 3. 최근 커밋
echo "📌 최근 커밋:"
git log --oneline -3
echo ""

# 4. current-state.md 요약
echo "📄 current-state.md:"
echo "---"
if [ -f "log/current-state.md" ]; then
  # 현재 상태 요약 부분만 출력
  sed -n '/## 📌 현재 상태 요약/,/## ✅/p' log/current-state.md | head -15
else
  echo "(파일 없음)"
fi
echo "---"
