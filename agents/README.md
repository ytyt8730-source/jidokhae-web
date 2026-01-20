# ⚠️ 이 폴더는 더 이상 사용되지 않습니다

## 마이그레이션 완료

에이전트 시스템이 **Claude Code 서브에이전트 표준 형식**으로 마이그레이션되었습니다.

---

## 📍 새 위치

```
/.claude/agents/
```

---

## 🔄 변경 사항

| 항목 | 이전 | 현재 |
|------|------|------|
| 위치 | `/agents/` | `/.claude/agents/` |
| 호출 방식 | `@설계 불러서...` | `@agent-설계 ...` |
| 파일 형식 | 일반 Markdown | YAML Frontmatter + Markdown |

---

## 📖 사용법

```
@agent-설계 M5 WP 분해해줘
@agent-코딩 Phase 1 구현해줘
@agent-테스트 Phase 1 검증해줘
@agent-검사 전체 검사해줘
@agent-Git 커밋해줘
```

자세한 내용은 `/.claude/agents/README.md`를 참고하세요.

---

## 🗑️ 이 폴더 삭제 안내

이 폴더(`/agents/`)는 참조용으로 보관되어 있습니다.
새 시스템이 정상 작동하면 삭제해도 됩니다.

```powershell
# 삭제 명령 (선택)
rmdir /s /q agents
```

---

**마이그레이션 일자**: 2026-01-20
