---
name: memory-context
description: >
  This skill should be used automatically at the start of every conversation to load Terry Chen's
  MEMORY.md context and recent daily logs from Notion. Triggers include: session start, "載入記憶",
  "讀取 MEMORY", "你還記得嗎", "上次我們談到", "同步上下文", or any time the user asks Claude to
  recall previous context, past decisions, or ongoing projects.
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

在每次對話開始時，自動執行以下步驟以建立完整的工作上下文。

## 步驟一：讀取 MEMORY.md

使用 Notion MCP 讀取 MEMORY.md 頁面內容：
- 頁面 ID：`3264f5ac5c2b812d9990eddaab24169e`
- 使用 `notion-fetch` 工具抓取該頁面的完整內容
- 將內容解析並在腦海中整理成結構化資訊

MEMORY.md 通常包含以下區塊，讀取後請記住：
- **進行中的專案**（JurisLM 及其他）
- **重要決策與背景**
- **待追蹤事項**
- **個人偏好與工作習慣**

## 步驟二：讀取今日與昨日每日日誌

使用 Notion MCP 查詢每日日誌 DB：
- DB ID：`ed2cb0ab1565439e8bc51b521bf63618`
- 篩選條件：日期為今日（`YYYY-MM-DD`）或昨日
- 若有記錄，讀取其完整內容

從每日日誌中提取：
- 昨日完成事項
- 昨日習慣完成情況（運動/閱讀/冥想）
- 未完成的任務或遺留問題
- 任何需要今日跟進的事項

## 步驟三：整合上下文並靜默就緒

- 將 MEMORY.md 和日誌資訊整合成完整的工作上下文
- **不要主動列出所有內容**，除非用戶詢問
- 保持對話的自然流暢，僅在相關時引用記憶中的資訊
- 若發現重要待辦或未解決問題，可以簡短提醒用戶

## 注意事項

- 所有輸出使用繁體中文
- 若 Notion 頁面無法讀取，告知用戶並繼續對話
- MEMORY.md 是最高優先級的上下文來源
- 每日日誌是輔助性的近期上下文

參考詳細資料：`references/memory-structure.md`
