# Infrastructure Management Overview

## Purpose

說明外部 `coolify-plugin` 與 `hetzner-plugin` 的角色分工。兩者已不屬於 `jurislm-tools` marketplace。

## Roles

| Plugin | Layer | Primary operations |
|---|---|---|
| `hetzner-plugin` | Infrastructure | Servers, SSH keys, Volumes, and Storage Box |
| `coolify-plugin` | Platform | Applications, databases, domains, deployments, and diagnostics |

典型流程先由 `hetzner-plugin` 建立或確認運算資源，再由 `coolify-plugin` 部署應用程式與資料庫。

兩個獨立 plugin repository：

- [coolify-plugin](https://github.com/jurislm/coolify-plugin)
- [hetzner-plugin](https://github.com/jurislm/hetzner-plugin)

## Environment variables

環境變數必須寫入 `~/.zshenv`；MCP server 是非互動式子進程，不讀取 `~/.zshrc`。

| Plugin | Variable | Purpose |
|---|---|---|
| `coolify-plugin` | `COOLIFY_TOKEN` | Coolify API authentication |
| `coolify-plugin` | `COOLIFY_URL` | Coolify instance URL |
| `hetzner-plugin` | `HETZNER_API_TOKEN` | Hetzner Cloud authentication |
| `hetzner-plugin` | `HETZNER_API_TOKEN_UNIFIED` | Hetzner Storage Box authentication |

不得把 token 值寫入 repository、log 或驗證輸出。
