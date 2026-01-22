#!/bin/bash
# ===========================================
# Git 브랜치 정리 스크립트
# 사용: ./scripts/clean-branches.sh [action]
# ===========================================

ACTION=$1

show_help() {
  echo "🌿 Git 브랜치 정리"
  echo ""
  echo "사용법: ./scripts/clean-branches.sh [action]"
  echo ""
  echo "명령어:"
  echo "  list     - 모든 브랜치 목록"
  echo "  merged   - 머지된 브랜치 목록"
  echo "  stale    - 오래된 브랜치 목록 (30일 이상)"
  echo "  clean    - 머지된 로컬 브랜치 삭제 (확인 후)"
  echo "  prune    - 삭제된 원격 브랜치 참조 정리"
  echo ""
  echo "예시:"
  echo "  ./scripts/clean-branches.sh list"
  echo "  ./scripts/clean-branches.sh merged"
  echo "  ./scripts/clean-branches.sh clean"
}

list_branches() {
  echo "🌿 모든 브랜치"
  echo "=============="
  echo ""

  echo "📍 로컬 브랜치:"
  git branch | sed 's/^/  /'
  echo ""

  echo "🌐 원격 브랜치:"
  git branch -r | sed 's/^/  /'
  echo ""

  CURRENT=$(git branch --show-current)
  echo "현재 브랜치: $CURRENT"
}

list_merged() {
  echo "✅ main에 머지된 브랜치"
  echo "======================="
  echo ""

  # main으로 체크아웃 필요 없이 확인
  MERGED=$(git branch --merged main 2>/dev/null | grep -v "main" | grep -v "^\*")

  if [ -z "$MERGED" ]; then
    echo "머지된 브랜치가 없습니다."
  else
    echo "삭제 가능한 브랜치:"
    echo "$MERGED" | sed 's/^/  🗑️ /'
    echo ""
    echo "삭제하려면:"
    echo "  ./scripts/clean-branches.sh clean"
  fi
}

list_stale() {
  echo "⏰ 오래된 브랜치 (30일 이상 커밋 없음)"
  echo "======================================"
  echo ""

  STALE_COUNT=0

  for branch in $(git for-each-ref --sort=committerdate refs/heads/ --format='%(refname:short)'); do
    LAST_COMMIT=$(git log -1 --format="%ci" "$branch" 2>/dev/null | cut -d' ' -f1)
    DAYS_AGO=$(( ($(date +%s) - $(date -d "$LAST_COMMIT" +%s 2>/dev/null || echo 0)) / 86400 ))

    if [ "$DAYS_AGO" -gt 30 ] && [ "$branch" != "main" ]; then
      echo "  ⚠️  $branch (마지막 커밋: ${DAYS_AGO}일 전)"
      STALE_COUNT=$((STALE_COUNT + 1))
    fi
  done

  if [ "$STALE_COUNT" -eq 0 ]; then
    echo "오래된 브랜치가 없습니다."
  else
    echo ""
    echo "총 ${STALE_COUNT}개의 오래된 브랜치"
  fi
}

clean_merged() {
  echo "🗑️ 머지된 브랜치 삭제"
  echo "===================="
  echo ""

  # 현재 브랜치가 main인지 확인
  CURRENT=$(git branch --show-current)
  if [ "$CURRENT" != "main" ]; then
    echo "⚠️  main 브랜치로 먼저 전환합니다..."
    git checkout main
  fi

  # 머지된 브랜치 목록
  MERGED=$(git branch --merged main 2>/dev/null | grep -v "main" | grep -v "^\*" | xargs)

  if [ -z "$MERGED" ]; then
    echo "✅ 삭제할 브랜치가 없습니다."
    exit 0
  fi

  echo "삭제할 브랜치:"
  for branch in $MERGED; do
    echo "  - $branch"
  done
  echo ""

  # 확인
  read -p "정말 삭제하시겠습니까? (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "취소되었습니다."
    exit 0
  fi

  # 삭제 실행
  echo ""
  for branch in $MERGED; do
    git branch -d "$branch"
    if [ $? -eq 0 ]; then
      echo "✅ 삭제: $branch"
    else
      echo "❌ 실패: $branch"
    fi
  done

  echo ""
  echo "✅ 브랜치 정리 완료!"
}

prune_remote() {
  echo "🔄 원격 브랜치 참조 정리"
  echo "======================="
  echo ""

  echo "정리 전 원격 브랜치:"
  git branch -r | wc -l
  echo ""

  git fetch --prune

  echo ""
  echo "정리 후 원격 브랜치:"
  git branch -r | wc -l
  echo ""
  echo "✅ 원격 참조 정리 완료!"
}

# 메인 로직
case $ACTION in
  "list")
    list_branches
    ;;
  "merged")
    list_merged
    ;;
  "stale")
    list_stale
    ;;
  "clean")
    clean_merged
    ;;
  "prune")
    prune_remote
    ;;
  *)
    show_help
    ;;
esac
