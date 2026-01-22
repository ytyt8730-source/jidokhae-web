#!/bin/bash
# ===========================================
# 환경 변수 검증 스크립트
# 사용: ./scripts/check-env.sh
# ===========================================

echo "🔍 환경 변수 검증 중..."
echo ""

ENV_FILE="jidokhae/.env.local"
TEMPLATE_FILE="jidokhae/ENV_TEMPLATE.md"

# .env.local 존재 확인
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE 파일이 없습니다!"
  echo ""
  echo "ENV_TEMPLATE.md를 참고하여 생성하세요:"
  echo "  cp jidokhae/ENV_TEMPLATE.md jidokhae/.env.local"
  exit 1
fi

echo "📄 $ENV_FILE 검사 중..."
echo ""

# 필수 환경 변수 목록
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

# M2 결제 관련 (선택)
PAYMENT_VARS=(
  "PORTONE_STORE_ID"
  "PORTONE_CHANNEL_KEY"
  "PORTONE_API_SECRET"
)

# M3 알림 관련 (선택)
NOTIFICATION_VARS=(
  "SOLAPI_API_KEY"
  "SOLAPI_API_SECRET"
  "SOLAPI_PFID"
)

# 검사 결과
MISSING_REQUIRED=()
MISSING_PAYMENT=()
MISSING_NOTIFICATION=()

# 필수 변수 검사
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔴 필수 환경 변수"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for VAR in "${REQUIRED_VARS[@]}"; do
  VALUE=$(grep "^$VAR=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$VALUE" ] || [ "$VALUE" = '""' ] || [ "$VALUE" = "''" ]; then
    echo "  ❌ $VAR"
    MISSING_REQUIRED+=("$VAR")
  else
    # 값의 앞 10글자만 표시 (보안)
    PREVIEW="${VALUE:0:10}..."
    echo "  ✅ $VAR = $PREVIEW"
  fi
done
echo ""

# 결제 변수 검사
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🟡 결제 환경 변수 (M2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for VAR in "${PAYMENT_VARS[@]}"; do
  VALUE=$(grep "^$VAR=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$VALUE" ] || [ "$VALUE" = '""' ] || [ "$VALUE" = "''" ]; then
    echo "  ⚠️  $VAR (미설정)"
    MISSING_PAYMENT+=("$VAR")
  else
    PREVIEW="${VALUE:0:10}..."
    echo "  ✅ $VAR = $PREVIEW"
  fi
done
echo ""

# 알림 변수 검사
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🟡 알림 환경 변수 (M3)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for VAR in "${NOTIFICATION_VARS[@]}"; do
  VALUE=$(grep "^$VAR=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$VALUE" ] || [ "$VALUE" = '""' ] || [ "$VALUE" = "''" ]; then
    echo "  ⚠️  $VAR (미설정)"
    MISSING_NOTIFICATION+=("$VAR")
  else
    PREVIEW="${VALUE:0:10}..."
    echo "  ✅ $VAR = $PREVIEW"
  fi
done
echo ""

# 결과 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 검사 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
  echo ""
  echo "🚨 필수 환경 변수 누락!"
  for VAR in "${MISSING_REQUIRED[@]}"; do
    echo "   - $VAR"
  done
  echo ""
  echo "ENV_TEMPLATE.md를 참고하여 설정하세요."
  exit 1
fi

echo "  ✅ 필수 환경 변수: 모두 설정됨"

if [ ${#MISSING_PAYMENT[@]} -gt 0 ]; then
  echo "  ⚠️  결제 환경 변수: ${#MISSING_PAYMENT[@]}개 미설정 (결제 기능 비활성)"
else
  echo "  ✅ 결제 환경 변수: 모두 설정됨"
fi

if [ ${#MISSING_NOTIFICATION[@]} -gt 0 ]; then
  echo "  ⚠️  알림 환경 변수: ${#MISSING_NOTIFICATION[@]}개 미설정 (알림 기능 비활성)"
else
  echo "  ✅ 알림 환경 변수: 모두 설정됨"
fi

echo ""
echo "✅ 환경 변수 검증 완료!"
