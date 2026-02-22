---
name: hetzner
description: This skill should be used when the user asks to "create a Hetzner server", "manage Hetzner Cloud infrastructure", "list Hetzner servers", "add SSH key to Hetzner", "check Hetzner server types", "provision a VPS", or mentions Hetzner Cloud server management, infrastructure provisioning, or cloud resource operations.
version: 1.0.0
---

# Hetzner Cloud MCP 使用指南

透過 `hetzner-mcp-server` MCP 工具管理 Hetzner Cloud 基礎設施。

## MCP 工具概覽（14 個工具）

### 伺服器管理（7 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `hetzner_list_servers` | 列出所有伺服器 | — |
| `hetzner_get_server` | 查詢單一伺服器詳情 | `id` |
| `hetzner_create_server` | 建立新伺服器 | `name`, `server_type`, `image` |
| `hetzner_delete_server` | 刪除伺服器 ⚠️ | `id` |
| `hetzner_power_on_server` | 開機 | `id` |
| `hetzner_power_off_server` | 強制關機（硬關） ⚠️ | `id` |
| `hetzner_reboot_server` | 強制重啟（硬重啟） | `id` |

### SSH 金鑰管理（4 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `hetzner_list_ssh_keys` | 列出所有 SSH 金鑰 | — |
| `hetzner_get_ssh_key` | 查詢單一 SSH 金鑰 | `id` |
| `hetzner_create_ssh_key` | 新增 SSH 金鑰 | `name`, `public_key` |
| `hetzner_delete_ssh_key` | 刪除 SSH 金鑰 ⚠️ | `id` |

### 參考資料（3 個工具）

| 工具 | 說明 |
|------|------|
| `hetzner_list_server_types` | 列出可用規格與定價 |
| `hetzner_list_images` | 列出可用 OS 映像（system/snapshot/backup/app） |
| `hetzner_list_locations` | 列出可用資料中心 |

## 常見工作流程

### 建立新伺服器

在建立伺服器前，先取得有效的參數值：

```
1. hetzner_list_server_types  → 選擇 server_type（如 "cx22"、"cax31"）
2. hetzner_list_images        → 選擇 image（如 "ubuntu-24.04"）
3. hetzner_list_locations     → 選擇 location（如 "nbg1"、"fsn1"）
4. hetzner_list_ssh_keys      → 取得 SSH 金鑰名稱或 ID
5. hetzner_create_server      → 使用上述參數建立
```

**`hetzner_create_server` 完整參數：**
- `name`（必填）— 伺服器名稱
- `server_type`（必填）— 規格代號（e.g. `"cx22"`）
- `image`（必填）— OS 映像（e.g. `"ubuntu-24.04"`）
- `location`（選填）— 資料中心（e.g. `"nbg1"`）
- `ssh_keys`（選填）— SSH 金鑰名稱或 ID 陣列
- `labels`（選填）— 標籤 key-value object（e.g. `{"env": "production"}`）
- `start_after_create`（選填，預設 `true`）— 建立後立即啟動

### 篩選伺服器

`hetzner_list_servers` 支援 `label_selector` 過濾：
```
label_selector: "env=production"
```

### 管理 SSH 金鑰

新增金鑰時 `public_key` 需填入公鑰內容字串（非路徑）：
```
name: "my-macbook"
public_key: "ssh-ed25519 AAAA... user@host"
```

## 不支援的功能

此 MCP 伺服器**不支援**：
- Volumes（磁碟區）管理
- Firewalls（防火牆）管理
- Projects（專案）管理
- Load Balancers / Floating IPs / Private Networks
- 帳單相關操作

## 注意事項

### ⚠️ 危險操作
- `hetzner_delete_server`：**不可逆**，會永久刪除伺服器與資料
- `hetzner_power_off_server`：硬關機（等同拔電源），可能造成資料損毀，執行前確認用戶同意
- `hetzner_create_server`：立即建立計費資源，確認規格與數量

### API Token 權限
- 列出/查詢操作：Read 權限即可
- 建立/刪除操作：需要 Read & Write 權限
- 一個 token 只能存取**單一** Hetzner Cloud 專案

### response_format
- 所有查詢工具支援 `response_format: "markdown" | "json"`（預設 `"markdown"`）
- 刪除工具（`delete_server`、`delete_ssh_key`）無此參數

## 環境變數設定

```bash
# ~/.zshenv
export HETZNER_API_TOKEN="your_token_here"
```

取得 Token：[Hetzner Cloud Console](https://console.hetzner.cloud/) → 專案 → Security → API Tokens
