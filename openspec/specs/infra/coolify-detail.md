# Coolify Plugin Detail

## Purpose

描述 `coolify` Hybrid plugin 的工具集、核心概念與操作模式，管理 Coolify 自託管 PaaS 平台上的應用程式、資料庫與伺服器。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| MCP Server | `plugins/coolify/.mcp.json` | `@jurislm/coolify-mcp@3.6.0` |
| `coolify` skill | `plugins/coolify/skills/coolify/SKILL.md` | 使用指南 |
| api-reference | `plugins/coolify/skills/coolify/references/api-reference.md` | API 工具完整參數 |
| deployment-patterns | `plugins/coolify/skills/coolify/references/deployment-patterns.md` | 部署模式參考 |
| troubleshooting | `plugins/coolify/skills/coolify/references/troubleshooting.md` | 問題排查 SOP |

## 外部依賴

```json
{
  "command": "zsh",
  "args": [
    "-lc",
    "exec env -i HOME=\"$HOME\" PATH=\"$PATH\" USER=\"$USER\" SHELL=\"$SHELL\" TERM=\"$TERM\" LOGNAME=\"$LOGNAME\" COOLIFY_ACCESS_TOKEN=\"$COOLIFY_ACCESS_TOKEN\" COOLIFY_BASE_URL=\"$COOLIFY_BASE_URL\" npx -y @jurislm/coolify-mcp@3.6.0"
  ]
}
```

npm 套件：`@jurislm/coolify-mcp@3.6.0`（jurislm/coolify-mcp repo）

MCP launcher 使用 login shell 與 `env -i` allowlist，避免桌面啟動環境
遺失 `~/.zshenv` 變數或把其他 shell secrets 傳給 MCP。`~/.zshenv`、
`~/.zprofile`、`~/.zlogin` 不得向 stdout 輸出內容，以免污染 stdio
JSON-RPC handshake。

## MCP 工具分類

| 類別 | 主要操作 |
|------|---------|
| 基礎設施 | 版本查詢、基礎設施概覽 |
| 診斷 | 應用診斷、伺服器診斷、問題掃描 |
| 伺服器 | CRUD、資源查詢、域名管理、驗證 |
| 專案與環境 | 專案 CRUD、環境管理 |
| 應用程式 | CRUD（多種建立方式）、日誌、環境變數、控制 |
| 資料庫 | 多種 DB 類型、備份排程、環境變數 |
| 服務 | 建立、更新、刪除、控制 |
| 部署 | 列表、部署、取消、狀態 |
| 私鑰 | SSH 金鑰 CRUD |
| GitHub Apps | 整合管理、repo/branch 列表 |
| 儲存空間 | 持久化磁碟區與檔案儲存 |
| 排程任務 | Cron 任務 CRUD、執行記錄 |
| 雲端 Token | Hetzner/DigitalOcean Token 管理 |
| 團隊 | 團隊與成員查詢 |
| 批量操作 | 重啟專案、環境變數更新、全面停止、重新部署 |

## 核心概念：Application vs Service

| 類型 | 說明 | FQDN 更新方式 |
|------|------|-------------|
| Application | 單一應用（Git / Dockerfile / Docker Image） | API 欄位 `fqdn` 或 `domains` |
| Application（docker-compose build pack） | 使用 docker-compose 部署的 Application | API 欄位 `docker_compose_domains` |
| Service | Docker Compose 組合（多容器） | 修改 `docker_compose_raw` 內的 Traefik labels |

**重要**：docker-compose Application 不可使用 `fqdn` 或 `domains`，應傳
`docker_compose_domains`；Service API 以 `docker_compose_raw` 內的 Traefik
labels 控制 FQDN。請依實際 Application build pack 選擇欄位。

## 環境變數

- `COOLIFY_ACCESS_TOKEN`：Coolify API 認證 token，寫入 `~/.zshenv`
- `COOLIFY_BASE_URL`：Coolify 實例 URL（如 `https://coolify.jurislm.com`），寫入 `~/.zshenv`
