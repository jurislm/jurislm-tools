---
name: stock-analysis
description: 個股完整分析：基本面、技術面、籌碼面一次掌握
---

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../CONNECTORS.md).

# 個股分析

**重要提示**：本工具提供的分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 使用方式

`/stock-analysis <股票代號或名稱> [分析類型]`

## 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `股票代號或名稱` | 台股代號（4 碼）或股票名稱 | `2330`、`台積電`、`0050` |
| `分析類型`（可選） | `基本面`、`技術面`、`籌碼面`、`完整` | 預設為`完整` |

## 工作流程

1. **取得股價數據** — 透過 `get_stock_quote` 獲得即時報價與基本指標（PE、PB、殖利率）
2. **財務分析** — 使用 `get_financials` 整理毛利率、ROE、EPS、配息紀錄
3. **技術分析** — 呼叫 `calculate_technical_indicators` 計算 KD、MACD、RSI、布林通道、均線排列
4. **籌碼分析** — 透過 `get_institutional_trading` 查看法人持股與交易動向
5. **月營收追蹤** — 使用 `get_monthly_revenue` 查看近期營收成長趨勢
6. **綜合評估** — 整合上述數據給出買賣建議與風險提示

## 範例

```
/stock-analysis 2330
→ 台積電完整分析：基本面亮點、技術面訊號、籌碼面法人動向

/stock-analysis 台積電 技術面
→ 只顯示技術指標與圖表分析

/stock-analysis 0050 基本面
→ 元大台灣50基金基本面解讀
```

## 關連技能

**stock-analysis** — 個股分析技能
- 支援 ETF 分析與 FIFO 逐筆損益追蹤
