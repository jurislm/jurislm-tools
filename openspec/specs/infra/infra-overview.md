# Infrastructure Management Overview

## Purpose

說明 `coolify` 與 `hetzner` 兩個 Hybrid plugin 的共同設計模式，以及它們在 JurisLM 基礎設施管理中的角色分工。

## 角色分工

| Plugin | 負責層 | 主要操作 |
|--------|--------|---------|
| hetzner | 硬體層 | 伺服器建立 / 刪除 / 開關機 / 重啟、SSH 金鑰管理 |
| coolify | 應用層 | 應用部署 / 資料庫管理 / 域名設定 / 環境變數、問題診斷 |

典型工作流程：先透過 `hetzner` 建立或取得 VPS，再透過 `coolify` 在該 VPS 上部署應用程式與資料庫。

## 共同設計模式（Hybrid Plugin）

兩個 plugin 均採用相同的 **Hybrid Plugin** 結構：

```
plugins/<name>/
├── .claude-plugin/plugin.json   ← plugin 元資料
├── .mcp.json                    ← MCP Server 設定（npx 啟動）
├── commands/<name>.md           ← /<name> slash command
└── skills/<name>/
    ├── SKILL.md                 ← skill 主體（auto-trigger 描述）
    └── references/              ← 參考文件
```

MCP Server 均以 `npx -y @jurislm/<name>-mcp@latest` 啟動，採 `@latest` 策略（不鎖版本）。

## 環境變數

兩個 plugin 的環境變數必須寫入 `~/.zshenv`（MCP Server 是非互動式子進程，不 source `~/.zshrc`）：

| Plugin | 環境變數 | 說明 |
|--------|---------|------|
| coolify | `COOLIFY_ACCESS_TOKEN` | Coolify API 認證 token |
| coolify | `COOLIFY_BASE_URL` | Coolify 實例 URL（含 protocol） |
| hetzner | `HETZNER_API_TOKEN` | Hetzner Cloud API token（非 `HCLOUD_TOKEN`） |

設定後需**完整重啟 Claude Code**（reload 不夠）。

## Detail Specs

- [coolify-detail.md](./coolify-detail.md)
- [hetzner-detail.md](./hetzner-detail.md)
