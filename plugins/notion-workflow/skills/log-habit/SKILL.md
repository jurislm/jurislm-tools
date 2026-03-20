---
name: log-habit
description: >
  Use this skill when the user invokes "/notion-workflow:log-habit" or says "記錄今日習慣",
  "更新習慣", "今天運動了", "今天有閱讀", "今天冥想了", or provides any combination of
  today's habit completion status (exercise, reading, meditation).
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

記錄 Terry Chen 今日的習慣完成情況到 Notion 每日日誌 DB。

## 使用方式

```
/notion-workflow:log-habit 運動✅ 閱讀✅ 冥想❌
/notion-workflow:log-habit 運動 閱讀
/notion-workflow:log-habit 全部完成
```

也接受自然語言輸入，例如：
- 「今天運動和閱讀都做了，冥想沒做」
- 「三個都完成」
- 「只做了冥想」

## 解析輸入

從用戶輸入中解析三個習慣的完成狀態：

| 輸入關鍵字 | 解析為完成（✅） |
|-----------|---------------|
| 運動、exercise、跑步、健身、走路 | 運動 ✅ |
| 閱讀、reading、看書、讀書 | 閱讀 ✅ |
| 冥想、meditation、靜坐、正念 | 冥想 ✅ |
| 「全部」、「都做了」、「三個都」 | 全部 ✅ |
| 「都沒」、「沒做」（未提及） | 未提及的項目 = ❌ |

**若輸入不清楚，詢問確認後再寫入。**

## 步驟一：查詢今日日誌是否已存在

使用 Notion MCP 查詢今日日誌：
- DB ID：`ed2cb0ab1565439e8bc51b521bf63618`
- 篩選：日期 = 今日（台灣時區 UTC+8）

## 步驟二A：若今日日誌已存在 → 更新

使用 `notion-update-page` 更新習慣欄位：
- 將解析出的習慣完成狀態寫入對應 Checkbox 欄位
- 保留頁面中其他已有的欄位內容（不覆蓋今日完成/明日計畫等）

## 步驟二B：若今日日誌不存在 → 新增

使用 `notion-create-pages` 建立今日日誌：
- 父頁面/DB：`ed2cb0ab1565439e8bc51b521bf63618`
- 標題：今日日期（格式：`YYYY-MM-DD`）
- 設定習慣 Checkbox 欄位

## 步驟三：計算並回報 Streak

寫入後，自動計算三項習慣的當前連續天數（調用 habit-tracker skill 邏輯），並回報：

```
✅ 習慣已記錄！（YYYY-MM-DD）

運動  ✅  🔥 連續 X 天
閱讀  ✅  🔥 連續 X 天
冥想  ❌  連續 0 天（上次：X 天）
```

## 注意事項

- 時區：台灣 UTC+8
- 寫入前先確認解析是否正確，若有歧義先詢問
- 所有回覆使用繁體中文
