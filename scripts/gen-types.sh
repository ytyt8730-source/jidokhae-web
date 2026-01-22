#!/bin/bash
# ===========================================
# Supabase 타입 생성 스크립트
# 사용: ./scripts/gen-types.sh
# ===========================================

echo "🔄 Supabase 타입 생성 중..."
echo ""

# .env.local에서 PROJECT_ID 읽기 시도
if [ -f "jidokhae/.env.local" ]; then
  PROJECT_ID=$(grep "SUPABASE_PROJECT_ID" jidokhae/.env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

if [ -z "$PROJECT_ID" ]; then
  echo "⚠️ SUPABASE_PROJECT_ID가 설정되지 않았습니다."
  echo ""
  echo "다음 중 하나를 실행하세요:"
  echo "1. jidokhae/.env.local에 SUPABASE_PROJECT_ID 추가"
  echo "2. 직접 실행: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > jidokhae/src/types/database.ts"
  exit 1
fi

cd jidokhae

echo "📌 Project ID: $PROJECT_ID"
echo ""

npx supabase gen types typescript --project-id "$PROJECT_ID" > src/types/database.ts

if [ $? -eq 0 ]; then
  echo "✅ 타입 생성 완료!"
  echo "📄 파일: jidokhae/src/types/database.ts"
  echo ""
  echo "생성된 타입 개수:"
  grep -c "export type" src/types/database.ts || echo "0"
else
  echo "❌ 타입 생성 실패"
  echo "Supabase CLI 로그인이 필요할 수 있습니다: npx supabase login"
fi

cd ..
