# Hetzner Plugin Detail

## Purpose

描述 `hetzner` Hybrid plugin 的工具集與操作模式，管理 Hetzner Cloud 的伺服器建立、刪除、電源控制、SSH 金鑰、Volume 掛載與 Storage Box（含空間用量查詢、備份前空間預檢查）。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| MCP Server | `plugins/hetzner/.mcp.json` | `@jurislm/hetzner-mcp@latest`（42 工具） |
| `hetzner` skill | `plugins/hetzner/skills/hetzner/SKILL.md` | 使用指南（238 行） |
| `/hetzner` command | `plugins/hetzner/commands/hetzner.md` | 入口 command |
| locations reference | `plugins/hetzner/skills/hetzner/references/locations.md` | 資料中心位置參考 |
| server-types reference | `plugins/hetzner/skills/hetzner/references/server-types.md` | 伺服器規格與定價 |

## 外部依賴

```json
{
  "command": "npx",
  "args": ["-y", "@jurislm/hetzner-mcp@latest"],
  "env": {
    "HETZNER_API_TOKEN": "${HETZNER_API_TOKEN}"
  }
}
```

npm 套件：`@jurislm/hetzner-mcp`（jurislm/hetzner-mcp repo）  
工具數量來源：`grep -c '"hetzner_' ../hetzner-mcp/src/tools/*.ts`

## 42 個 MCP 工具分類

### 伺服器管理（9 個工具）

| 工具 | 說明 | 危險性 |
|------|------|--------|
| `hetzner_list_servers` | 列出所有伺服器 | — |
| `hetzner_get_server` | 查詢單一伺服器詳情 | — |
| `hetzner_get_server_metrics` | 查詢伺服器監控指標 | — |
| `hetzner_get_server_ram` | 查詢伺服器記憶體用量 | — |
| `hetzner_create_server` | 建立新伺服器 | — |
| `hetzner_delete_server` | 刪除伺服器 | ⚠️ 不可逆 |
| `hetzner_power_on_server` | 開機 | — |
| `hetzner_power_off_server` | 強制關機（硬關，資料可能遺失） | ⚠️ |
| `hetzner_reboot_server` | 強制重啟（硬重啟） | — |

### SSH 金鑰管理（4 個工具）

| 工具 | 說明 | 危險性 |
|------|------|--------|
| `hetzner_list_ssh_keys` | 列出所有 SSH 金鑰 | — |
| `hetzner_get_ssh_key` | 查詢單一 SSH 金鑰 | — |
| `hetzner_create_ssh_key` | 新增 SSH 金鑰 | — |
| `hetzner_delete_ssh_key` | 刪除 SSH 金鑰 | ⚠️ |

### Volume 管理（4 個工具）

| 工具 | 說明 | 危險性 |
|------|------|--------|
| `hetzner_list_volumes` | 列出所有 Volume | — |
| `hetzner_get_volume` | 查詢單一 Volume 詳情 | — |
| `hetzner_attach_volume` | 掛載 Volume 至伺服器（僅 API 層，不寫 fstab） | — |
| `hetzner_detach_volume` | 卸載 Volume | — |

### Storage Box 管理（22 個工具）

| 工具 | 說明 | 危險性 |
|------|------|--------|
| `hetzner_list_storage_boxes` | 列出所有 Storage Box | — |
| `hetzner_get_storage_box` | 查詢單一 Storage Box 詳情 | — |
| `hetzner_get_storage_box_stats` | 查詢空間用量統計（`used_bytes`/`used_gib`/`total_bytes`/`total_gib`/`available_bytes`/`available_gib`/`usage_percent`） | — |
| `hetzner_assert_storage_box_space` | 備份前空間充足性斷言（`required_gib`，不足回 `isError: true`；json 回傳同上欄位 + `ok`/`required_gib`） | — |
| `hetzner_create_storage_box` | 建立新 Storage Box | — |
| `hetzner_delete_storage_box` | 刪除 Storage Box | ⚠️ 不可逆 |
| `hetzner_update_storage_box` | 更新 Storage Box | — |
| `hetzner_change_storage_box_type` | 變更方案容量 | — |
| `hetzner_change_storage_box_protection` | 變更刪除保護 | — |
| `hetzner_reset_storage_box_password` | 重設密碼 | ⚠️ 立即生效，舊密碼失效 |
| `hetzner_update_storage_box_access_settings` | 更新存取設定 | — |
| `hetzner_list_storage_box_folders` | 列出子帳號資料夾 | — |
| `hetzner_create_storage_box_snapshot` | 建立快照 | — |
| `hetzner_list_storage_box_snapshots` | 列出快照 | — |
| `hetzner_delete_storage_box_snapshot` | 刪除快照 | ⚠️ |
| `hetzner_rollback_storage_box_snapshot` | 回滾至快照 | ⚠️ 覆寫現況 |
| `hetzner_enable_storage_box_snapshot_plan` | 啟用自動快照排程 | — |
| `hetzner_disable_storage_box_snapshot_plan` | 停用自動快照排程 | — |
| `hetzner_create_storage_box_subaccount` | 建立子帳號 | — |
| `hetzner_list_storage_box_subaccounts` | 列出子帳號 | — |
| `hetzner_update_storage_box_subaccount` | 更新子帳號 | — |
| `hetzner_delete_storage_box_subaccount` | 刪除子帳號 | ⚠️ |

### 參考查詢（3 個工具）

| 工具 | 說明 |
|------|------|
| `hetzner_list_server_types` | 列出可用規格（CX / CPX / CAX 系列）與定價 |
| `hetzner_list_images` | 列出可用 OS（system / snapshot / backup / app） |
| `hetzner_list_locations` | 列出資料中心（nbg1 / fsn1 / hel1 等） |

## 建立伺服器標準流程

在呼叫 `hetzner_create_server` 前，必須先取得有效參數值：

```
1. hetzner_list_server_types  → 確認 server_type（如 "cx22", "cax31"）
2. hetzner_list_images        → 確認 image（如 "ubuntu-24.04"）
3. hetzner_list_locations     → 確認 location（如 "nbg1"）
4. hetzner_list_ssh_keys      → 取得 SSH 金鑰 ID
5. hetzner_create_server      → 使用上述參數建立
```

不得猜測或假設 server_type / image / location 的名稱，必須透過查詢工具確認。

## Reboot 後 Volume 復原注意事項

Hetzner Volume attach 不會自動寫入 `/etc/fstab`，reboot 後 `/dev/sdb` 不會自動 mount，所有依賴該 mount path 的 container 啟動失敗（Exit 127）。

預防方式：
```bash
UUID=$(blkid -s UUID -o value /dev/sdb)
echo "UUID=$UUID /mnt/HC_Volume_<id> ext4 discard,nofail,defaults 0 0" >> /etc/fstab
mount -a
```

## 環境變數

- `HETZNER_API_TOKEN`：Hetzner Cloud API token，寫入 `~/.zshenv`（**不是** `HCLOUD_TOKEN`）
