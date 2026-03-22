# notion-workflow Plugin

Terry Chen 的 Notion Workspace 工作流程管理 plugin。透過自然語言，讓 Claude 自動維護 Notion 中的習慣記錄、任務管理、每日日誌與持久記憶（MEMORY.md）。

## 概覽

此 plugin 專為 Terry Chen（JurisLM 創辦人）設計，整合 Notion MCP，讓 Claude 成為 Notion 工作區的自然語言操作介面。

**核心 Notion 頁面：**
- MEMORY.md：https://www.notion.so/3264f5ac5c2b812d9990eddaab24169e
- 每日日誌 DB：https://www.notion.so/ed2cb0ab1565439e8bc51b521bf63618

---

## Skills 說明

### 自動觸發 Skills

| Skill | 觸發時機 | 功能 |
|-------|---------|------|
| `memory-context` | 對話開始 / 用戶要求載入記憶 | 靜默讀取 MEMORY.md 和近期日誌，建立工作上下文 |
| `notion-db-principles` | 設計/修改 Notion DB 時 | 套用 DB 設計原則（持續新增用 DB、一份資料只存一次、is_inline 設定、側邊欄結構）|
| `habit-tracker` | 查詢習慣統計時 | 計算運動/閱讀/冥想的連續天數（streak）與完成率 |

### 指令型 Skills（Slash Commands）

| 指令 | 功能 |
|------|------|
| `/notion-workflow:log-habit` | 記錄今日習慣完成情況（運動/閱讀/冥想），自動計算 streak |
| `/notion-workflow:log-task` | 新增任務到 Notion 任務 DB |
| `/notion-workflow:daily-log` | 寫入今日每日日誌，並選擇性更新 MEMORY.md |
| `/notion-workflow:memory-sync` | 重新讀取 MEMORY.md，輸出可見的上下文摘要 |

---

## 使用範例

### 記錄習慣
```
/notion-workflow:log-habit 運動✅ 閱讀✅ 冥想❌
→ 自動寫入今日日誌，顯示連續天數
```

### 新增任務
```
/notion-workflow:log-task 完成 JurisLM 投資簡報 高優先 週五前
→ 自動寫入任務 DB
```

### 今日日誌
```
/notion-workflow:daily-log
→ Claude 詢問今日完成事項、明日計畫，寫入日誌並判斷是否更新 MEMORY.md
```

### 同步記憶
```
/notion-workflow:memory-sync
→ 輸出 MEMORY.md 內容摘要 + 近期日誌 + 習慣 streak
```

---

## 設定

### 必要條件

1. **Notion MCP 已連接**：此 plugin 使用 Notion MCP 進行所有 Notion 操作
2. **Notion 已授權**：確保 Claude 的 Notion 整合已授予相關頁面的讀寫權限

### Notion 頁面 ID 對照

| 資源 | ID |
|------|-----|
| MEMORY.md | `3264f5ac5c2b812d9990eddaab24169e` |
| 每日日誌 DB | `ed2cb0ab1565439e8bc51b521bf63618` |

> 若有新增任務 DB 或其他 DB，可在對應 skill 中更新 ID，或讓 Claude 透過 `notion-search` 自動找到。

---

## 工作原則

- **所有輸出使用繁體中文**
- **MEMORY.md 是最高優先的上下文來源**，每次對話自動載入
- **一份資料只存一次**：Notion 設計遵循 notion-db-principles skill 的規範
- **自然語言輸入**：所有 Notion 資料透過與 Claude 的對話維護，無需手動操作介面
