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
plugins/
├── hooks-and-rules/                  # 開發紀律 plugin（hooks + rules）
│   ├── .claude-plugin/plugin.json
│   ├── hooks/
│   │   ├── commit-discipline-gate.js
│   │   └── hooks.json
│   └── rules/
│       ├── common/
│       ├── typescript/
│       ├── python/
│       ├── rust/
│       └── dart/
├── coolify/                          # Coolify MCP + skill + command
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── commands/coolify.md
│   └── skills/coolify/SKILL.md
├── hetzner/                          # Hetzner MCP + skill + command
├── langfuse/                         # Langfuse MCP + skill + command
├── repo-standards/                   # skill + command
├── pr-review/                        # skill + command
├── podcast-to-blog/                  # skill + command
└── codebase-sync/                    # skill + command
```

## 目前 Plugins

| Plugin | 版本 | 類型 | 說明 |
|--------|------|------|------|
| hooks-and-rules | 1.19.0 | Base | commit 思考紀律 hook + 通用開發規則 |
| coolify | 1.19.0 | Hybrid | Coolify MCP（43 工具）+ skill + command |
| hetzner | 1.19.0 | Hybrid | Hetzner MCP（17 工具）+ skill + command |
| langfuse | 1.19.0 | Hybrid | Langfuse MCP（50 工具）+ skill + command |
| repo-standards | 1.19.0 | Skill | Repo 標準審查 skill + command |
| pr-review | 1.19.0 | Skill | PR 審查 skill + command |
| podcast-to-blog | 1.19.0 | Skill | Podcast 轉文章 skill + command |
| codebase-sync | 1.19.0 | Skill | Codebase 同步 skill + command |
| plan | 1.19.0 | Cmd+Agent | /plan command + planner agent |
| tdd | 1.19.0 | Cmd+Agent | /tdd command + tdd-guide agent |
| tdd-workflow | 1.19.0 | Skill | tdd-workflow skill — auto-activate |
| learn-eval | 1.19.0 | Command | /learn-eval command — 含品質閘 + Global/Project 判斷 |

## 版本管理

**禁止手動修改版本號** — Release Please 自動處理（`feat:` → minor，`fix:` → patch）。

`release-please-config.json` 的 `extra-files` 設定會自動同步：
- `plugins/jurislm-tools/.claude-plugin/plugin.json` → `$.version`
- `.claude-plugin/marketplace.json` → `$.plugins[0].version`

**重要**：`marketplace.json` 的版本更新使用 `$.plugins[0].version`（依陣列索引）。release-please 不支援 filter jsonpath（`?(@.name==...)`），因此 **`jurislm-tools` 必須永遠是 `plugins` 陣列的第一個元素**，否則會更新到錯誤的版本。

**Plugin / 純文字 repo 的 commit type 規則**：
- 新增 skill、更新 skill 內容（新規則、新範例）→ `feat:`
- 修正錯誤資訊 → `fix:`
- 純格式整理 → `docs:` 或 `chore:`（不觸發版本升級）

## 環境變數

MCP Server 需要的環境變數，在 `~/.zshenv` 設定（非 `~/.zshrc`）：

- **coolify**：`COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL`
- **hetzner**：`HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`）
- **langfuse**：`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_HOST`（JurisLM 使用 `https://us.cloud.langfuse.com`）

## 安裝與更新流程

### 首次安裝（本地目錄掛載）

```bash
/plugin marketplace add /Users/terrychen/Documents/Github/jurislm/jurislm-tools
/plugin install jurislm-tools@hooks-and-rules  # 開發紀律（hooks + rules）
/plugin install jurislm-tools@coolify
/plugin install jurislm-tools@hetzner
/plugin install jurislm-tools@langfuse
/plugin install jurislm-tools@repo-standards
/plugin install jurislm-tools@pr-review
/plugin install jurislm-tools@podcast-to-blog
/plugin install jurislm-tools@codebase-sync
/plugin install jurislm-tools@plan
/plugin install jurislm-tools@tdd
/plugin install jurislm-tools@tdd-workflow
/plugin install jurislm-tools@learn-eval
/reload-plugins
```

### 本地更新（已掛載本地目錄）

Marketplace 直接掛載 main worktree（`source: "directory"`），流程：

```
.worktrees/develop 修改 → commit + push → PR develop→main → merge
→ git pull origin main（在 main worktree 根目錄執行）→ /reload-plugins
```

`git pull` 是必要步驟：plugin 從 main worktree 本地目錄讀取，merge 只更新遠端，本地 main worktree 仍需 pull 才會同步。不需要 `/plugin marketplace update` 或重新安裝。

### 確認掛載來源

```bash
cat ~/.claude/plugins/known_marketplaces.json | jq '.["jurislm-tools"].source'
# "directory" = 本地掛載，"github" = 遠端
```

## Git 分支規範

```
develop → PR → main
```

- 日常開發一律在 `.worktrees/develop` 目錄，不在 main worktree 做 feature commits
- **嚴禁直接 push 到 main**
- 版本號由 Release Please 自動管理，**禁止手動修改版本號**

## 注意事項

- **版本號禁止手動修改**：交由 Release Please 管理
- **`jurislm-tools` 必須是 `marketplace.json` plugins 陣列第一個元素**
- **環境變數必須在 `~/.zshenv`**：MCP Server 是非互動式子進程，不 source `~/.zshrc`
- **description 語言**：使用繁體中文
- **工具數需手動同步**：plugin 表格的工具數跨 repo 引用，修改任一 MCP repo 後需更新本檔案
  - Coolify：`grep -c "server.tool" ../coolify-mcp/src/lib/mcp-server.ts`
  - Hetzner：`grep -c '"hetzner_' ../hetzner-mcp/src/tools/*.ts`
  - Langfuse：`grep -c "server.tool" ../langfuse-mcp/src/index.ts`
