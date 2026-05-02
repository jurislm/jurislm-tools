# Coolify Plugin Detail

## Purpose

描述 `coolify` Hybrid plugin 的工具集、核心概念與操作模式，管理 Coolify 自託管 PaaS 平台上的應用程式、資料庫與伺服器。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| MCP Server | `plugins/coolify/.mcp.json` | `@jurislm/coolify-mcp@latest`（43 工具） |
| `coolify` skill | `plugins/coolify/skills/coolify/SKILL.md` | 使用指南（191 行） |
| `/coolify` command | `plugins/coolify/commands/coolify.md` | 入口 command |
| api-reference | `plugins/coolify/skills/coolify/references/api-reference.md` | API 工具完整參數 |
| deployment-patterns | `plugins/coolify/skills/coolify/references/deployment-patterns.md` | 部署模式參考 |
| troubleshooting | `plugins/coolify/skills/coolify/references/troubleshooting.md` | 問題排查 SOP |

## 外部依賴

```json
{
  "command": "npx",
  "args": ["-y", "@jurislm/coolify-mcp@latest"],
  "env": {
    "COOLIFY_ACCESS_TOKEN": "${COOLIFY_ACCESS_TOKEN}",
    "COOLIFY_BASE_URL": "${COOLIFY_BASE_URL}"
  }
}
```

npm 套件：`@jurislm/coolify-mcp`（jurislm/coolify-mcp repo）  
工具數量來源：`grep -c "server.tool" ../coolify-mcp/src/lib/mcp-server.ts`

## 43 個 MCP 工具分類

| 類別 | 工具數 | 主要操作 |
|------|--------|---------|
| 基礎設施 | 2 | 版本查詢、基礎設施概覽 |
| 診斷 | 3 | 應用診斷、伺服器診斷、問題掃描 |
| 伺服器 | 7 | CRUD、資源查詢、域名管理、驗證 |
| 專案與環境 | 4 | 專案 CRUD、環境管理 |
| 應用程式 | 9 | CRUD（5 種建立方式）、日誌、環境變數、控制 |
| 資料庫 | 6 | 8 種 DB 類型、備份排程、環境變數 |
| 服務 | 4 | 建立、更新、刪除、控制 |
| 部署 | 4 | 列表、部署、取消、狀態 |
| 私鑰 | 2 | SSH 金鑰 CRUD |
| GitHub Apps | 3 | 整合管理、repo/branch 列表 |
| 儲存空間 | 1 | 持久化磁碟區與檔案儲存 |
| 排程任務 | 2 | Cron 任務 CRUD、執行記錄 |
| 雲端 Token | 1 | Hetzner/DigitalOcean Token 管理 |
| 團隊 | 1 | 團隊與成員查詢 |
| 批量操作 | 5 | 重啟專案、環境變數更新、全面停止、重新部署 |

## 核心概念：Application vs Service

| 類型 | 說明 | FQDN 更新方式 |
|------|------|-------------|
| Application | 單一應用（Git / Dockerfile / Docker Image） | API 欄位 `domains`（非 `fqdn`） |
| Service | Docker Compose 組合（多容器） | 修改 `docker_compose_raw` 內的 Traefik labels |

**重要**：設定域名時 API request body 欄位名稱是 `domains`（傳入 `fqdn` 觸發 422）。Service API 只接受 `name`, `description`, `docker_compose_raw`。

## 環境變數

- `COOLIFY_ACCESS_TOKEN`：Coolify API 認證 token，寫入 `~/.zshenv`
- `COOLIFY_BASE_URL`：Coolify 實例 URL（如 `https://coolify.jurislm.com`），寫入 `~/.zshenv`
