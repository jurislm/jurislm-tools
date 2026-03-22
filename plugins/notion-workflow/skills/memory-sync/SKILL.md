---
name: memory-sync
description: >
  Use this skill when the user invokes "/notion-workflow:memory-sync" or says "同步記憶",
  "讀取 MEMORY", "你還記得什麼", "重新載入上下文", "刷新記憶", "載入 MEMORY.md",
  "context 同步", or wants Claude to explicitly re-read and summarize current working context
  from Notion MEMORY.md.
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

快速從 Notion 讀取 MEMORY.md，重新建立完整的工作上下文，並向用戶摘要當前狀態。

## 與 memory-context skill 的差異

- `memory-context`：對話開始時自動靜默執行，不主動輸出摘要
- `memory-sync`（本 skill）：用戶主動觸發，執行後輸出可見的上下文摘要

## 步驟一：讀取 MEMORY.md

使用 Notion MCP 讀取頁面：
- 頁面 ID：`3264f5ac5c2b812d9990eddaab24169e`
- 使用 `notion-fetch` 取得完整頁面內容

## 步驟二：讀取最近日誌

讀取最近 3 天的每日日誌：
- DB ID：`ed2cb0ab1565439e8bc51b521bf63618`
- 篩選：最近 3 天
- 排序：日期降序

## 步驟三：輸出上下文摘要

以結構化格式呈現當前上下文：

```
🧠 MEMORY 同步完成（YYYY-MM-DD HH:MM）

## 進行中的專案
[列出 MEMORY.md 中的進行中專案，每項一行]

## 待追蹤事項
[列出未完成的追蹤項目]

## 近期動態（最近 3 天）
- YYYY-MM-DD：[今日/昨日日誌摘要]
- YYYY-MM-DD：[前日日誌摘要]

## 習慣連續天數
運動 🔥X天 | 閱讀 🔥X天 | 冥想 🔥X天

---
✅ 上下文已載入，可以繼續工作。
```

## 步驟四：等待用戶指示

輸出摘要後，等待用戶的下一步指令，不主動提出建議（除非 MEMORY.md 中有明確的「下一步」記錄）。

## 注意事項

- 若 MEMORY.md 無法讀取，告知用戶並說明可能原因（網路/權限問題）
- 日誌讀取失敗不影響 MEMORY.md 的載入
- 輸出摘要後，記憶已在上下文中，後續對話直接使用，不需重複讀取
- 所有輸出使用繁體中文
