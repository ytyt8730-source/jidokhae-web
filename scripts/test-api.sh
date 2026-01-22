#!/bin/bash
# API 엔드포인트 자동 테스트
# 환경: Windows Git Bash 호환

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "🧪 API 테스트 시작..."
echo "   Base URL: $BASE_URL"
echo ""

test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local EXPECTED=$3
    local DESCRIPTION=$4

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" 2>/dev/null)

    if [ "$RESPONSE" = "$EXPECTED" ]; then
        echo "✅ $METHOD $ENDPOINT → $RESPONSE ($DESCRIPTION)"
        ((PASS++))
    else
        echo "❌ $METHOD $ENDPOINT → $RESPONSE (expected $EXPECTED) ($DESCRIPTION)"
        ((FAIL++))
    fi
}

# 서버 상태 확인
echo "1️⃣ 서버 연결 확인..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo "❌ 서버에 연결할 수 없습니다: $BASE_URL"
    echo ""
    echo "💡 서버를 먼저 실행해주세요:"
    echo "   cd jidokhae && npm run dev"
    exit 1
fi
echo "   ✅ 서버 연결됨"
echo ""

# API 테스트
echo "2️⃣ API 엔드포인트 테스트..."

# 기본 엔드포인트
test_endpoint "GET" "/" "200" "홈페이지"

# 공개 API
test_endpoint "GET" "/api/meetings" "200" "모임 목록"
test_endpoint "GET" "/api/banners" "200" "배너 목록"

# 인증 필요 엔드포인트 (401 예상)
test_endpoint "GET" "/api/users/me" "401" "인증 필요"
test_endpoint "GET" "/api/praises" "401" "칭찬 목록 (인증 필요)"

# 관리자 API (401 예상)
test_endpoint "GET" "/api/admin/stats" "401" "관리자 통계 (인증 필요)"
test_endpoint "GET" "/api/admin/users/search" "401" "사용자 검색 (인증 필요)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 API 테스트 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ 통과: $PASS"
echo "   ❌ 실패: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "❌ 일부 테스트 실패"
    exit 1
else
    echo "✅ 모든 테스트 통과!"
    exit 0
fi
