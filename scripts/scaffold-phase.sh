#!/bin/bash
# Phase별 파일 구조 미리 생성 (빈 깡통 전략)
# 용도: 에이전트가 파일 생성에 컨텍스트 낭비하지 않도록
# 환경: Windows Git Bash 호환

MILESTONE=$1
PHASE=$2

if [ -z "$MILESTONE" ] || [ -z "$PHASE" ]; then
    echo "🏗️ 빈 깡통 생성 스크립트"
    echo ""
    echo "Usage: ./scripts/scaffold-phase.sh M5 1"
    echo ""
    echo "Arguments:"
    echo "  MILESTONE  마일스톤 번호 (예: M5, M6)"
    echo "  PHASE      Phase 번호 (예: 1, 2, 3)"
    echo ""
    echo "예시:"
    echo "  ./scripts/scaffold-phase.sh M5 1"
    echo "  ./scripts/scaffold-phase.sh M6 2"
    exit 1
fi

echo "🏗️ ${MILESTONE} Phase ${PHASE} 파일 구조 생성 중..."
echo ""

# Scenario 파일 경로 (한글 파일명 지원)
SC_DIR="roadmap/scenarios"

# Scenario 파일 찾기 (M번호로 검색)
SC_FILE=$(find "$SC_DIR" -name "*${MILESTONE}*" -type f 2>/dev/null | head -1)

if [ -z "$SC_FILE" ] || [ ! -f "$SC_FILE" ]; then
    echo "⚠️ Scenario 파일을 찾을 수 없습니다."
    echo "   검색 경로: $SC_DIR/*${MILESTONE}*"
    echo ""
    echo "💡 WP 파일에서 직접 파일 목록을 추출합니다..."

    # Work Package 파일 찾기
    WP_DIR="roadmap/work-packages"
    WP_FILE=$(find "$WP_DIR" -name "*${MILESTONE}*" -type f 2>/dev/null | head -1)

    if [ -z "$WP_FILE" ] || [ ! -f "$WP_FILE" ]; then
        echo "❌ WP 파일도 찾을 수 없습니다."
        exit 1
    fi

    SC_FILE="$WP_FILE"
    echo "   사용 파일: $SC_FILE"
fi

echo "📄 참조 파일: $SC_FILE"
echo ""

# Phase 섹션에서 파일 경로 추출
# 패턴: src/로 시작하는 경로
FILES=$(cat "$SC_FILE" | sed -n "/[Pp]hase ${PHASE}/,/[Pp]hase $((PHASE+1))/p" | grep -oE 'src/[a-zA-Z0-9/_\.\-]+\.(tsx?|ts)' | sort -u)

# Phase 섹션이 마지막이면 파일 끝까지 검색
if [ -z "$FILES" ]; then
    FILES=$(cat "$SC_FILE" | sed -n "/[Pp]hase ${PHASE}/,\$p" | grep -oE 'src/[a-zA-Z0-9/_\.\-]+\.(tsx?|ts)' | sort -u)
fi

if [ -z "$FILES" ]; then
    echo "⚠️ Phase ${PHASE}에서 파일 경로를 찾을 수 없습니다."
    echo "   Scenario/WP 문서에 'src/' 경로가 포함되어 있는지 확인하세요."
    echo ""
    echo "💡 대안: 수동으로 파일을 생성하거나, WP 문서를 확인하세요."
    exit 0
fi

echo "📁 발견된 파일 경로:"
echo "$FILES" | sed 's/^/   /'
echo ""

# 파일 생성
COUNT=0
SKIPPED=0

for file in $FILES; do
    FULL_PATH="jidokhae/$file"

    if [ ! -f "$FULL_PATH" ]; then
        # 디렉토리 생성
        mkdir -p "$(dirname $FULL_PATH)"

        # 파일 확장자에 따른 기본 내용
        EXT="${file##*.}"

        case "$EXT" in
            tsx)
                cat > "$FULL_PATH" << 'EOF'
// TODO: Phase 구현 예정
// 이 파일은 빈 깡통 전략으로 미리 생성되었습니다.
// 에이전트가 내용을 채울 예정입니다.

export default function Component() {
  return null
}
EOF
                ;;
            ts)
                cat > "$FULL_PATH" << 'EOF'
// TODO: Phase 구현 예정
// 이 파일은 빈 깡통 전략으로 미리 생성되었습니다.
// 에이전트가 내용을 채울 예정입니다.
EOF
                ;;
            *)
                echo "// TODO: Implement" > "$FULL_PATH"
                ;;
        esac

        echo "  ✅ Created: $file"
        ((COUNT++))
    else
        echo "  ⏭️ Exists: $file"
        ((SKIPPED++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ 생성된 파일: ${COUNT}개"
echo "  ⏭️ 이미 존재: ${SKIPPED}개"
echo ""

if [ $COUNT -gt 0 ]; then
    echo "👉 이제 @agent-파이프라인이 내용을 채웁니다."
else
    echo "👉 모든 파일이 이미 존재합니다. 코딩을 시작하세요."
fi
