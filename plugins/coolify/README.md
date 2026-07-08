# coolify

Coolify 部署管理 — 43 個 MCP 工具 + skill + command

## 安裝

```bash
/plugin install jurislm-tools@coolify
```

## 內容

- MCP server (43 tools)
- skill
- /coolify command

## 環境變數

此 plugin 包含 MCP server，需在 `~/.zshenv` 設定：

```bash
export COOLIFY_ACCESS_TOKEN="..."
export COOLIFY_BASE_URL="..."
```

> **必須放 `~/.zshenv`，不能放 `~/.zshrc`。**
>
> MCP server 由 `zsh -lc` 啟動。非互動式 login shell 會讀 `~/.zshenv`、
> `~/.zprofile`、`~/.zlogin`，**不讀** `~/.zshrc`。
>
> 這是為了繞過 Claude Code 桌面 App 不繼承自訂環境變數的行為——它從 launchd 啟動、
> 不經過任何 shell，`.mcp.json` 的 `${VAR}` 因此展開成空字串。
>
> ⚠️ **上述三個檔案都不可有任何 stdout 輸出**（`echo` / `printf` / neofetch 之類）。
> MCP 走 stdio JSON-RPC，shell 啟動時印的任何一個字都會排在第一個 JSON 訊息前面，
> 導致 handshake 失敗。要印東西請導向 stderr（`print -u2 ...`）。
>
> 啟動時以 `env -i` 只把上列變數交給 MCP server，其餘 shell 環境
> （`NPM_TOKEN`、`GITHUB_PERSONAL_ACCESS_TOKEN` 等）不會外洩給該行程。
>
> 需要 `zsh` 在 PATH 上（macOS 內建）。

## 使用

/coolify list-applications 或自然語言詢問 Coolify 部署狀態。

## 來源

此 plugin 屬於 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
