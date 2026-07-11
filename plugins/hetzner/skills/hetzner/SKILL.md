---
name: hetzner
version: 1.0.0
description: >
  This skill should be used when the user asks to "create a Hetzner server",
  "manage Hetzner Cloud infrastructure", "list Hetzner servers", "add SSH key to Hetzner",
  "check Hetzner server types", "provision a VPS", "Volume mount 失敗", "reboot 後 container 掛掉",
  "fstab 設定", "Storage Box 連線", "建立 Hetzner 伺服器", "列出 VPS",
  "管理 SSH 金鑰", "查看伺服器規格", "Hetzner Volume", "備份到 Storage Box",
  "Storage Box 空間用量", "Storage Box 剩餘容量", "備份前檢查空間", "pre-flight space check",
  or mentions Hetzner Cloud server management, infrastructure provisioning,
  or cloud resource operations.
argument-hint: "[action] [server-name/id]"
---

# Hetzner Cloud MCP 使用指南

透過 `@jurislm/hetzner-mcp` MCP 工具管理 Hetzner Cloud 基礎設施。

## MCP 工具概覽（42 個工具）

### 伺服器管理（9 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `hetzner_list_servers` | 列出所有伺服器 | — |
| `hetzner_get_server` | 查詢單一伺服器詳情 | `id` |
| `hetzner_get_server_metrics` | 查詢伺服器監控指標（CPU/流量等） | `id` |
| `hetzner_get_server_ram` | 查詢伺服器記憶體用量 | `id` |
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

### Volume 管理（4 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `hetzner_list_volumes` | 列出所有 Volume | — |
| `hetzner_get_volume` | 查詢單一 Volume 詳情 | `id` |
| `hetzner_attach_volume` | 掛載 Volume 至伺服器 | `id`, `server` |
| `hetzner_detach_volume` | 卸載 Volume | `id` |

> ⚠️ 這 4 個工具只操作 Hetzner API 層的 attach/detach。**不處理** Linux 端的 mount／`/etc/fstab`——見下方「常見陷阱：Reboot 後 Volume 不會自動 mount」，attach 後仍需手動 SSH 進去寫 fstab。

### Storage Box 管理（21 個工具）

| 工具 | 說明 | 必要參數 |
|------|------|----------|
| `hetzner_list_storage_boxes` | 列出所有 Storage Box | — |
| `hetzner_get_storage_box` | 查詢單一 Storage Box 詳情 | `id` |
| `hetzner_get_storage_box_stats` | **查詢空間用量統計**（used/total/available/usage_percent） | `id` |
| `hetzner_assert_storage_box_space` | **備份前空間充足性斷言**（不足時回傳 `isError: true`） | `id`, `required_gib` |
| `hetzner_create_storage_box` | 建立新 Storage Box | `name`, `storage_box_type`, `password` |
| `hetzner_delete_storage_box` | 刪除 Storage Box ⚠️ | `id` |
| `hetzner_update_storage_box` | 更新 Storage Box（名稱等） | `id` |
| `hetzner_change_storage_box_type` | 變更方案（容量） | `id`, `storage_box_type` |
| `hetzner_change_storage_box_protection` | 變更刪除保護 | `id` |
| `hetzner_reset_storage_box_password` | 重設密碼 | `id` |
| `hetzner_update_storage_box_access_settings` | 更新存取設定（SSH/SMB/WebDAV 等） | `id` |
| `hetzner_list_storage_box_folders` | 列出子帳號資料夾 | `id` |
| `hetzner_create_storage_box_snapshot` | 建立快照 | `id` |
| `hetzner_list_storage_box_snapshots` | 列出快照 | `id` |
| `hetzner_delete_storage_box_snapshot` | 刪除快照 ⚠️ | `id`, `snapshot` |
| `hetzner_rollback_storage_box_snapshot` | 回滾至快照 ⚠️ 覆寫現況 | `id`, `snapshot` |
| `hetzner_enable_storage_box_snapshot_plan` | 啟用自動快照排程 | `id` |
| `hetzner_disable_storage_box_snapshot_plan` | 停用自動快照排程 | `id` |
| `hetzner_create_storage_box_subaccount` | 建立子帳號 | `id` |
| `hetzner_list_storage_box_subaccounts` | 列出子帳號 | `id` |
| `hetzner_update_storage_box_subaccount` | 更新子帳號 | `id`, `subaccount_id` |
| `hetzner_delete_storage_box_subaccount` | 刪除子帳號 ⚠️ | `id`, `subaccount_id` |

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

## Storage Box：中繼資料用 MCP，實際傳檔用 SSH/SFTP

Storage Box 的**管理面**（容量查詢、快照、子帳號、保護設定）已有完整 MCP 工具（見上方「Storage Box 管理」）。但**實際上傳/下載檔案**（rsync、borg 備份）MCP 不支援，仍需直接 SSH/SFTP：

```bash
# ~/.ssh/config 建議設定（port 23 = SFTP/rsync/borg 可用）
Host storagebox
  HostName u<id>.your-storagebox.de
  User u<id>
  Port 23
  IdentityFile ~/.ssh/cx53-storagebox

# 連線確認
ssh storagebox

# 上傳備份
rsync -avz -e "ssh -p 23" ./backup/ storagebox:backups/
```

**⚠️ port 22 vs 23 關鍵差異**：
- Port 22：一般 shell 存取，只支援 create 時注入的 SSH key
- Port 23：SFTP / SCP / rsync / borg，支援後加的 `~/.ssh/authorized_keys` key
- 備份工具（rsync、borg）**必須用 port 23**；後加的 key 在 port 22 無效

### 備份前飛行前檢查（pre-flight space check）

備份 pipeline（cron job、`add-judgment-backup-sync` 等）在執行實際傳檔前，應先用 MCP 工具確認空間足夠，避免傳到一半才發現滿了：

```
hetzner_assert_storage_box_space(id=561406, required_gib=20, response_format="json")
```

- 空間足夠 → 正常回傳，`ok: true`
- 空間不足 → `isError: true`，pipeline 應中止並警示，不要繼續執行 rsync/pg_dump
- 只想看目前用量、不做斷言 → 用 `hetzner_get_storage_box_stats(id=561406)`，取得 `used_gib` / `total_gib` / `available_gib` / `usage_percent`

## 不支援的功能

此 MCP 伺服器**不支援**（需用 Hetzner Cloud Console UI、hcloud CLI 或 SSH/SFTP）：
- Storage Box 實際檔案傳輸（rsync、borg、SFTP 上傳/下載）— 用 SSH/SFTP 直接操作（見上方）
- Firewalls（防火牆）管理
- Projects（專案）管理 — 一個 API token 只能存取單一 project
- Load Balancers / Floating IPs / Private Networks
- 帳單相關操作

## 常見陷阱

### Reboot 後 Volume 不會自動 mount
Hetzner Volume attach **不寫 fstab**。Reboot 後 `/dev/sdb` 沒 mount，所有依賴該 mount path 的 container 啟動失敗（Exit 127）。

**預防**（建立 server 後立刻做）：
```bash
ssh root@<ip>
UUID=$(blkid -s UUID -o value /dev/sdb)
echo "UUID=$UUID /mnt/HC_Volume_<id> ext4 discard,nofail,defaults 0 0" >> /etc/fstab
mount -a   # 測試 fstab 語法
```
- `nofail` 關鍵 — Volume 異常時不阻塞 boot
- `discard` 啟用 TRIM 給 SSD

### 開機後 IP 變了
Hetzner 預設配 IPv4 + IPv6。`hetzner_get_server` 回傳 IPv4 `public_net.ipv4.ip` 是穩定的（除非主動 reassign）。但若用 floating IP，重啟可能切換，要看實際 attach 狀態。

### Server name 不可用做識別
API 操作要用 `id`（數字），不是 `name`。`name` 只是 label。

## 參考資料

- 規格與定價對照：`references/server-types.md`
- 資料中心位置選擇：`references/locations.md`

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

## 外部連結

- [Hetzner Cloud 官方文件](https://docs.hetzner.cloud/)
- [jurislm/hetzner-mcp GitHub](https://github.com/jurislm/hetzner-mcp)
