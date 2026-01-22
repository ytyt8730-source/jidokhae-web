#!/bin/bash
# ===========================================
# DB 마이그레이션 가이드 스크립트
# 사용: ./scripts/db-migrate.sh [action]
# ===========================================

ACTION=$1
SQL_DIR="jidokhae/supabase"

show_help() {
  echo "🗄️ DB 마이그레이션 가이드"
  echo ""
  echo "사용법: ./scripts/db-migrate.sh [action]"
  echo ""
  echo "명령어:"
  echo "  list     - 마이그레이션 파일 목록 표시"
  echo "  show     - 특정 파일 내용 표시"
  echo "  check    - SQL 파일 문법 검사 (간단)"
  echo "  order    - 실행 순서 가이드"
  echo ""
  echo "예시:"
  echo "  ./scripts/db-migrate.sh list"
  echo "  ./scripts/db-migrate.sh show migration-v1.2.0-full-reset.sql"
  echo "  ./scripts/db-migrate.sh order"
}

list_migrations() {
  echo "📄 마이그레이션 파일 목록"
  echo "========================"
  echo ""

  if [ ! -d "$SQL_DIR" ]; then
    echo "❌ $SQL_DIR 디렉토리가 없습니다."
    exit 1
  fi

  echo "📂 $SQL_DIR/"
  echo ""

  # 파일 목록
  for file in "$SQL_DIR"/*.sql; do
    if [ -f "$file" ]; then
      FILENAME=$(basename "$file")
      LINES=$(wc -l < "$file")
      SIZE=$(du -h "$file" | cut -f1)
      echo "  📄 $FILENAME ($LINES lines, $SIZE)"
    fi
  done
  echo ""
}

show_file() {
  local filename=$1

  if [ -z "$filename" ]; then
    echo "❌ 파일명을 지정하세요."
    echo ""
    list_migrations
    exit 1
  fi

  local filepath="$SQL_DIR/$filename"

  if [ ! -f "$filepath" ]; then
    echo "❌ 파일을 찾을 수 없습니다: $filepath"
    exit 1
  fi

  echo "📄 $filename"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  cat "$filepath"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

check_syntax() {
  echo "🔍 SQL 파일 기본 검사"
  echo "===================="
  echo ""

  ERRORS=0

  for file in "$SQL_DIR"/*.sql; do
    if [ -f "$file" ]; then
      FILENAME=$(basename "$file")

      # 기본 문법 체크 (간단)
      HAS_CREATE=$(grep -c "CREATE" "$file" 2>/dev/null || echo "0")
      HAS_INSERT=$(grep -c "INSERT" "$file" 2>/dev/null || echo "0")
      HAS_UPDATE=$(grep -c "UPDATE" "$file" 2>/dev/null || echo "0")
      HAS_DELETE=$(grep -c "DELETE" "$file" 2>/dev/null || echo "0")

      echo "  📄 $FILENAME"
      echo "     CREATE: $HAS_CREATE, INSERT: $HAS_INSERT, UPDATE: $HAS_UPDATE, DELETE: $HAS_DELETE"

      # 위험한 패턴 체크
      if grep -q "DROP TABLE" "$file"; then
        echo "     ⚠️  DROP TABLE 발견 - 주의!"
      fi
      if grep -q "TRUNCATE" "$file"; then
        echo "     ⚠️  TRUNCATE 발견 - 주의!"
      fi
      if grep -q "DELETE FROM.*WHERE" "$file"; then
        # DELETE with WHERE is okay
        :
      elif grep -q "DELETE FROM" "$file"; then
        echo "     ⚠️  WHERE 없는 DELETE 발견 - 주의!"
      fi
    fi
  done

  echo ""
  echo "✅ 기본 검사 완료"
  echo ""
  echo "⚠️  실제 SQL 실행은 Supabase 대시보드에서 직접 수행하세요:"
  echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
}

show_order() {
  echo "📋 마이그레이션 실행 순서 가이드"
  echo "================================"
  echo ""
  echo "🔄 신규 설치 (처음부터):"
  echo ""
  echo "  1. migration-v1.2.0-full-reset.sql"
  echo "     - 기본 테이블 생성 (users, meetings, registrations 등)"
  echo "     - RLS 정책 설정"
  echo "     - 기본 함수 생성"
  echo ""
  echo "  2. m6-notification-templates.sql"
  echo "     - M6 알림 템플릿 추가 (4개)"
  echo "     - NEW_MEMBER_WELCOME, FIRST_MEETING_FOLLOWUP 등"
  echo ""
  echo "  3. m7-notification-templates.sql"
  echo "     - M7 알림 템플릿 추가 (AFTERGLOW)"
  echo "     - REMINDER_1D 업데이트 (티저 문구)"
  echo ""
  echo "  4. test-seed-data.sql (개발 환경만)"
  echo "     - 테스트 데이터 추가"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔄 업데이트 (기존 DB):"
  echo ""
  echo "  M6 → M7 업데이트 시:"
  echo "  - m7-notification-templates.sql만 실행"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚠️  주의사항:"
  echo "  - 프로덕션 실행 전 반드시 백업!"
  echo "  - migration-v1.2.0-full-reset.sql은 기존 데이터 삭제됨"
  echo "  - Supabase 대시보드 SQL Editor에서 실행 권장"
}

# 메인 로직
case $ACTION in
  "list")
    list_migrations
    ;;
  "show")
    show_file "$2"
    ;;
  "check")
    check_syntax
    ;;
  "order")
    show_order
    ;;
  *)
    show_help
    ;;
esac
