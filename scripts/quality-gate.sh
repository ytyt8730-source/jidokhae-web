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

# 6. z-index 하드코딩 검사
echo "6️⃣ z-index 하드코딩 검사..."
ZINDEX_COUNT=$(grep -rn "z-40\|z-50" jidokhae/src/components --include="*.tsx" 2>/dev/null | grep -v "// z-legacy" | wc -l | tr -d ' ')
if [ "$ZINDEX_COUNT" -gt 0 ]; then
    echo "   ⚠️ z-index 하드코딩 $ZINDEX_COUNT개 발견 (z-40/z-50 → 디자인 토큰 사용)"
    grep -rn "z-40\|z-50" jidokhae/src/components --include="*.tsx" 2>/dev/null | grep -v "// z-legacy" | head -5 | sed 's/^/      /'
    ((WARNINGS++))
else
    echo "   ✅ 통과"
fi

# 7. bg-white 하드코딩 검사
# 예외: ticket 컴포넌트(물리 티켓 메타포), bg-white-allowed 마커, bg-white/[opacity] 변형
echo "7️⃣ bg-white 하드코딩 검사..."
BG_WHITE_COUNT=$(grep -rn "bg-white" jidokhae/src/components --include="*.tsx" 2>/dev/null | grep -v "ticket/Ticket\.tsx\|TicketStub\|TicketPerforation\|TicketPrinting\|bg-white-allowed\|bg-white/" | wc -l | tr -d ' ')
if [ "$BG_WHITE_COUNT" -gt 0 ]; then
    echo "   ⚠️ bg-white 하드코딩 $BG_WHITE_COUNT개 발견 (→ bg-bg-surface 사용)"
    grep -rn "bg-white" jidokhae/src/components --include="*.tsx" 2>/dev/null | grep -v "ticket/Ticket\.tsx\|TicketStub\|TicketPerforation\|TicketPrinting\|bg-white-allowed\|bg-white/" | head -5 | sed 's/^/      /'
    ((WARNINGS++))
else
    echo "   ✅ 통과"
fi

# 8. 미등록 Tailwind 클래스 검사 (safe-area)
# globals.css에 등록된 클래스: safe-area-inset-top, safe-area-inset-bottom, pb-safe-area-inset-bottom
echo "8️⃣ 미등록 Tailwind 유틸리티 검사..."
UNREGISTERED_COUNT=$(grep -rn "pb-safe-area-\|pt-safe-area-\|mb-safe-area-" jidokhae/src --include="*.tsx" 2>/dev/null | grep -v "pb-safe-area-inset-bottom\|safe-area-inset-top\|safe-area-inset-bottom" | wc -l | tr -d ' ')
if [ "$UNREGISTERED_COUNT" -gt 0 ]; then
    echo "   ❌ 미등록 safe-area 유틸리티 $UNREGISTERED_COUNT개 발견 (globals.css 정의 필요)"
    grep -rn "pb-safe-area-\|pt-safe-area-\|mb-safe-area-" jidokhae/src --include="*.tsx" 2>/dev/null | grep -v "pb-safe-area-inset-bottom\|safe-area-inset-top\|safe-area-inset-bottom" | head -5 | sed 's/^/      /'
    ((ERRORS++))
    PASS=false
else
    echo "   ✅ 통과"
fi

# 9. console.error/warn 검사 (기존은 console.log만)
echo "9️⃣ console.error/warn 검사..."
CONSOLE_EW_COUNT=$(grep -rn "console\.\(error\|warn\)" jidokhae/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// console-allowed" | wc -l | tr -d ' ')
if [ "$CONSOLE_EW_COUNT" -gt 0 ]; then
    echo "   ⚠️ console.error/warn $CONSOLE_EW_COUNT개 발견 (→ @/lib/logger 사용)"
    grep -rn "console\.\(error\|warn\)" jidokhae/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// console-allowed" | head -5 | sed 's/^/      /'
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
