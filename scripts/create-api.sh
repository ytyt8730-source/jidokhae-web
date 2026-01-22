#!/bin/bash
# ===========================================
# API 라우트 템플릿 생성 스크립트
# 사용: ./scripts/create-api.sh [경로] [메소드]
# 예시: ./scripts/create-api.sh admin/users GET,POST
#       ./scripts/create-api.sh registrations/cancel POST
# ===========================================

ROUTE_PATH=$1
METHODS=${2:-"GET,POST"}
BASE_DIR="jidokhae/src/app/api"

if [ -z "$ROUTE_PATH" ]; then
  echo "사용법: ./scripts/create-api.sh [경로] [메소드]"
  echo ""
  echo "예시:"
  echo "  ./scripts/create-api.sh admin/users GET,POST"
  echo "  ./scripts/create-api.sh registrations/cancel POST"
  echo "  ./scripts/create-api.sh cron/cleanup GET"
  echo ""
  echo "메소드: GET, POST, PUT, PATCH, DELETE (쉼표로 구분)"
  exit 1
fi

# 디렉토리 생성
TARGET_DIR="$BASE_DIR/$ROUTE_PATH"
mkdir -p "$TARGET_DIR"

FILE_PATH="$TARGET_DIR/route.ts"

# 이미 존재하는지 확인
if [ -f "$FILE_PATH" ]; then
  echo "❌ 이미 존재함: $FILE_PATH"
  exit 1
fi

echo "🔨 API 라우트 생성: /api/$ROUTE_PATH"
echo "   메소드: $METHODS"

# 메소드 배열로 변환
IFS=',' read -ra METHOD_ARRAY <<< "$METHODS"

# 파일 생성 시작
cat > "$FILE_PATH" << 'HEADER'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api'
import { createLogger } from '@/lib/logger'

HEADER

# 로거 이름 생성 (경로에서 추출)
LOGGER_NAME=$(echo "$ROUTE_PATH" | tr '/' '-' | tr '[:upper:]' '[:lower:]')
echo "const logger = createLogger('$LOGGER_NAME')" >> "$FILE_PATH"
echo "" >> "$FILE_PATH"

# 각 메소드별 함수 생성
for METHOD in "${METHOD_ARRAY[@]}"; do
  METHOD=$(echo "$METHOD" | tr '[:lower:]' '[:upper:]' | xargs)

  case $METHOD in
    "GET")
      cat >> "$FILE_PATH" << 'EOF'
/**
 * GET /api/ROUTE_PATH
 * TODO: API 설명 추가
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // TODO: 인증 체크 (필요시)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return errorResponse('AUTH_REQUIRED')
    // }

    // TODO: 쿼리 파라미터 파싱 (필요시)
    // const { searchParams } = new URL(request.url)
    // const page = parseInt(searchParams.get('page') || '1')

    // TODO: 데이터 조회
    const { data, error } = await supabase
      .from('table_name')
      .select('*')

    if (error) {
      logger.error('GET 실패', { error })
      return errorResponse('DB_ERROR', error.message)
    }

    logger.info('GET 성공', { count: data?.length })
    return successResponse(data)
  })
}

EOF
      ;;

    "POST")
      cat >> "$FILE_PATH" << 'EOF'
/**
 * POST /api/ROUTE_PATH
 * TODO: API 설명 추가
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return errorResponse('AUTH_REQUIRED')
    }

    // 요청 바디 파싱
    const body = await request.json()

    // TODO: 입력 검증
    // if (!body.requiredField) {
    //   return errorResponse('VALIDATION_ERROR', 'requiredField is required')
    // }

    // TODO: 데이터 생성
    const { data, error } = await supabase
      .from('table_name')
      .insert({
        user_id: user.id,
        // ...body
      })
      .select()
      .single()

    if (error) {
      logger.error('POST 실패', { error, userId: user.id })
      return errorResponse('DB_ERROR', error.message)
    }

    logger.info('POST 성공', { id: data?.id, userId: user.id })
    return successResponse(data)
  })
}

EOF
      ;;

    "PUT"|"PATCH")
      cat >> "$FILE_PATH" << 'EOF'
/**
 * PUT /api/ROUTE_PATH
 * TODO: API 설명 추가
 */
export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return errorResponse('AUTH_REQUIRED')
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return errorResponse('VALIDATION_ERROR', 'id is required')
    }

    // TODO: 데이터 수정
    const { data, error } = await supabase
      .from('table_name')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('PUT 실패', { error, id })
      return errorResponse('DB_ERROR', error.message)
    }

    logger.info('PUT 성공', { id })
    return successResponse(data)
  })
}

EOF
      ;;

    "DELETE")
      cat >> "$FILE_PATH" << 'EOF'
/**
 * DELETE /api/ROUTE_PATH
 * TODO: API 설명 추가
 */
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = await createClient()

    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return errorResponse('AUTH_REQUIRED')
    }

    // 쿼리 파라미터에서 ID 추출
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('VALIDATION_ERROR', 'id is required')
    }

    // TODO: 데이터 삭제
    const { error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('DELETE 실패', { error, id })
      return errorResponse('DB_ERROR', error.message)
    }

    logger.info('DELETE 성공', { id })
    return successResponse({ deleted: true })
  })
}

EOF
      ;;
  esac
done

# ROUTE_PATH 치환
sed -i "s|ROUTE_PATH|$ROUTE_PATH|g" "$FILE_PATH"

echo "✅ 생성 완료: $FILE_PATH"
echo ""
echo "📄 생성된 메소드:"
for METHOD in "${METHOD_ARRAY[@]}"; do
  echo "   - $METHOD"
done
echo ""
echo "💡 다음 단계:"
echo "   1. TODO 주석 부분 구현"
echo "   2. 테이블명 및 필드명 수정"
echo "   3. 입력 검증 로직 추가"
