# Infrastructure Management Overview

## Purpose

說明 `coolify` 與 `hetzner` Hybrid plugins 的共同安全模式，以及 JurisLM 基礎設施管理中的角色分工。

## Roles

| Plugin | Layer | Primary operations |
|---|---|---|
| `hetzner` | Infrastructure | Servers, SSH keys, Volumes, and Storage Box |
| `coolify` | Platform | Applications, databases, domains, deployments, and diagnostics |

典型流程先由 `hetzner` 建立或確認運算資源，再由 `coolify` 部署應用程式與資料庫。

## Hybrid plugin structure

```text
plugins/<name>/
├── .claude-plugin/plugin.json
├── .mcp.json
├── README.md
└── skills/<name>/
    ├── SKILL.md
    └── references/
```

兩個本機 MCP launchers 都以 `env -i` 限縮傳入環境，並鎖定精確 npm 版本：

- Coolify：`@jurislm/coolify-mcp@3.6.0`
- Hetzner：`@jurislm/hetzner-mcp@1.5.0`

任何 `@latest`、range 或 unversioned package 都必須被 repository validation 拒絕。

## Environment variables

環境變數必須寫入 `~/.zshenv`；MCP server 是非互動式子進程，不讀取 `~/.zshrc`。

| Plugin | Variable | Purpose |
|---|---|---|
| `coolify` | `COOLIFY_ACCESS_TOKEN` | Coolify API authentication |
| `coolify` | `COOLIFY_BASE_URL` | Coolify instance URL |
| `hetzner` | `HETZNER_API_TOKEN` | Hetzner Cloud authentication |

不得把 token 值寫入 repository、log 或驗證輸出。

## Detail specs

- [Coolify detail](./coolify-detail.md)
- [Hetzner detail](./hetzner-detail.md)
