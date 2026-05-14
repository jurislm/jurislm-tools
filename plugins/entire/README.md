# entire

Entire CLI 的 MCP wrapper — 管理 AI agent checkpoints 和 sessions（11 個工具）

## 安裝

```bash
/plugin install jurislm-tools@entire
```

## 內容

- MCP server（11 tools）
- skill

## 環境變數

在 `~/.zshenv` 設定：

```bash
export ENTIRE_REPO_PATH="/path/to/your/default/repo"
```

每個工具也接受 `repo_dir` 參數覆蓋此環境變數。

## 注意事項

- 需要先執行 `entire login`（token 存於 OS keychain）
- `entire checkpoint search --json` 不可靠（preview），已排除在外
- 改用 `entire_checkpoint_list` + `entire_checkpoint_explain` 組合查詢

## 來源

此 plugin 屬於 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。
