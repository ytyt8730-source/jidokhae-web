#!/bin/bash
# ===========================================
# 컴포넌트 템플릿 생성 스크립트
# 사용: ./scripts/create-component.sh [컴포넌트명] [타입]
# 타입: client (기본), server, page
# 예시: ./scripts/create-component.sh Button client
# ===========================================

NAME=$1
TYPE=${2:-"client"}
DIR="jidokhae/src/components"

if [ -z "$NAME" ]; then
  echo "사용법: ./scripts/create-component.sh [컴포넌트명] [타입]"
  echo ""
  echo "타입:"
  echo "  client  - 클라이언트 컴포넌트 (기본)"
  echo "  server  - 서버 컴포넌트"
  echo "  page    - 페이지 컴포넌트"
  echo ""
  echo "예시:"
  echo "  ./scripts/create-component.sh Button"
  echo "  ./scripts/create-component.sh UserList server"
  echo "  ./scripts/create-component.sh AdminDashboard page"
  exit 1
fi

FILE_PATH="$DIR/${NAME}.tsx"

# 이미 존재하는지 확인
if [ -f "$FILE_PATH" ]; then
  echo "❌ 이미 존재함: $FILE_PATH"
  exit 1
fi

echo "🔨 컴포넌트 생성: $NAME ($TYPE)"

case $TYPE in
  "client")
    cat > "$FILE_PATH" << EOF
'use client'

import { useState } from 'react'

interface ${NAME}Props {
  // TODO: props 정의
}

export function ${NAME}({ }: ${NAME}Props) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">${NAME}</h2>
      {/* TODO: 컴포넌트 내용 */}
    </div>
  )
}
EOF
    ;;
    
  "server")
    cat > "$FILE_PATH" << EOF
import { createClient } from '@/lib/supabase/server'

interface ${NAME}Props {
  // TODO: props 정의
}

export async function ${NAME}({ }: ${NAME}Props) {
  const supabase = await createClient()
  
  // TODO: 데이터 fetching
  // const { data, error } = await supabase.from('table').select()

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">${NAME}</h2>
      {/* TODO: 컴포넌트 내용 */}
    </div>
  )
}
EOF
    ;;
    
  "page")
    cat > "$FILE_PATH" << EOF
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '${NAME}',
  description: '${NAME} 페이지',
}

export default async function ${NAME}Page() {
  const supabase = await createClient()
  
  // TODO: 데이터 fetching
  // const { data, error } = await supabase.from('table').select()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">${NAME}</h1>
      {/* TODO: 페이지 내용 */}
    </main>
  )
}
EOF
    ;;
    
  *)
    echo "❌ 알 수 없는 타입: $TYPE"
    echo "사용 가능: client, server, page"
    exit 1
    ;;
esac

echo "✅ 생성 완료: $FILE_PATH"
echo ""
echo "📄 파일 내용:"
echo "─────────────────────────────────"
cat "$FILE_PATH"
