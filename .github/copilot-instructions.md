請使用繁體中文回覆所有問題與建議。

# Copilot Instructions for jurislm-tools

## Project Overview

`jurislm-tools` 是 Claude Code Plugin Marketplace，提供 `jt` plugin（Hybrid 類型）：整合 Coolify MCP（43 工具）、Hetzner MCP（17 工具）、Langfuse MCP（50 工具）、7 個 skills 和 7 個 commands。

## Git Workflow

- **Development branch**: `develop` — all feature work happens here
- **Release branch**: `main` — receives changes via **squash merge** from `develop`
- **Versioning**: Managed by Release Please. Do NOT suggest manual version bumps.

## Repository Structure

```
.claude-plugin/marketplace.json            # Marketplace 定義
plugins/jurislm-tools/
├── .claude-plugin/plugin.json             # Plugin 元資料（version 由 Release Please 管理）
├── .mcp.json                              # MCP Server 配置
└── skills/
    ├── codebase-sync/SKILL.md
    ├── coolify/SKILL.md
    ├── hetzner/SKILL.md
    ├── langfuse/SKILL.md
    ├── podcast-to-blog/SKILL.md
    ├── pr-review/SKILL.md
    └── repo-standards/SKILL.md
```

## Version Management（關鍵）

**禁止手動修改版本號**。`release-please-config.json` 的 `extra-files` 自動同步兩個檔案：
- `plugins/jurislm-tools/.claude-plugin/plugin.json` → `$.version`
- `.claude-plugin/marketplace.json` → `$.plugins[0].version`

**`jurislm-tools` 必須永遠是 `marketplace.json` 的 `plugins` 陣列第一個元素**——release-please 使用 `$.plugins[0].version` 索引更新，若順序改變會更新到錯誤的 plugin 版本。

## SKILL.md 格式規則

所有 skills 定義在 `skills/*/SKILL.md`：
- `description` 欄位必須使用**繁體中文**
- Trigger 條件需清晰具體（何時觸發、用什麼工具）
- 無程式碼，純 Markdown 定義

## Plugin Auto-Discovery

Skills 和 commands 目錄下的檔案會被 Claude Code 自動發現，**不需要**在 `plugin.json` 中宣告每個 skill/command。`plugin.json` 只管理 plugin 元資料和 MCP server 設定。

## Environment Variables

MCP Server 需要的環境變數必須在 `~/.zshenv`（非 `~/.zshrc`）——MCP 為非互動式子進程，不 source `~/.zshrc`：
- `COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL`
- `HETZNER_API_TOKEN`
- `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_HOST`

## Code Review 重點

- **版本號**：任何 PR 中的手動版本號修改都需標記（Release Please 管理）
- **`plugins` 陣列順序**：`marketplace.json` 中 `jurislm-tools` 必須維持第一個位置
- **SKILL.md description**：確認使用繁體中文
- **Trigger 條件**：新 skill 的 trigger 需清晰定義，避免過度廣泛（會影響 Claude 的判斷準確度）
- **MCP server 修改**：`.mcp.json` 改動需確認環境變數名稱與 `~/.zshenv` 設定一致
- **Plugin 發布流程**：push 到 `main` 後需執行 `/plugin marketplace update jurislm-tools` 才能讓用戶看到更新

## 忽略範圍

- 不審查 `.worktrees/` 目錄
- 不對 Release Please 自動生成的 `CHANGELOG.md` 條目提出格式建議
