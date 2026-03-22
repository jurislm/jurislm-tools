# Notion DB 設計範例

## 習慣追蹤 DB 結構

```
DB 名稱：習慣記錄
is_inline：false（獨立頁面，方便全版瀏覽）

欄位：
- 日期（Date）：主要識別，Title 可設為自動日期
- 運動（Checkbox）
- 閱讀（Checkbox）
- 冥想（Checkbox）
- 連續天數-運動（Formula 或手動 Number）
- 備註（Text）

視圖：
- 預設：Table，依日期降序
- 本週：Filter 日期 = 本週
- 統計：Gallery 或 Board 按月份
```

## 任務 DB 結構

```
DB 名稱：任務
is_inline：true（可嵌入日誌或 Hub 頁面）

欄位：
- 任務名稱（Title）
- 狀態（Select：待開始/進行中/完成/暫停）
- 優先級（Select：高/中/低）
- 專案（Select 或 Relation 至專案 DB）
- 截止日期（Date）
- 建立日期（Created Time）

視圖：
- 預設：Table，Filter 狀態 ≠ 完成
- 今日：Filter 截止日期 = 今日
- 看板：Board 按狀態分組
```

## 每日日誌 DB 結構

```
DB ID：ed2cb0ab1565439e8bc51b521bf63618
is_inline：false（獨立完整頁面）

欄位：
- 日期（Title 或 Date）
- 今日完成（Text）
- 明日計畫（Text）
- 習慣-運動（Checkbox）
- 習慣-閱讀（Checkbox）
- 習慣-冥想（Checkbox）
- 心情/能量（Select：高能/普通/疲憊）
- 備註（Text）

視圖：
- 預設：Table，依日期降序
- 本週：Filter 日期 = 本週
```

## 關聯設計範例

日誌 → 任務（Relation）：
```
每日日誌中可 Relation 到任務 DB，
記錄「今日處理的任務」，避免在日誌中重複輸入任務名稱
```
