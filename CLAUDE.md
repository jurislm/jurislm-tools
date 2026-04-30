# CLAUDE.md

此文件為 Claude Code（claude.ai/code）在此 repository 工作時提供指引。

## 常用命令

```bash
# 驗證 JSON 格式
cat .claude-plugin/marketplace.json | jq .
cat plugins/jurislm-tools/.claude-plugin/plugin.json | jq .

# 檢查版本是否同步
grep '"version"' .claude-plugin/marketplace.json
grep '"version"' plugins/jurislm-tools/.claude-plugin/plugin.json
```

## Repository 概覽

此為 Claude Code Plugin Marketplace（`jurislm-tools`），GitHub repo：`jurislm/jurislm-tools`。

## 結構

```
.claude-plugin/marketplace.json       # Marketplace 定義（名稱、擁有者、plugin 列表）
plugins/jurislm-tools/
├── .claude-plugin/plugin.json        # Plugin 元資料
├── .mcp.json                         # MCP Server 配置
├── commands/
│   ├── coolify.md
│   ├── hetzner.md
│   ├── langfuse.md
│   ├── podcast-to-blog.md
│   ├── pr-review.md
│   ├── repo-standards.md
│   └── codebase-sync.md
└── skills/
    ├── codebase-sync/SKILL.md
    ├── coolify/SKILL.md
    ├── hetzner/SKILL.md
    ├── langfuse/SKILL.md
    ├── podcast-to-blog/SKILL.md
    ├── pr-review/SKILL.md
    └── repo-standards/SKILL.md
```

## 目前 Plugins

| Plugin | 版本 | 類型 | 說明 |
|--------|------|------|------|
| jt | 1.17.1 | Hybrid | Coolify MCP（43 工具）+ Hetzner MCP（17 工具）+ Langfuse MCP（50 工具）+ 7 skills + 7 commands |

## 版本管理

**禁止手動修改版本號** — Release Please 自動處理（`feat:` → minor，`fix:` → patch）。

`release-please-config.json` 的 `extra-files` 設定會自動同步：
- `plugins/jurislm-tools/.claude-plugin/plugin.json` → `$.version`
- `.claude-plugin/marketplace.json` → `$.plugins[0].version`

⚠️ **重要**：`marketplace.json` 的版本更新使用 `$.plugins[0].version`（依陣列索引）。release-please 不支援 filter jsonpath（`?(@.name==...)`），因此 **`jurislm-tools` 必須永遠是 `plugins` 陣列的第一個元素**，否則會更新到錯誤的版本。

## 環境變數

MCP Server 需要的環境變數，在 `~/.zshenv` 設定（非 `~/.zshrc`）：

- **coolify**：`COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL`
- **hetzner**：`HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`）
- **langfuse**：`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_HOST`（JurisLM 使用 `https://us.cloud.langfuse.com`）

## 安裝流程

1. `git push` 到 marketplace repo（`main` 分支）
2. `/plugin marketplace add https://github.com/jurislm/jurislm-tools.git` — 首次使用需註冊 marketplace
3. `/plugin marketplace update jurislm-tools` — 更新 marketplace 索引
4. `/plugin install jurislm-tools@jt` — 安裝 plugin
5. 重啟 Claude Code — skills 才會載入

步驟 2 只需首次執行；之後更新只需步驟 3-5。跳過步驟 3 會導致 `Plugin not found`。

## Git 分支規範

```
develop → PR → main
```

- 日常開發一律在 `.worktrees/develop` 目錄，不在 main worktree 做 feature commits
- **嚴禁直接 push 到 main**
- 版本號由 Release Please 自動管理，**禁止手動修改版本號**（見下方版本管理）

## 注意事項

- **版本號禁止手動修改**：交由 Release Please 管理
- **`jurislm-tools` 必須是 `marketplace.json` plugins 陣列第一個元素**
- **環境變數必須在 `~/.zshenv`**：MCP Server 是非互動式子進程，不 source `~/.zshrc`
- **description 語言**：使用繁體中文
- **工具數需手動同步**：plugin 表格的工具數跨 repo 引用，修改任一 MCP repo 後需更新本檔案
  - Coolify：`grep -c "server.tool" ../coolify-mcp/src/lib/mcp-server.ts`
  - Hetzner：`grep -c '"hetzner_' ../hetzner-mcp/src/tools/*.ts`
  - Langfuse：`grep -c "server.tool" ../langfuse-mcp/src/index.ts`
