---
name: pre-market
description: 盤前快速報告：國際市場回顧、期貨籌碼、持股檢視、開盤建議
---

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../CONNECTORS.md).

# 盤前分析

**重要提示**：本工具提供的分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 使用方式

`/pre-market [分析日期]`

## 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `分析日期`（可選） | 欲分析的開盤日（YYYYMMDD）或相對日期 | `20260319`、`明天`、`今天` |

## 工作流程

1. **國際市場回顧** — 使用 `get_us_market_quote` 檢視 S&P500、NASDAQ、道瓊昨日表現
2. **美債與匯率** — 透過 `get_exchange_rate` 查看美元指數、日圓、人民幣兌台幣
3. **期貨籌碼研判** — 使用 `get_futures_oi` 分析外資台指期多空、選擇權 Put/Call Ratio
4. **持股健康檢查** — 透過 `get_stock_quote` 查詢各持股財務狀況與風險信號
5. **原物料動向** — 使用 `get_commodity_quote` 查看黃金、原油、銅價走勢
6. **融資餘額** — 透過 `get_margin_trading` 掌握散戶信心是否反轉
7. **開盤預判** — 綜合以上數據預判開盤方向與操作建議

## 範例

```
/pre-market
→ 今日開盤前完整分析：國際市場 + 期貨籌碼 + 持股檢視 + 開盤建議

/pre-market 明天
→ 明日開盤前的盤前分析

/pre-market 20260320
→ 查看指定日期的開盤前報告
```

## 關連技能

**pre-market-analysis** — 盤前分析技能
- 國際市場與期貨籌碼整合
- 持股風險檢查
- 開盤操作建議
