# Hooks and Rules Plugin Detail

## Purpose

描述 `hooks-and-rules` plugin 的設計內容，透過 PreToolUse hook 在 git commit 前強制走過思考紀律問題，並提供 5 種語言的通用開發規則。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `commit-discipline-gate.js` | `plugins/hooks-and-rules/hooks/commit-discipline-gate.js` | PreToolUse hook（99 行） |
| `hooks.json` | `plugins/hooks-and-rules/hooks/hooks.json` | hook 設定檔 |
| rules（5 語言）| `plugins/hooks-and-rules/rules/` | 27 個規則檔案 |

## Hook：commit-discipline-gate

**觸發條件**：`PreToolUse` hook，matcher `Bash`，偵測 command 含 `\bgit\s+commit\b` 且不含 `--dry-run`。

**行為**：
1. 第一次執行 → `decision: block`，回傳 3 個強制思考問題
2. 30 秒內 retry → 自動放行（state file：`~/.claude/hook-state/commit-discipline.last`）

**3 個思考問題**：

| 問題 | 目的 |
|------|------|
| Commit 內容是「符號層級替換」還是「設計層級判斷」？ | 防止反射性 sed 替換（只改字串，沒有設計判斷） |
| 內容是否經過 5 維度盤點？（歷史決策 / SSOT / 相關提案 / 提案邊界 / 內部一致性） | 防止未盤點就 commit |
| Commit 後回報是否會偷渡選項？ | 防止 commit 後列出未經情境檢查的「等你指示 / 接下來...」選項 |

**state file 機制**：
- block 時寫入 UNIX ms timestamp 到 `~/.claude/hook-state/commit-discipline.last`
- retry 時若距上次 block < 30000ms，刪除 state file，`process.exit(0)`（放行）

## Rules 系統（27 個規則檔案）

### 語言分層結構

```
rules/
├── common/    ← 語言無關通用原則（8 個檔案）
├── typescript/← TypeScript/JavaScript 特有（5 個檔案）
├── python/    ← Python 特有（5 個檔案）
├── rust/      ← Rust 特有（5 個檔案）
└── dart/      ← Dart 特有（5 個檔案，Flutter 適用）
```

### 規則類別（每個語言目錄包含）

| 檔案 | 內容 |
|------|------|
| coding-style.md | immutability / KISS / DRY / YAGNI / 命名規範 |
| testing.md | TDD / 80% coverage / 測試類型 |
| patterns.md | Repository Pattern / API Response Format |
| hooks.md | PostToolUse auto-format / Stop hooks |
| security.md | 禁止 hardcode secrets / 輸入驗證 |

### 優先順序規則

語言特定規則 > common 規則（specific overrides general）。

### 安裝方式

plugin 安裝後自動將 rules 複製到 `~/.claude/rules/`（依 Claude Code plugin 系統的安裝機制）。

## 設計意圖

`hooks-and-rules` 是**橫切所有其他 plugin 的基礎設施**：不負責任何具體功能，而是在開發流程中提供：
1. 自動觸發的思考紀律（hook）
2. 持續載入的開發規範（rules）

每個使用 JurisLM plugins 的開發者都應安裝此 plugin（建議第一個安裝）。
