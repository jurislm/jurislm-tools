# Langfuse Plugin Detail

## Purpose

描述 `langfuse` Hybrid plugin 的工具集與操作模式，管理 Langfuse LLM 可觀測性平台的 Prompt 版本、執行追蹤（Traces）、觀測點（Observations）與評分（Scores）。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| MCP Server | `plugins/langfuse/.mcp.json` | `@jurislm/langfuse-mcp@latest`（13 工具） |
| `langfuse` skill | `plugins/langfuse/skills/langfuse/SKILL.md` | 使用指南（124 行） |
| `/langfuse` command | `plugins/langfuse/commands/langfuse.md` | 入口 command |
| api-reference | `plugins/langfuse/skills/langfuse/references/api-reference.md` | 工具完整參數說明 |

## 外部依賴

```json
{
  "command": "npx",
  "args": ["-y", "@jurislm/langfuse-mcp@latest"],
  "env": {
    "LANGFUSE_PUBLIC_KEY": "${LANGFUSE_PUBLIC_KEY}",
    "LANGFUSE_SECRET_KEY": "${LANGFUSE_SECRET_KEY}",
    "LANGFUSE_HOST": "${LANGFUSE_HOST}"
  }
}
```

npm 套件：`@jurislm/langfuse-mcp`（jurislm/langfuse-mcp repo）  
JurisLM 使用 `LANGFUSE_HOST=https://us.cloud.langfuse.com`  
工具數量來源：`grep -c "server.tool" ../langfuse-mcp/src/index.ts`

## 13 個 MCP 工具分類

| 類別 | 工具 | 說明 |
|------|------|------|
| Prompt Management | `listPrompts` | 列舉所有 prompts 及版本數 |
| | `getPrompt` | 取得 production 版本內容 |
| | `getPromptUnresolved` | 取得未解析的 prompt 模板 |
| | `createTextPrompt` | 建立新文字 prompt 版本 |
| | `createChatPrompt` | 建立新 chat prompt 版本 |
| | `updatePromptLabels` | 更新版本標籤（如升為 production） |
| Traces | `listTraces` | 列舉執行追蹤（倒序） |
| | `getTrace` | 取得特定 trace 完整詳情 |
| Observations | `listObservations` | 列舉觀測點（可依 traceId 篩選） |
| | `getObservation` | 取得特定觀測點詳情 |
| Scores | `createScore` | 建立評分記錄 |
| | `listScores` | 列舉評分記錄 |
| Sessions | `listSessions` | 列舉會話 |

## 核心設計：Prompt 不可變版本管理

Langfuse 的 Prompt 採用**不可變版本**設計：
- 每次修改建立新版本，舊版本永久保留
- 用**標籤**（labels）指向特定版本（`production` / `staging`）
- 標籤在版本間互斥：將新版本設為 `production` 會自動移除舊版本的 `production` 標籤
- `getPrompt` 預設取得 `production` 標籤對應的版本

安全升版流程：
```
1. createTextPrompt / createChatPrompt  → 建立新版本（自動 draft 標籤）
2. （可選）在 staging 環境測試新版本
3. updatePromptLabels                   → 將新版本設為 production
```

## 常見工作流程

### 分析 LLM 效能
```
1. listTraces     → 取得最近執行記錄
2. getTrace       → 查看特定 trace 的輸入/輸出
3. listObservations (traceId) → 查看所有 LLM 呼叫細節（token 用量、延遲）
```

### Prompt A/B 評估
```
1. listTraces     → 取得兩個版本各自的執行記錄
2. createScore    → 為每個 trace 記錄評分（accuracy / relevance 等）
3. listScores     → 彙整比較兩版本的評分分佈
```

## 環境變數

全部寫入 `~/.zshenv`：

| 變數 | 說明 |
|------|------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse 公開 API key |
| `LANGFUSE_SECRET_KEY` | Langfuse 私密 API key |
| `LANGFUSE_HOST` | Langfuse 實例 URL（JurisLM：`https://us.cloud.langfuse.com`） |
