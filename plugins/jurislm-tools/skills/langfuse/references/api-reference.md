# Langfuse MCP 工具詳解

## 1. Prompt Management（6 工具）

### `listPrompts`
列舉所有 prompts，支援分頁與篩選：
```
page: 頁碼（預設 1）
limit: 每頁數量（1-100，預設 50）
name: 精確名稱篩選
label: 標籤篩選（如 "production"）
tag: 標籤篩選
```

### `getPrompt`
取得指定 prompt 的完整內容（自動解析依賴）：
```
name: Prompt 名稱（必要）
label: 版本標籤（預設 production）
version: 指定版本號
```

### `createTextPrompt`
建立新的文字 prompt 版本，支援 `{{variable}}` 語法：
```
name: Prompt 名稱
prompt: Prompt 文字內容
labels: 標籤陣列（如 ["production"]）
config: JSON 配置（如 {model, temperature}）
tags: 組織用標籤
commitMessage: 版本說明
```

### `createChatPrompt`
建立新的聊天 prompt（role-based messages）：
```
name: Prompt 名稱
prompt: 訊息陣列 [{role: "system/user/assistant", content: "..."}]
labels, config, tags, commitMessage: 同上
```

### `getPromptUnresolved`
取得 prompt 但**不解析依賴**（用於偵錯 prompt composition）：
```
name, label, version: 同 getPrompt
```

### `updatePromptLabels`
更新 prompt 版本的標籤（升版 / 降版）：
```
name: Prompt 名稱
version: 要更新的版本號
newLabels: 新標籤陣列（空陣列 = 移除所有標籤）
```

---

## 2. Traces（2 工具）

### `listTraces`
列舉執行追蹤，支援多重篩選：
```
page, limit: 分頁
name: trace 名稱篩選
userId: 使用者篩選
tags: 標籤篩選
fromTimestamp, toTimestamp: 時間範圍（ISO 8601）
```

### `getTrace`
取得單個 trace 的完整詳情（含所有 observations 和 scores）：
```
traceId: Trace ID（必要）
```

---

## 3. Observations（2 工具）

### `listObservations`
列舉觀測點（GENERATION / SPAN / EVENT）：
```
traceId: 指定 trace
type: 類型篩選（GENERATION/SPAN/EVENT）
name: 名稱篩選
page, limit: 分頁
```

### `getObservation`
取得單個 observation 的完整詳情（input、output、usage、model、duration）：
```
observationId: Observation ID（必要）
```

---

## 4. Scores（2 工具）

### `createScore`
為 trace 或 observation 建立評分：
```
traceId: Trace ID（必要）
name: 評分名稱（如 "accuracy", "hallucination"）
value: 數值評分
observationId: 可選，針對特定 observation 評分
comment: 可選說明
```

### `listScores`
列舉評分，支援篩選：
```
name: 評分名稱篩選
userId: 使用者篩選
traceId: Trace 篩選
page, limit: 分頁
```

---

## 5. Sessions（1 工具）

### `listSessions`
列舉會話（group 相關 traces）：
```
page, limit: 分頁
fromTimestamp, toTimestamp: 時間範圍（ISO 8601）
```

---

## 注意事項

- 時間參數使用 ISO 8601 格式：`2026-01-01T00:00:00Z`
- Traces API 不支援 tag 篩選（`tags` 參數接受但不保證後端支援）
- 所有 API 呼叫失敗時拋出 Error（含 HTTP status + 回應文本）
