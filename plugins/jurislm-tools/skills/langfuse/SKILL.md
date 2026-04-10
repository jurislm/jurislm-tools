---
name: langfuse
version: 1.0.0
description: This skill should be used when the user asks to "manage Langfuse prompts", "view traces", "check LLM observations", "query Langfuse", "list prompts", "get trace details", "create scores", "analyze LLM performance", or mentions Langfuse, prompt management, LLM observability, or trace analysis.
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

## 工具詳解

### 1. Prompt Management（6 工具）

#### `listPrompts`
列舉所有 prompts，支援分頁與篩選：
```
page: 頁碼（預設 1）
limit: 每頁數量（1-100，預設 50）
name: 精確名稱篩選
label: 標籤篩選（如 "production"）
tag: 標籤篩選
```

#### `getPrompt`
取得指定 prompt 的完整內容（自動解析依賴）：
```
name: Prompt 名稱（必要）
label: 版本標籤（預設 production）
version: 指定版本號
```

#### `createTextPrompt`
建立新的文字 prompt 版本，支援 `{{variable}}` 語法：
```
name: Prompt 名稱
prompt: Prompt 文字內容
labels: 標籤陣列（如 ["production"]）
config: JSON 配置（如 {model, temperature}）
tags: 組織用標籤
commitMessage: 版本說明
```

#### `createChatPrompt`
建立新的聊天 prompt（role-based messages）：
```
name: Prompt 名稱
prompt: 訊息陣列 [{role: "system/user/assistant", content: "..."}]
labels, config, tags, commitMessage: 同上
```

#### `getPromptUnresolved`
取得 prompt 但**不解析依賴**（用於偵錯 prompt composition）：
```
name, label, version: 同 getPrompt
```

#### `updatePromptLabels`
更新 prompt 版本的標籤（升版 / 降版）：
```
name: Prompt 名稱
version: 要更新的版本號
newLabels: 新標籤陣列（空陣列 = 移除所有標籤）
```

### 2. Traces（2 工具）

#### `listTraces`
列舉執行追蹤，支援多重篩選：
```
page, limit: 分頁
name: trace 名稱篩選
userId: 使用者篩選
tags: 標籤篩選
fromTimestamp, toTimestamp: 時間範圍（ISO 8601）
```

#### `getTrace`
取得單個 trace 的完整詳情（含所有 observations 和 scores）：
```
traceId: Trace ID（必要）
```

### 3. Observations（2 工具）

#### `listObservations`
列舉觀測點（GENERATION / SPAN / EVENT）：
```
traceId: 指定 trace
type: 類型篩選（GENERATION/SPAN/EVENT）
name: 名稱篩選
page, limit: 分頁
```

#### `getObservation`
取得單個 observation 的完整詳情（input、output、usage、model、duration）：
```
observationId: Observation ID（必要）
```

### 4. Scores（2 工具）

#### `createScore`
為 trace 或 observation 建立評分：
```
traceId: Trace ID（必要）
name: 評分名稱（如 "accuracy", "hallucination"）
value: 數值評分
observationId: 可選，針對特定 observation 評分
comment: 可選說明
```

#### `listScores`
列舉評分，支援篩選：
```
name: 評分名稱篩選
userId: 使用者篩選
traceId: Trace 篩選
page, limit: 分頁
```

### 5. Sessions（1 工具）

#### `listSessions`
列舉會話（group 相關 traces）：
```
page, limit: 分頁
fromTimestamp, toTimestamp: 時間範圍（ISO 8601）
```

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
