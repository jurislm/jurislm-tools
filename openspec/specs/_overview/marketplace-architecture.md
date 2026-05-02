# Marketplace Architecture Overview

## Purpose

定義 `jurislm-tools` Plugin Marketplace 的整體結構、plugin 組成方式，以及 Marketplace 在 Claude Code 生態系中的角色與邊界。

## System Context

`jurislm-tools` 是一個掛載於 Claude Code 的 Plugin Marketplace（`source: "directory"`），本地目錄直接掛載，不需透過 npm 或 GitHub remote 安裝。使用者在 Claude Code 中執行 `/plugin install jurislm-tools@<plugin-name>` 即可安裝個別 plugin。

```
.claude-plugin/marketplace.json   ← Marketplace 定義檔（入口）
plugins/
├── <plugin-name>/
│   ├── .claude-plugin/plugin.json   ← Plugin 元資料（name, version, description）
│   ├── skills/<name>/SKILL.md       ← Skill（自動觸發或手動呼叫）
│   ├── commands/<name>.md           ← Slash command（/name）
│   ├── agents/<name>.md             ← Agent 定義（subagent_type）
│   ├── hooks/                       ← PreToolUse / PostToolUse / Stop hooks
│   ├── rules/                       ← 規則文件（語言分層）
│   └── .mcp.json                    ← MCP Server 設定（Hybrid plugin 專用）
```

## Plugin 列表（12 個）

| Plugin | 類型 | 版本 | 主要產物 |
|--------|------|------|---------|
| hooks-and-rules | Base | 1.19.0 | hook（commit-discipline-gate.js）+ rules（5 語言） |
| coolify | Hybrid | 1.19.0 | MCP（@jurislm/coolify-mcp）+ skill + command |
| hetzner | Hybrid | 1.19.0 | MCP（@jurislm/hetzner-mcp）+ skill + command |
| langfuse | Hybrid | 1.19.0 | MCP（@jurislm/langfuse-mcp）+ skill + command |
| repo-standards | Skill | 1.19.0 | skill + command |
| pr-review | Skill | 1.19.0 | skill + command |
| podcast-to-blog | Skill | 1.19.0 | skill + command + Python scripts |
| codebase-sync | Skill | 1.19.0 | skill + command |
| plan | Cmd+Agent | 1.19.0 | command + planner agent |
| tdd | Cmd+Agent | 1.19.0 | command（shim） + tdd-guide agent |
| tdd-workflow | Skill | 1.19.0 | skill（auto-activate） |
| learn-eval | Command | 1.19.0 | command only |

## Plugin 類型定義

- **Base**：不含 skill/command，提供 hook 與 rules 基礎設施
- **Hybrid**：同時包含 MCP Server 設定（`.mcp.json`）與 skill/command
- **Skill**：僅含 SKILL.md（有或無對應 command），無 MCP
- **Cmd+Agent**：command 作為入口，執行時委派給對應 agent
- **Command**：純 command，無 skill 亦無 agent

## Versioning

所有 plugin 的版本號由 **Release Please** 自動管理，不得手動修改。

- `feat:` → minor bump（1.18.x → 1.19.0）
- `fix:` → patch bump（1.19.0 → 1.19.1）
- `docs:` / `chore:` → 不觸發版本升級

`release-please-config.json` 的 `extra-files` 設定同步更新：
- `plugins/jurislm-tools/.claude-plugin/plugin.json` → `$.version`
- `.claude-plugin/marketplace.json` → `$.plugins[0].version`

**重要**：`marketplace.json` 的版本更新使用陣列索引 `$.plugins[0].version`，因此 `jurislm-tools` 必須永遠是 `plugins` 陣列第一個元素。

## 本地掛載更新流程

```
.worktrees/develop 修改
  → commit + push（develop 分支）
  → PR develop → main
  → merge
  → git pull origin main（在 main worktree 根目錄）
  → /reload-plugins（在 Claude Code 中）
```

## 環境變數約定

Hybrid plugin 的 MCP Server 需要環境變數，一律寫入 `~/.zshenv`（非 `~/.zshrc`）：

| Plugin | 必要環境變數 |
|--------|------------|
| coolify | `COOLIFY_ACCESS_TOKEN`, `COOLIFY_BASE_URL` |
| hetzner | `HETZNER_API_TOKEN` |
| langfuse | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` |

## Detail Specs

- [infra/infra-overview.md](../infra/infra-overview.md) — Coolify + Hetzner
- [observability/langfuse-detail.md](../observability/langfuse-detail.md) — Langfuse
- [dev-workflow/dev-workflow-overview.md](../dev-workflow/dev-workflow-overview.md) — plan + tdd + tdd-workflow + pr-review
- [docs-and-standards/repo-standards-detail.md](../docs-and-standards/repo-standards-detail.md) — repo-standards
- [docs-and-standards/codebase-sync-detail.md](../docs-and-standards/codebase-sync-detail.md) — codebase-sync
- [content/podcast-to-blog-detail.md](../content/podcast-to-blog-detail.md) — podcast-to-blog
- [learning/learn-eval-detail.md](../learning/learn-eval-detail.md) — learn-eval
- [discipline/hooks-and-rules-detail.md](../discipline/hooks-and-rules-detail.md) — hooks-and-rules
- [_overview/openspec-system.md](./openspec-system.md) — OpenSpec workflow system
