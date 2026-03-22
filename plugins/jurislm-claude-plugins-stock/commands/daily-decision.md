---
name: daily-decision
description: 盤後一站式分析：盤勢、持股歸因、損益更新、明日展望、行動清單
---

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../CONNECTORS.md).

# 每日操作決策

**重要提示**：本工具提供的分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 使用方式

`/daily-decision [分析日期]`

## 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `分析日期`（可選） | 欲分析的交易日（YYYYMMDD）或相對日期 | `20260318`、`今天`、`昨天` |

## 工作流程

1. **大盤快照** — 使用 `get_twse_market_summary` 取得大盤漲跌與成交量
2. **持股檢視** — 查詢每檔持股的即時報價（`get_stock_quote`）與漲跌歸因
3. **法人動態** — 透過 `get_institutional_daily` 查看三大法人每日買賣超
4. **損益計算** — 計算當日浮動損益與累計損益
5. **技術研判** — 使用 `calculate_technical_indicators` 分析各持股的技術訊號
6. **明日展望** — 整合國際市場（`get_us_market_quote`）與期貨籌碼（`get_futures_oi`）預判開盤方向
7. **行動清單** — 提出明日買賣建議與停損停利提醒

## 範例

```
/daily-decision
→ 今日盤勢快照 + 持股漲跌歸因 + 明日展望 + 行動清單

/daily-decision 昨天
→ 查看昨日盤後分析

/daily-decision 20260317
→ 查看指定交易日的盤後報告
```

## 關連技能

**daily-decision** — 每日整合決策技能
- 持股漲跌歸因分析
- FIFO 逐筆損益更新
- 明日操作建議
