---
name: langfuse
version: 1.0.0
description: >
  This skill should be used when the user asks to "manage Langfuse prompts", "view traces",
  "check LLM observations", "query Langfuse", "list prompts", "get trace details",
  "create scores", "analyze LLM performance", "查看 LLM 追蹤記錄", "列出 Langfuse prompts",
  "分析 LLM 用量", "查 traces", "查 Langfuse",
  or mentions Langfuse, prompt management, LLM observability, or trace analysis.
argument-hint: "[action] [prompt-name/trace-id]"
---

# Langfuse MCP Server 使用指南

Langfuse 是一個開源的 LLM 可觀測性平台，提供 Prompt 版本管理、執行追蹤（Traces）、觀測點（Observations）與評分（Scores）功能。此 skill 提供透過 MCP 工具管理 Langfuse 的完整指南。

## MCP 工具概覽

`@jurislm/langfuse-mcp` 提供 **13 個工具**，分為 5 個類別：

| 類別 | 工具數 | 功能 |
|------|--------|------|
| Prompt Management | 6 | 列舉、取得、建立、標籤管理 |
| Traces | 2 | 列舉、取得執行追蹤 |
| Observations | 2 | 列舉、取得觀測點 |
| Scores | 2 | 建立、列舉評分 |
| Sessions | 1 | 列舉會話 |

## 核心概念：Prompt 版本不可變

Langfuse 的 Prompt 是**不可變的**：
- 每次修改都建立新版本（immutable versioning）
- 用**標籤**（labels）指向特定版本，如 `production`、`staging`
- 標籤在版本間是唯一的：設定新版本為 `production` 會自動移除舊版本的 `production` 標籤
- 取得 prompt 時預設使用 `production` 標籤

> 各工具完整參數說明請見 `references/api-reference.md`。

## 常見工作流程

### 查詢最新執行追蹤
1. `listTraces` — 列舉最近 traces（依預設時間倒序）
2. `getTrace` — 取得特定 trace 的完整詳情
3. `listObservations` + `traceId` — 查看所有 LLM 呼叫詳情

### Prompt 版本管理
1. `listPrompts` — 查看所有 prompts 及其版本數
2. `getPrompt` — 取得目前 production 版本內容
3. `createTextPrompt` — 建立新版本（舊版本自動保留）
4. `updatePromptLabels` — 將新版本升為 production

### 評分工作流（Evals）
1. `listTraces` — 取得要評分的 traces
2. `getObservation` — 取得 LLM 生成的詳情
3. `createScore` — 記錄評分結果（accuracy、relevance 等）
4. `listScores` — 查看評分分布

## 環境變數

| 變數 | 必需 | 說明 |
|------|------|------|
| `LANGFUSE_PUBLIC_KEY` | ✓ | 公開金鑰（`pk-lf-...`） |
| `LANGFUSE_SECRET_KEY` | ✓ | 密鑰（`sk-lf-...`） |
| `LANGFUSE_HOST` | ✗ | API 伺服器（預設 `https://cloud.langfuse.com`） |

**JurisLM 使用 US region**：`LANGFUSE_HOST=https://us.cloud.langfuse.com`

## 注意事項

- Prompt labels 在版本間是 unique 的：設定 `production` 到新版本，舊版本的 `production` 標籤會自動移除
- 時間參數使用 ISO 8601 格式：`2026-01-01T00:00:00Z`
- Traces API 不支援 tag 篩選（`tags` 參數接受但不保證後端支援）
- 所有 API 呼叫失敗時拋出 Error（含 HTTP status + 回應文本）
