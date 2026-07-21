# Marketplace Architecture Overview

## Purpose

定義 `jurislm-tools` 的 marketplace 結構、跨 runtime 邊界、版本管理與交付流程。

## System context

`.claude-plugin/marketplace.json` 是唯一 canonical marketplace。Claude Code 原生讀取此格式；Codex 透過已驗證的 Claude-marketplace compatibility path 發現同一份 entries，不維護第二套 `.codex-plugin` 或 `.agents` metadata。

```text
.claude-plugin/marketplace.json
plugins/<plugin-name>/
├── .claude-plugin/plugin.json
├── .mcp.json                       # Hybrid plugin only
├── skills/<name>/SKILL.md
├── commands/<name>.md              # Optional compatibility entry
└── README.md
```

Marketplace entry name、source folder basename 與 manifest name 必須一致。

## Published plugins

| Plugin | Type | Primary artifact |
|---|---|---|
| `coolify` | Hybrid | Exact-version MCP launcher + Skill |
| `hetzner` | Hybrid | Exact-version MCP launcher + Skill |
| `langfuse` | Hybrid | Exact-version MCP launcher + Skill |
| `higgsfield` | Hybrid | OAuth remote MCP + Skills |
| `repo-standards` | Skill | Repository standards |
| `podcast-to-blog` | Skill | Transcription and writing workflow |
| `codebase-sync` | Skill | Documentation synchronization |
| `learn-eval` | Skill | Session-pattern extraction |
| `jt-flow` | Skills | Single-request and issue-queue delivery |

## Dependency integrity

Local MCP launchers that receive credentials must pin exact semantic versions. Current approved packages are:

- `@jurislm/coolify-mcp@3.6.0`
- `@jurislm/hetzner-mcp@1.5.0`
- `@jurislm/langfuse-mcp@1.3.2`

Mutable tags, unversioned packages, and ranges are rejected by repository validation.

## Versioning

Release Please owns all nine plugin manifest versions and `.claude-plugin/marketplace.json` at `$.plugins[0].version`. `coolify` must remain entry zero unless the release configuration changes in the same proposal. New entries append by default.

## Delivery

```text
origin/main → feature worktree → PR to main → quality and review gates → merge
```

The root checkout remains on `main`; implementation occurs in `.claude/worktrees/<change-name>` based on current `origin/main`. The historical `develop` branch is not a delivery stage.

## Installation

Claude identifiers use `plugin@marketplace`:

```bash
claude plugin marketplace add https://github.com/jurislm/jurislm-tools.git
claude plugin install coolify@jurislm-tools
```

After install or update, start a new Claude Code or Codex session.

## Validation

```bash
npm ci
npm run validate
claude plugin validate .
```

The aggregate command checks tests, marketplace integrity, immutable dependencies, release-version synchronization, and entry-document Markdown.

## Detail specs

- [Infrastructure overview](../infra/infra-overview.md)
- [Langfuse detail](../observability/langfuse-detail.md)
- [Repository standards detail](../docs-and-standards/repo-standards-detail.md)
- [Codebase sync detail](../docs-and-standards/codebase-sync-detail.md)
- [Podcast-to-blog detail](../content/podcast-to-blog-detail.md)
- [Learn-eval detail](../learning/learn-eval-detail.md)
- [OpenSpec system](./openspec-system.md)
