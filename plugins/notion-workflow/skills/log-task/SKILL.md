---
name: log-task
description: >
  Use this skill when the user invokes "/notion-workflow:log-task" or says "新增任務",
  "加一個 task", "記錄待辦", "我要做", "新增一件事", "幫我記下來", or describes something
  they need to do that should be tracked in the Notion task database.
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

將新任務新增到 Terry Chen 的 Notion 任務 DB。

## 使用方式

```
/notion-workflow:log-task 任務名稱 [優先級] [截止日期] [專案]
/notion-workflow:log-task 完成 JurisLM API 文件 高 2026-03-20
/notion-workflow:log-task 預約牙醫
```

也接受自然語言輸入：
- 「新增一個任務：高優先的 JurisLM 融資計畫，本週五前完成」
- 「記一下：要 review 合約，低優先」
- 「幫我加：明天要回 email 給 Brian」

## 解析輸入

從用戶輸入中提取：

| 欄位 | 提取方式 | 預設值 |
|------|---------|-------|
| 任務名稱（Title）| 必填，主要描述 | 無（必須提供）|
| 優先級 | 高/中/低，或 high/medium/low | 中 |
| 截止日期 | 日期或相對時間（今天/明天/本週五）| 無 |
| 專案 | 若提及專案名稱（如 JurisLM）| 無 |
| 備註 | 額外說明 | 無 |

**若任務名稱不清楚，詢問後再新增。**

## 日期解析

相對日期轉換（以台灣時區 UTC+8 為基準）：
- 「今天」→ 今日日期
- 「明天」→ 明日日期
- 「本週五」→ 本週五日期
- 「下週一」→ 下週一日期
- 「月底」→ 本月最後一天

## 步驟：使用 Notion MCP 新增任務

使用 `notion-create-pages` 在任務 DB 新增一筆記錄。

若任務 DB 尚不確定 ID，先使用 `notion-search` 搜尋名稱含「任務」的 DB。

新增欄位：
```json
{
  "parent": {"database_id": "任務DB的ID"},
  "properties": {
    "任務名稱": {"title": [{"text": {"content": "任務名稱"}}]},
    "狀態": {"select": {"name": "待開始"}},
    "優先級": {"select": {"name": "高/中/低"}},
    "截止日期": {"date": {"start": "YYYY-MM-DD"}},
    "專案": {"select": {"name": "專案名稱"}}
  }
}
```

## 回報格式

```
✅ 任務已新增！

📌 任務名稱
   優先級：高  |  截止：2026-03-20  |  專案：JurisLM
   狀態：待開始
```

## 注意事項

- 若不確定任務 DB 的 ID，先用 notion-search 工具找到正確的 DB
- 欄位名稱依實際 DB 設定調整
- 所有回覆使用繁體中文
- 新增後確認是否要繼續新增其他任務
