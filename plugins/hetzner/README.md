# hetzner

透過 MCP 與 Skill 管理 Hetzner Cloud 伺服器、SSH 金鑰、Volume 與 Storage Box。

## 安裝

```bash
claude plugin install hetzner@jurislm-tools
```

## 內容

- MCP server：`@jurislm/hetzner-mcp@1.5.0`
- `hetzner` Skill

## 環境變數

此 plugin 包含 MCP server，需在 `~/.zshenv` 設定：

```bash
export HETZNER_API_TOKEN="..."
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
> （`NPM_TOKEN`、`COOLIFY_ACCESS_TOKEN` 等）不會外洩給該行程。
>
> 需要 `zsh` 在 PATH 上（macOS 內建）。

## 使用

以自然語言詢問 VPS 狀態或要求管理 Hetzner 資源；安裝後由 `hetzner` Skill 自動路由。

## 來源

此 plugin 屬於 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
