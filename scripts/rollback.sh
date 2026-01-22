#!/bin/bash
# 실패 시 자동 롤백
# 환경: Windows Git Bash 호환

MILESTONE=$1
PHASE=$2

if [ -z "$MILESTONE" ] || [ -z "$PHASE" ]; then
    echo "Usage: ./scripts/rollback.sh [milestone] [phase]"
    echo ""
    echo "예시:"
    echo "  ./scripts/rollback.sh M7 2"
    exit 1
fi

echo "⏪ $MILESTONE Phase $PHASE 롤백 시작..."
echo ""

# 마지막 성공 커밋 찾기 (이전 Phase 커밋)
if [ "$PHASE" -gt 1 ]; then
    PREV_PHASE=$((PHASE - 1))
    LAST_GOOD=$(git log --oneline --grep="\[${MILESTONE}\].*Phase ${PREV_PHASE}" -1 --format="%H")
else
    # Phase 1이면 브랜치 시작점으로
    LAST_GOOD=$(git merge-base main HEAD)
fi

if [ -n "$LAST_GOOD" ]; then
    echo "📍 롤백 지점 발견: ${LAST_GOOD:0:7}"
    echo ""

    # 현재 변경사항 스태시
    STASH_MSG="rollback-backup-phase-$PHASE-$(date +%Y%m%d%H%M%S)"
    git stash push -m "$STASH_MSG" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "💾 현재 변경사항 백업됨: $STASH_MSG"
    fi

    # 롤백 실행
    git reset --hard "$LAST_GOOD"

    echo ""
    echo "✅ 롤백 완료: ${LAST_GOOD:0:7}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 복구 방법"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  변경사항 복구: git stash pop"
    echo "  스태시 목록:   git stash list"
    echo ""

    # 로깅
    if [ -f "scripts/pipeline-logger.sh" ]; then
        bash scripts/pipeline-logger.sh rollback "$MILESTONE" "$PHASE" "롤백 to ${LAST_GOOD:0:7}"
    fi
else
    echo "⚠️ 롤백 지점을 찾을 수 없습니다"
    echo ""
    echo "💡 수동으로 확인해주세요:"
    echo "   git log --oneline -10"
    echo "   git reset --hard [커밋해시]"
    exit 1
fi
