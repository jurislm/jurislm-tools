# Entire CLI 環境設定

## 安裝

```bash
# 安裝 entire CLI
npm install -g @entireio/cli

# 登入
entire login

# 診斷安裝
entire doctor
```

## 環境變數

```bash
# ~/.zshenv — 設定預設 repo 路徑（讓 MCP 工具免傳 repo_dir 參數）
export ENTIRE_REPO_PATH="/path/to/your/project"
```

**注意**：`~/.zshenv` 對所有 zsh 子進程（包含 MCP server）生效；`~/.zshrc` 在非互動式 shell 不 source，MCP 無法讀到。

## 驗證設定

```bash
# 確認環境變數已設定
echo $ENTIRE_REPO_PATH

# 確認 entire 已登入且 repo 已初始化
entire doctor

# 列出 checkpoints 確認 MCP 可讀取
entire checkpoint list
```

## 常見設定問題

| 症狀 | 原因 | 解法 |
|------|------|------|
| MCP 工具回傳空結果 | `ENTIRE_REPO_PATH` 未設或路徑錯誤 | 確認 `~/.zshenv` 已 export，或每次傳入 `repo_dir` 參數 |
| `entire_doctor` 回報 login 失敗 | `entire login` 未完成 | 執行 `entire login`，瀏覽器完成 OAuth |
| checkpoint list 為空 | Entire 未初始化此 repo | 在 repo 目錄執行 `entire doctor` 查看初始化狀態 |
| MCP 設定後仍無效 | Claude Code 未重啟，舊 env 仍在 | 從新終端機 tab 重啟 Claude Code（不是在原 tab 重開）|

## MCP 設定（plugin.json 自動處理）

MCP server 透過 `.mcp.json` 配置：

```json
{
  "mcpServers": {
    "entire": {
      "command": "npx",
      "args": ["-y", "@jurislm/entire-mcp"],
      "env": {
        "ENTIRE_REPO_PATH": "${ENTIRE_REPO_PATH}"
      }
    }
  }
}
```

`${ENTIRE_REPO_PATH}` 從 Claude Code 的 `settings.local.json` env 區塊讀取，或繼承自啟動 shell 的環境。
