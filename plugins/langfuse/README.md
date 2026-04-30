# langfuse

Langfuse 可觀測性 — 50 個 MCP 工具 + skill + command

## 安裝

```bash
/plugin install jurislm-tools@langfuse
```

## 內容

- MCP server (50 tools)
- skill
- /langfuse command

## 環境變數

此 plugin 包含 MCP server，需在 `~/.zshenv` 設定：

```bash
export LANGFUSE_PUBLIC_KEY="..."
export LANGFUSE_SECRET_KEY="..."
export LANGFUSE_HOST="..."
```

## 使用

/langfuse list-prompts 或自然語言查詢 LLM traces。

## 來源

此 plugin 屬於 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
