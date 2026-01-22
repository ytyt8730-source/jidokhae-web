#!/bin/bash
# 최근 변경분 기반 컨텍스트 생성
# 용도: 이어서 작업할 때 빠른 현황 파악
# 환경: Windows Git Bash 호환

DAYS=${1:-1}

echo "📊 최근 ${DAYS}일 변경분 컨텍스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 현재 상태 (Windows 호환: 공백 제거)
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l | tr -d ' ')
echo "## Git 상태"
echo "- 브랜치: $(git branch --show-current)"
echo "- 미커밋: ${UNCOMMITTED_COUNT}개 파일"
echo ""

# 2. 최근 커밋
echo "## 최근 커밋 (${DAYS}일)"
COMMITS=$(git log --oneline --since="${DAYS}.days.ago" 2>/dev/null | head -10)
if [ -z "$COMMITS" ]; then
    echo "(해당 기간 커밋 없음)"
else
    echo "$COMMITS"
fi
echo ""

# 3. 변경된 파일
echo "## 변경된 파일"
CHANGES=$(git diff --name-status HEAD~5 2>/dev/null)
if [ -z "$CHANGES" ]; then
    git status --porcelain
else
    echo "$CHANGES"
fi
echo ""

# 4. current-state 요약
if [ -f "log/current-state.md" ]; then
    echo "## 현재 작업 상태 (current-state.md)"
    head -50 log/current-state.md
fi
