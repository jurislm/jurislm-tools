# hetzner

Hetzner VPS 管理 — 17 個 MCP 工具 + skill + command

## 安裝

```bash
/plugin install jurislm-tools@hetzner
```

## 內容

- MCP server (17 tools)
- skill
- /hetzner command

## 環境變數

此 plugin 包含 MCP server，需在 `~/.zshenv` 設定：

```bash
export HETZNER_API_TOKEN="..."
```

> **必須放 `~/.zshenv`，不能放 `~/.zshrc`。** MCP server 由 `/bin/zsh -lc` 啟動
> （login shell 只讀 `~/.zshenv` + `~/.zprofile`，**不讀** `~/.zshrc`）。
> 這是為了繞過 Claude Code 桌面 App 不繼承自訂環境變數的行為——它從 launchd 啟動、
> 不經過任何 shell，`.mcp.json` 的 `${VAR}` 因此展開成空字串。
> 啟動時以 `env -i` 只把上列變數交給 MCP server，其餘 shell 環境
> （`NPM_TOKEN`、`COOLIFY_ACCESS_TOKEN` 等）不會外洩給該行程。
>
> 需要 macOS + `/bin/zsh`。

## 使用

/hetzner list-servers 或自然語言詢問 VPS 狀態。

## 來源

此 plugin 屬於 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
