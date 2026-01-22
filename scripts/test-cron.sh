#!/bin/bash
# ===========================================
# Cron 작업 로컬 테스트 스크립트
# 사용: ./scripts/test-cron.sh [cron-name]
# 예시: ./scripts/test-cron.sh reminder
#       ./scripts/test-cron.sh afterglow
# ===========================================

CRON_NAME=$1
BASE_URL=${2:-"http://localhost:3000"}

# 사용 가능한 Cron 작업 목록
AVAILABLE_CRONS=(
  "reminder"
  "waitlist"
  "monthly"
  "segment-reminder"
  "post-meeting"
  "auto-complete"
  "welcome"
  "first-meeting-followup"
  "eligibility-warning"
  "afterglow"
  "transfer-timeout"
)

show_help() {
  echo "🔄 Cron 작업 로컬 테스트"
  echo ""
  echo "사용법: ./scripts/test-cron.sh [cron-name] [base-url]"
  echo ""
  echo "사용 가능한 Cron 작업:"
  for cron in "${AVAILABLE_CRONS[@]}"; do
    echo "  - $cron"
  done
  echo ""
  echo "예시:"
  echo "  ./scripts/test-cron.sh reminder"
  echo "  ./scripts/test-cron.sh afterglow http://localhost:3001"
  echo ""
  echo "전체 테스트:"
  echo "  ./scripts/test-cron.sh all"
}

test_cron() {
  local name=$1
  local url="${BASE_URL}/api/cron/${name}"

  echo "📡 테스트: $name"
  echo "   URL: $url"

  # curl로 요청
  RESPONSE=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 성공 (HTTP $HTTP_CODE)"
    echo "   📄 응답: $(echo $BODY | head -c 100)..."
  else
    echo "   ❌ 실패 (HTTP $HTTP_CODE)"
    echo "   📄 응답: $BODY"
  fi
  echo ""
}

# 인자 없으면 도움말
if [ -z "$CRON_NAME" ]; then
  show_help
  exit 0
fi

echo "🔄 Cron 로컬 테스트"
echo "==================="
echo ""
echo "⚠️  개발 서버가 실행 중이어야 합니다!"
echo "   npm run dev (localhost:3000)"
echo ""

# 서버 상태 확인
echo "🔍 서버 상태 확인..."
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}" 2>/dev/null)

if [ "$SERVER_CHECK" != "200" ]; then
  echo "❌ 서버가 응답하지 않습니다: $BASE_URL"
  echo ""
  echo "개발 서버를 먼저 실행하세요:"
  echo "  cd jidokhae && npm run dev"
  exit 1
fi

echo "✅ 서버 응답 확인"
echo ""

# 전체 테스트
if [ "$CRON_NAME" = "all" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 전체 Cron 작업 테스트"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  PASS=0
  FAIL=0

  for cron in "${AVAILABLE_CRONS[@]}"; do
    url="${BASE_URL}/api/cron/${cron}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$HTTP_CODE" = "200" ]; then
      echo "  ✅ $cron"
      PASS=$((PASS + 1))
    else
      echo "  ❌ $cron (HTTP $HTTP_CODE)"
      FAIL=$((FAIL + 1))
    fi
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 결과: 성공 $PASS개, 실패 $FAIL개"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# 특정 Cron 테스트
VALID=false
for cron in "${AVAILABLE_CRONS[@]}"; do
  if [ "$cron" = "$CRON_NAME" ]; then
    VALID=true
    break
  fi
done

if [ "$VALID" = false ]; then
  echo "❌ 알 수 없는 Cron 작업: $CRON_NAME"
  echo ""
  show_help
  exit 1
fi

test_cron "$CRON_NAME"
