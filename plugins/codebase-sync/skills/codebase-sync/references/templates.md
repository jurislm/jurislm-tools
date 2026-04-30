# README.md / CLAUDE.md Templates

詳細模板參考，依專案類型選用。

## README.md — Next.js / TypeScript Web App

```markdown
# <App Name>

<一句話描述用途>

## Features

- <主要功能 1>
- <主要功能 2>

## Tech Stack

- Next.js 16, React 19, TypeScript
- PostgreSQL with Drizzle ORM
- NextAuth v5

## Setup

\`\`\`bash
bun install
cp .env.example .env.local
bun run db:migrate
bun run dev
\`\`\`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | JWT secret (32+ chars) |

## Scripts

- `bun run dev` — start dev server (port 3000)
- `bun run build` — production build
- `bun run typecheck` — TypeScript check
- `bun run test` — run Vitest

## License

UNLICENSED — internal use only
```

## README.md — MCP Server / CLI Tool

```markdown
# <Tool Name>

MCP server / CLI tool for <purpose>.

## Installation

\`\`\`bash
npm install -g @<scope>/<name>
\`\`\`

## Usage

### As MCP server

\`\`\`json
{
  "mcpServers": {
    "<name>": {
      "command": "npx",
      "args": ["-y", "@<scope>/<name>@latest"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
\`\`\`

### As CLI

\`\`\`bash
<name> <command> [options]
\`\`\`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_KEY` | ✓ | Service API token |

## Available Tools / Commands

| Name | Description |
|------|-------------|
| `tool_a` | ... |
```

## CLAUDE.md — Web App

```markdown
# CLAUDE.md

此文件為 Claude Code 在此 repository 工作時提供指引。

## 常用命令

\`\`\`bash
bun run dev          # dev server
bun run typecheck    # 型別檢查
bun run test         # Vitest
bun run lint         # ESLint
bun run build        # production build
\`\`\`

## Repository 概覽

<這個 repo 是做什麼的、屬於哪個更大系統>

## 結構

\`\`\`
src/
├── app/             # Next.js App Router
├── components/      # React 元件
├── lib/             # 共用函式
└── db/              # Drizzle schema
\`\`\`

## 資料庫

- Production: <connection details>
- 開發：本地 docker-compose
- Migration：`bun run db:migrate`

## 部署

<部署目標、流程>

## 注意事項

- <專案專屬陷阱>
```

## CLAUDE.md — Plugin / Marketplace

```markdown
# CLAUDE.md

## 常用命令

\`\`\`bash
cat .claude-plugin/marketplace.json | jq .
grep '"version"' .claude-plugin/marketplace.json
\`\`\`

## 結構

\`\`\`
.claude-plugin/marketplace.json
plugins/<name>/
├── .claude-plugin/plugin.json
└── ...
\`\`\`

## 目前 Plugins

| Plugin | 版本 | 說明 |
|--------|------|------|
| ... | ... | ... |

## 版本管理

**禁止手動修改版本號** — Release Please 管理。

## Git 分支規範

\`\`\`
develop → PR → main
\`\`\`
```

## 偵測過時內容的具體規則

| 過時訊號 | 偵測命令 |
|---------|---------|
| README 提到 `npm test` 但 package.json 用 `bun run test` | `grep -q "npm test" README.md && grep -q '"test":' package.json` |
| 環境變數清單缺項 | `diff <(grep -oE '`[A-Z_]+`' README.md) <(cut -d= -f1 .env.example)` |
| 版本號不一致 | `grep -E '\d+\.\d+\.\d+' README.md` vs `jq -r .version package.json` |
| 提到已刪除目錄 | `grep -oE '`[a-z/-]+/`' CLAUDE.md` 後 `ls $each` 驗證 |
| Scripts 列表過時 | `comm -23 <(grep -oE 'bun run [a-z-]+' README.md \| sort -u) <(jq -r '.scripts | keys[] | "bun run \(.)"' package.json \| sort)` |

## 不要做的事

- 不寫「未來計劃」「Roadmap」（這些不是當前狀態）
- 不放截圖（會過時且 maintenance 重）
- 不複製貼上 license 全文（用 LICENSE 檔案）
- 不寫貢獻者列表（用 git log 即可）
- 不把 CHANGELOG 整個塞進 README
