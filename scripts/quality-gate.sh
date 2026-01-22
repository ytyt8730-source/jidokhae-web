#!/bin/bash
# Phase 완료 전 품질 검사 (S급 핵심!)
# 환경: Windows Git Bash 호환

echo "🔍 품질 게이트 검사 시작..."
echo ""

PASS=true
WARNINGS=0
ERRORS=0

# 1. 200줄 초과 파일 체크
echo "1️⃣ 파일 크기 검사 (200줄 제한)..."
LARGE_FILES=$(find jidokhae/src -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 && !/total/ {print "   ❌ " $2 " (" $1 "줄)"}')
if [ -n "$LARGE_FILES" ]; then
    echo "$LARGE_FILES"
    ((ERRORS++))
    PASS=false
else
    echo "   ✅ 통과"
fi

# 2. console.log 체크
echo "2️⃣ console.log 검사..."
CONSOLE_COUNT=$(grep -r "console\.log" jidokhae/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo "   ❌ console.log $CONSOLE_COUNT개 발견"
    grep -r "console\.log" jidokhae/src --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5 | sed 's/^/      /'
    ((ERRORS++))
    PASS=false
else
    echo "   ✅ 통과"
fi

# 3. as any 체크
echo "3️⃣ 'as any' 타입 검사..."
ANY_COUNT=$(grep -r "as any" jidokhae/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ANY_COUNT" -gt 0 ]; then
    echo "   ❌ 'as any' $ANY_COUNT개 발견"
    grep -r "as any" jidokhae/src --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5 | sed 's/^/      /'
    ((ERRORS++))
    PASS=false
else
    echo "   ✅ 통과"
fi

# 4. TODO 미구현 체크
echo "4️⃣ 미구현 TODO 검사..."
TODO_COUNT=$(grep -r "// TODO: Implement\|// TODO: Phase" jidokhae/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "   ⚠️ 미구현 TODO $TODO_COUNT개 발견"
    grep -r "// TODO: Implement\|// TODO: Phase" jidokhae/src --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5 | sed 's/^/      /'
    ((WARNINGS++))
else
    echo "   ✅ 통과"
fi

# 5. 접근성 검사 (aria-label, alt)
echo "5️⃣ 접근성 검사..."
# button without aria-label (간단한 휴리스틱)
BUTTON_NO_ARIA=$(grep -r "<button" jidokhae/src --include="*.tsx" 2>/dev/null | grep -v "aria-label" | wc -l | tr -d ' ')
IMG_NO_ALT=$(grep -r "<img\|<Image" jidokhae/src --include="*.tsx" 2>/dev/null | grep -v "alt=" | wc -l | tr -d ' ')
if [ "$BUTTON_NO_ARIA" -gt 0 ] || [ "$IMG_NO_ALT" -gt 0 ]; then
    echo "   ⚠️ 접근성 속성 누락 가능성"
    [ "$BUTTON_NO_ARIA" -gt 0 ] && echo "      button without aria-label: $BUTTON_NO_ARIA개"
    [ "$IMG_NO_ALT" -gt 0 ] && echo "      img without alt: $IMG_NO_ALT개"
    ((WARNINGS++))
else
    echo "   ✅ 통과"
fi

# 결과 출력
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 품질 게이트 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ❌ 에러: $ERRORS개"
echo "   ⚠️ 경고: $WARNINGS개"
echo ""

if [ "$PASS" = true ]; then
    echo "✅ 품질 게이트 통과!"
    exit 0
else
    echo "❌ 품질 게이트 실패 - 위 항목 수정 필요"
    exit 1
fi
