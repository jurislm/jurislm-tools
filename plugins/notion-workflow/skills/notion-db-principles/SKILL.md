---
name: notion-db-principles
description: >
  This skill should be used when designing, creating, or modifying Notion databases for Terry Chen.
  Triggers include: "建立 Notion DB", "設計資料庫", "新增欄位", "Notion 架構", "應該用 DB 嗎",
  "is_inline 怎麼設定", "側邊欄結構", "Notion 設計原則", or any question about how to structure
  data in Notion workspace.
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

在設計或修改 Terry Chen 的 Notion 工作區結構時，嚴格遵守以下設計原則。

## 核心原則一：凡持續新增就用 DB

判斷是否應建立 Database：
- **使用 DB**：習慣記錄、任務列表、每日日誌、閱讀書單、專案追蹤、任何會持續新增條目的資料
- **使用 Page**：一次性文件、MEMORY.md、設計規範、參考資料等靜態內容
- **判斷問句**：「這份資料未來會繼續新增嗎？」→ 是 → 用 DB

## 核心原則二：一份資料只存一次

避免資料重複：
- 不在多個地方維護相同資訊
- 若需要在不同地方顯示同一資料，使用 **Relation** 或 **Rollup** 而非複製
- MEMORY.md 是唯一的持久記憶來源，不在其他頁面重複存放相同內容
- 每日日誌 DB 是唯一的日誌來源

## 核心原則三：is_inline 控制顯示方式

建立 DB 時，根據用途設定 `is_inline`：

| 設定 | 效果 | 適用場景 |
|------|------|---------|
| `is_inline: true` | DB 嵌入頁面中顯示 | 作為頁面的一部分，與其他內容並排 |
| `is_inline: false` | DB 以完整頁面顯示 | 獨立的資料庫頁面，需要全版檢視 |

建立 DB 時透過 `notion-create-database` 的 `is_inline` 參數控制。

## 核心原則四：側邊欄是頁面結構的鏡像

Notion 側邊欄規則：
- 側邊欄的層級結構應反映實際工作區的邏輯層級
- 頂層放置：工作區總覽、MEMORY.md、重要 Hub 頁面
- 次層放置：各功能 DB（習慣、任務、日誌）
- 避免過深的層級（最多 3 層）
- 常用頁面釘選到 Favorites

## DB 設計最佳實踐

### 欄位設計
- 使用 **Title** 作為主要識別欄位（簡短、有意義）
- **Date** 欄位：日誌類 DB 必備
- **Select/Multi-select**：分類用，選項不超過 10 個
- **Checkbox**：二元狀態（完成/未完成）
- **Relation**：連結相關 DB，避免重複資料

### 視圖設計
- 每個 DB 至少建立一個有意義的 Filter View
- 習慣 DB：以本週/本月為 Filter
- 任務 DB：以「未完成」為預設 Filter
- 日誌 DB：以日期降序排列

詳細設計範例：`references/db-design-examples.md`
