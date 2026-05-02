# Codebase Sync Plugin Detail

## Purpose

描述 `codebase-sync` plugin 的設計內容，探索 codebase 現況並更新 README.md 與 CLAUDE.md，移除過時內容。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `codebase-sync` skill | `plugins/codebase-sync/skills/codebase-sync/SKILL.md` | 執行邏輯（191 行） |
| `/codebase-sync` command | `plugins/codebase-sync/commands/codebase-sync.md` | 入口 command（無需參數） |
| templates reference | `plugins/codebase-sync/skills/codebase-sync/references/templates.md` | README/CLAUDE.md 章節模板 |

## 觸發條件

使用者說「更新 README」、「更新 CLAUDE.md」、「同步文件」、「移除過時內容」或文件明顯落後於實際程式碼時啟動。

## 執行流程

### Step 1：探索 codebase 現況

收集以下資訊：
- 整體目錄結構（`find . -maxdepth 3 -type d`，排除 `.git`、`node_modules`、`.next`、`dist`、`.worktrees`）
- `package.json` 的 name / version / scripts / dependencies
- 現有 README.md 與 CLAUDE.md 全文

### Step 2：識別過時內容

| 檢查項目 | README.md | CLAUDE.md |
|---------|-----------|-----------|
| 目錄結構 | ✓ | ✓ |
| 安裝指令 | ✓ | ✓ |
| 可用 scripts | ✓ | ✓ |
| 環境變數清單 | ✓ | ✓ |
| 版本號 | ✓ | — |
| Plugin/Skill 清單 | ✓（若適用） | ✓（若適用） |
| 部署流程 | ✓ | ✓ |
| DB schema / ports | — | ✓ |
| 常用命令 | — | ✓ |

過時訊號：
- 提到已不存在的檔案或目錄
- scripts 名稱與 `package.json` 不符
- 環境變數與 `.env.example` 不符
- 版本號落後於 `package.json` / `plugin.json`
- 描述已移除的功能

### Step 3：更新文件

對 README.md 與 CLAUDE.md 進行最小差異更新（不重寫整份文件）：
- 移除已不存在的功能描述
- 更新版本號、目錄結構、scripts 清單
- 補充新增但未記錄的功能

**不修改**：設計原則、架構決策說明、使用者手動維護的段落（如 gotchas 或歷史紀錄）。

### Step 4：回報變更摘要

列出所有修改，讓使用者確認。

## 與其他 plugin 的關係

- 通常在 `repo-standards` 設定完成後執行
- 適用場景：任何 repo 的文件維護，不限於 JurisLM 系列
