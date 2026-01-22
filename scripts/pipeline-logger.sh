#!/bin/bash
# 파이프라인 진행 상황 로깅
# 환경: Windows Git Bash 호환

ACTION=$1
MILESTONE=$2
PHASE=$3
MESSAGE=$4

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_DIR="log"
LOG_FILE="$LOG_DIR/pipeline-${MILESTONE}.log"

# log 폴더 없으면 생성
mkdir -p "$LOG_DIR"

case $ACTION in
    "start")
        echo "[$TIMESTAMP] 🚀 $MILESTONE 파이프라인 시작" >> "$LOG_FILE"
        ;;
    "phase-start")
        echo "[$TIMESTAMP] ▶️ Phase $PHASE 시작" >> "$LOG_FILE"
        ;;
    "phase-end")
        echo "[$TIMESTAMP] ✅ Phase $PHASE 완료 - $MESSAGE" >> "$LOG_FILE"
        ;;
    "error")
        echo "[$TIMESTAMP] ❌ 에러 - $MESSAGE" >> "$LOG_FILE"
        ;;
    "complete")
        echo "[$TIMESTAMP] 🎉 $MILESTONE 완료!" >> "$LOG_FILE"
        ;;
    "rollback")
        echo "[$TIMESTAMP] ⏪ Phase $PHASE 롤백 - $MESSAGE" >> "$LOG_FILE"
        ;;
    *)
        echo "Usage: ./scripts/pipeline-logger.sh [action] [milestone] [phase] [message]"
        echo ""
        echo "Actions:"
        echo "  start       - 마일스톤 시작"
        echo "  phase-start - Phase 시작"
        echo "  phase-end   - Phase 완료"
        echo "  error       - 에러 발생"
        echo "  complete    - 마일스톤 완료"
        echo "  rollback    - 롤백 발생"
        echo ""
        echo "예시:"
        echo "  ./scripts/pipeline-logger.sh start M7"
        echo "  ./scripts/pipeline-logger.sh phase-start M7 1"
        echo "  ./scripts/pipeline-logger.sh phase-end M7 1 'commit: abc1234'"
        exit 1
        ;;
esac

# 실시간 상태 JSON 업데이트
cat > "$LOG_DIR/pipeline-status.json" << EOF
{
    "milestone": "$MILESTONE",
    "currentPhase": "$PHASE",
    "lastAction": "$ACTION",
    "timestamp": "$TIMESTAMP",
    "message": "$MESSAGE"
}
EOF

echo "📝 로그 기록: $ACTION"
