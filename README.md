# jurislm-tools

JurisLM 內部 Claude Code Plugin — Coolify 部署管理、Hetzner VPS 管理、Langfuse 可觀測性、Podcast 轉部落格、PR 自動化審查與合併。

## 安裝

首次安裝（僅需執行一次）：

```
/plugin marketplace add https://github.com/jurislm/jurislm-tools.git
```

安裝外掛：

```
/plugin install jurislm-tools@jt
```

更新後重新安裝：

```
/plugin marketplace update jurislm-tools
/plugin install jurislm-tools@jt
```

安裝後重啟 Claude Code 讓 skills 載入。

## 可用功能

### MCP Servers

| Server | 工具數 | 功能 |
|--------|--------|------|
| `coolify` | 40 | 應用部署、資料庫、服務、診斷、排程任務 |
| `hetzner` | 14 | 伺服器建立/管理、SSH 金鑰、映像檔、規格查詢 |
| `langfuse` | 13 | Prompt 版本管理、執行追蹤、評分 |
| `langfuse` | 13 | Prompt 版本管理、執行追蹤、評分 |

### Commands / Skills

| 指令 | 說明 |
|------|------|
| `/jt:coolify` | 管理 Coolify 基礎設施 |
| `/jt:hetzner` | 管理 Hetzner Cloud 伺服器 |
| `/jt:langfuse` | 管理 Langfuse 可觀測性平台 |
| `/jt:podcast-to-blog` | 將 Apple Podcasts 轉換為部落格文章 |
| `/jt:pr-review` | 監控 CI、自動處理 Bot feedback、合併 PR |
| `/jt:repo-standards` | 設定新 repo 的 Release、ESLint、Code Review |
| `/jt:codebase-sync` | 更新 README.md 與 CLAUDE.md |

## 環境變數設定

在 `~/.zshenv` 加入（非 `~/.zshrc`，MCP Server 是非互動式子進程）：

```bash
# Coolify
export COOLIFY_ACCESS_TOKEN="your-token"
export COOLIFY_BASE_URL="https://your-coolify-instance.com"

# Hetzner
export HETZNER_API_TOKEN="your-token"

# Langfuse
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://us.cloud.langfuse.com"
```

設定後重啟 Claude Code。

## 授權

UNLICENSED
