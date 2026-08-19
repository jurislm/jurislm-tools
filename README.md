# jurislm-tools

JurisLM 內部使用的 Claude Code Plugin Marketplace，提供基礎設施、可觀測性、內容處理與開發工作流 plugins。Codex 亦可透過 Claude marketplace 相容層載入本 repo。

## 安裝

先加入 marketplace：

```bash
claude plugin marketplace add https://github.com/jurislm/jurislm-tools.git
```

再安裝需要的 plugin；識別字格式固定為 `plugin@marketplace`：

```bash
claude plugin install coolify@jurislm-tools
```

更新已安裝的 plugin：

```bash
claude plugin update coolify@jurislm-tools
```

安裝或更新後請開啟新的 Claude Code／Codex session，讓 Skills 與 MCP tools 重新載入。

## Plugins

| Plugin | 類型 | 安裝命令 | 功能 |
|---|---|---|---|
| `coolify` | MCP + Skill | `claude plugin install coolify@jurislm-tools` | Coolify 部署、資料庫與基礎設施管理 |
| `hetzner` | MCP + Skill | `claude plugin install hetzner@jurislm-tools` | Hetzner Cloud、Volume 與 Storage Box 管理 |
| `langfuse` | MCP + Skill | `claude plugin install langfuse@jurislm-tools` | Prompt、Trace、Observation 與評分管理 |
| `higgsfield` | Remote MCP + Skills | `claude plugin install higgsfield@jurislm-tools` | AI 圖像、影片、3D、音訊、遊戲與網站生成 |
| `repo-standards` | Skill | `claude plugin install repo-standards@jurislm-tools` | JurisLM repository 標準檢查與設定 |
| `podcast-to-blog` | Skill | `claude plugin install podcast-to-blog@jurislm-tools` | Podcast 轉錄與繁體中文文章生成 |
| `codebase-sync` | Skill | `claude plugin install codebase-sync@jurislm-tools` | README 與 CLAUDE.md 同步 |
| `learn-eval` | Skill | `claude plugin install learn-eval@jurislm-tools` | 從 session 萃取可重用 patterns |
| `jt-flow` | Skills | `claude plugin install jt-flow@jurislm-tools` | `jt-flow-one` 單一需求與 `jt-flow-all` 依相依關係派送 active changes、序列化整合的 OpenSpec 工作流 |

Skills 由自然語言意圖觸發；本 repo 不再提供舊版 `/jt:*` 或 `/jt-flow` slash commands。

`jt-flow-all` 先以乾淨、已更新的 remote `main` snapshot 建立 whole-change
dependency map；每個 proposal 都以 Delivery Relations 記錄優先序、相依、外部
blocker、受影響區域與 production target。關係缺漏或矛盾只會讓該
item `BLOCKED`，不會停止無關的 `READY` items；coordinator 保留一個 agent slot，
其餘可用容量交由 `jt-flow-one` 擁有各 item 的 worktree、實作與品質審查。

Item 通過實作、測試、PR 與 `jt-flow-one` 的品質審查後才是
`INTEGRATION_READY`。coordinator 一次只授予一個 repository、item HEAD SHA 與
remote-main SHA 完全相符的 integration permit，因此 merge 與任何 production
mutation 都走單一 lane。proposal 的獨立 overdesign review 與 `jt-flow-one` 的
implementation quality review 分工；Copilot quota exhausted 或 CodeRabbit
quota/rate-limit exhausted 時，依既有 bounded-skip 規則記錄限制並繼續，不把整個
queue 永久卡住。

## MCP 套件政策

會接收基礎設施憑證的本機 MCP launcher 一律鎖定精確 npm 版本：

| Plugin | 套件 |
|---|---|
| `coolify` | `@jurislm/coolify-mcp@3.6.0` |
| `hetzner` | `@jurislm/hetzner-mcp@1.5.0` |
| `langfuse` | `@jurislm/langfuse-mcp@1.3.2` |

升級必須透過明確的 dependency PR；不得改回 `@latest` 或版本範圍。

## 環境變數

本機 MCP server 由非互動式 login shell 啟動，因此環境變數必須設於 `~/.zshenv`，而非 `~/.zshrc`：

```bash
export COOLIFY_ACCESS_TOKEN="your-token"
export COOLIFY_BASE_URL="https://your-coolify-instance.com"

export HETZNER_API_TOKEN="your-token"

export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://us.cloud.langfuse.com"
```

Higgsfield 使用 remote MCP OAuth，不需本機 API key。

## 開發與驗證

本 repo 採 GitHub Flow：feature branch 直接對 `main` 開 PR，不維護 `develop` 分支，並禁止直接 push `main`。開始修改前請從最新 `origin/main` 建立獨立 worktree。

開發工具鏈支援的 Node.js 版本為 `^22.22.2 || ^24.15.0 || >=26.0.0`；執行安裝或驗證前請先確認本機版本符合此範圍。

```bash
npm ci
npm run validate
claude plugin validate .
```

`npm run validate` 會執行 Node 測試、marketplace integrity、Release Please 版本同步與 entry-document Markdown lint。Plugin 與 marketplace 的 release version 由 Release Please 管理，不得手動修改。

## Codex App Local Environment

`.codex/environments/environment.toml` 提供 worktree setup 與 JSON／版本同步 actions；setup 刻意維持 no-op，避免為純文字 marketplace 增加不必要的 bootstrap。

## 授權

UNLICENSED
