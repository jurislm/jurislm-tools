# Hetzner Plugin Detail

## Purpose

描述 `hetzner` Hybrid plugin 的工具集與操作模式，管理 Hetzner Cloud 的伺服器建立、刪除、電源控制與 SSH 金鑰。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| MCP Server | `plugins/hetzner/.mcp.json` | `@jurislm/hetzner-mcp@latest`（17 工具） |
| `hetzner` skill | `plugins/hetzner/skills/hetzner/SKILL.md` | 使用指南（150 行） |
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

## 17 個 MCP 工具分類

### 伺服器管理（7 個工具）

| 工具 | 說明 | 危險性 |
|------|------|--------|
| `hetzner_list_servers` | 列出所有伺服器 | — |
| `hetzner_get_server` | 查詢單一伺服器詳情 | — |
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
