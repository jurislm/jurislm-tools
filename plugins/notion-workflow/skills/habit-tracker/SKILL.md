---
name: habit-tracker
description: >
  This skill should be used when querying, calculating, or displaying habit tracking data for
  Terry Chen. Triggers include: "習慣統計", "連續幾天了", "我的習慣紀錄", "運動連續天數",
  "閱讀連續天數", "冥想連續天數", "本週習慣", "習慣完成率", "streak", or any request to
  review or analyze habit completion history.
metadata:
  version: "1.1.1"
  author: "Terry Chen"
---

查詢並分析 Terry Chen 的習慣追蹤數據，計算連續天數（streak）並呈現完成統計。

## 追蹤的習慣

三項核心習慣：
1. **運動**（Exercise）
2. **閱讀**（Reading）
3. **冥想**（Meditation）

## 步驟一：讀取習慣資料

從每日日誌 DB 讀取習慣數據：
- DB ID：`ed2cb0ab1565439e8bc51b521bf63618`
- 使用 Notion MCP 查詢最近 30 天的記錄
- 篩選條件：日期範圍 = 今日往前 30 天
- 排序：日期降序

## 步驟二：計算連續天數（Streak）

**連續天數計算邏輯：**

```
從今日（或昨日，若今日尚未記錄）開始往回數
只要連續每天都有 ✅（Checkbox = true），streak +1
一旦遇到 ❌ 或空白，停止計算

例：
今日 ✅ → 昨日 ✅ → 前天 ✅ → 大前天 ❌
→ Streak = 3 天
```

**特殊情況處理：**
- 若今日尚未記錄（日誌不存在），從昨日開始計算 current streak
- 若今日已記錄，從今日開始計算
- 空白記錄（日誌存在但習慣欄位為空）視為未完成（❌）

## 步驟三：計算完成率

計算以下維度的完成率：
- 本週（週一到今日）：已完成天數 / 本週已過天數
- 本月：已完成天數 / 本月已過天數
- 最近 7 天：已完成天數 / 7

## 步驟四：輸出格式

以清晰的格式呈現結果：

```
📊 習慣統計（截至 YYYY-MM-DD）

           運動    閱讀    冥想
🔥 連續天數  X 天   X 天   X 天
📅 本週完成  X/X   X/X   X/X
📆 本月完成  X/X   X/X   X/X

✅ 今日狀態：運動 ✅  閱讀 ❌  冥想 ✅
```

## 注意事項

- 所有輸出使用繁體中文
- 若某天的日誌完全不存在（非記錄為未完成），也視為 streak 中斷
- 計算時以台灣時區（UTC+8）為準

詳細計算邏輯：`references/streak-calculation.md`
