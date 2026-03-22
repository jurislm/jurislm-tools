# MEMORY.md 結構說明

## 頁面位置
- Notion 頁面 ID：`3264f5ac5c2b812d9990eddaab24169e`
- URL：https://www.notion.so/3264f5ac5c2b812d9990eddaab24169e

## 預期結構

MEMORY.md 是 Claude 與 Terry Chen 之間的持久記憶橋樑，記錄所有跨對話需要保留的重要資訊。

### 典型區塊

```
## 🧠 進行中的專案
- JurisLM：[當前狀態、下一步]
- 其他專案...

## 📌 重要決策
- [日期] [決策內容]

## 🔁 待追蹤
- [ ] 未完成項目

## 👤 個人資訊
- 角色：JurisLM 創辦人
- 語言偏好：繁體中文
- 工作風格：[偏好]

## 🗓️ 最後更新
- 更新日期：YYYY-MM-DD
```

## 每日日誌 DB 位置
- DB ID：`ed2cb0ab1565439e8bc51b521bf63618`
- URL：https://www.notion.so/ed2cb0ab1565439e8bc51b521bf63618

## 每日日誌欄位結構

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| 日期 | Date | 該日誌的日期（標題或 Date 屬性）|
| 今日完成 | Text/Rich Text | 當天完成的事項 |
| 明日計畫 | Text/Rich Text | 預計明日要做的事 |
| 習慣-運動 | Checkbox | 是否完成運動 |
| 習慣-閱讀 | Checkbox | 是否完成閱讀 |
| 習慣-冥想 | Checkbox | 是否完成冥想 |
| 心情/能量 | Select | 當日狀態 |
| 備註 | Text | 其他雜記 |

> 注意：實際欄位名稱可能略有不同，讀取時依實際 DB 結構調整。
