# Codebase Sync Plugin Detail

## Purpose

描述 `codebase-sync` plugin 的設計內容，探索 codebase 現況並更新 README.md 與 CLAUDE.md，移除過時內容。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `codebase-sync` skill | `plugins/codebase-sync/skills/codebase-sync/SKILL.md` | 自動偵測、文件審計、最小差異更新與驗證 |
| `/codebase-sync` command | `plugins/codebase-sync/commands/codebase-sync.md` | 入口 command（無需參數） |
| templates reference | `plugins/codebase-sync/skills/codebase-sync/references/templates.md` | README/CLAUDE.md 章節模板 |

## 觸發條件

使用者說「更新 README」、「更新 CLAUDE.md」、「同步文件」、「移除過時內容」或文件明顯落後於實際程式碼時啟動。

## 執行流程

### Step 0：自動化偵測

先記錄 repository 結構、`package.json`、plugin manifests、README/CLAUDE.md 中的 scripts 與路徑差異、版本現況、近期 Git history，以及新增／刪除檔案。若存在 `.env.example`，也比對文件與範例中的環境變數。

### Step 1：深度讀取 codebase 現況

讀取現有 README.md、CLAUDE.md、marketplace/plugin manifests、package metadata，以及需要核對的子目錄文件。

### Step 2：輸出完整 Audit Report

根據偵測與讀取結果，必須輸出完整報告，涵蓋目錄、scripts、已刪除引用、未記載的新增項目、描述準確性、plugin/skill 清單、版本、Git 變動與環境變數比對。每個待修項目都要有可重複的 evidence。

### Step 3：識別過時內容

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

### Step 4：更新文件

對 README.md 與 CLAUDE.md 進行最小差異更新（不重寫整份文件）：
- 移除已不存在的功能描述
- 更新版本號、目錄結構、scripts 清單
- 補充新增但未記錄的功能

**不修改**：設計原則、架構決策說明、使用者手動維護的段落（如 gotchas 或歷史紀錄）。

### Step 5：驗證與回報

重新確認新增的路徑與指令存在、JSON 可解析，並依 repository 的可用驗證命令執行檢查；最後列出所有修改與對應 finding。

## 與其他 plugin 的關係

- 通常在 `repo-standards` 設定完成後執行
- 適用場景：任何 repo 的文件維護，不限於 JurisLM 系列
