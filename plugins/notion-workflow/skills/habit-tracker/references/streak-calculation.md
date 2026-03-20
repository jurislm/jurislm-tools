# 連續天數（Streak）計算詳細邏輯

## 基本定義

**Current Streak**：從最近一次完成到今日（或昨日，若今日未記錄）的連續完成天數。

**Longest Streak（可選）**：歷史上最長的連續天數，若需要可從 DB 全量計算。

## 偽代碼

```python
def calculate_streak(records, habit_field, today):
    """
    records: 依日期降序排列的日誌列表
    habit_field: 'exercise' | 'reading' | 'meditation'
    today: 今日日期
    """
    streak = 0

    # 若今日有記錄且已完成，從今日開始
    # 若今日有記錄但未完成，streak = 0
    # 若今日無記錄，從昨日開始（不懲罰尚未到結束的今日）

    start_date = today
    today_record = find_record(records, today)

    if today_record:
        if today_record[habit_field] == True:
            streak = 1
            start_date = today - 1 day
        else:
            return 0  # 今日已記錄但未完成，streak = 0
    else:
        start_date = today - 1 day  # 今日尚未記錄，從昨日起算

    # 往回追溯
    current_date = start_date
    while True:
        record = find_record(records, current_date)
        if record and record[habit_field] == True:
            streak += 1
            current_date -= 1 day
        else:
            break  # 未找到記錄或未完成，停止

    return streak
```

## Notion MCP 查詢範例

```json
{
  "database_id": "ed2cb0ab1565439e8bc51b521bf63618",
  "filter": {
    "property": "日期",
    "date": {
      "on_or_after": "30天前的日期"
    }
  },
  "sorts": [
    {
      "property": "日期",
      "direction": "descending"
    }
  ]
}
```

## 欄位映射

從 Notion 讀取時，習慣欄位通常是 Checkbox 類型：
- `習慣-運動` 或 `運動` → `properties.運動.checkbox`
- `習慣-閱讀` 或 `閱讀` → `properties.閱讀.checkbox`
- `習慣-冥想` 或 `冥想` → `properties.冥想.checkbox`

實際欄位名稱依 DB 設定而定，讀取時先確認欄位名稱。
