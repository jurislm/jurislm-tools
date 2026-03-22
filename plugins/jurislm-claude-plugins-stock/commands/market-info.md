---
name: market-info
description: 市場資訊整理：大盤走勢、法人動態、產業表現、國際市場一覽
---

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../CONNECTORS.md).

# 市場資訊

**重要提示**：本工具提供的分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 使用方式

`/market-info [資訊類型]`

## 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `資訊類型`（可選） | `大盤`、`法人`、`產業`、`國際`、`整體` | 預設為`整體` |

## 工作流程

1. **大盤走勢** — 使用 `get_twse_market_summary` 獲得加權指數、成交量、漲跌幅
2. **法人動態** — 透過 `get_institutional_daily` 查看外資、投信、自營商每日買賣超
3. **融資融券** — 使用 `get_margin_trading` 掌握散戶信心指標變化
4. **產業輪動** — 呼叫 `get_sector_performance` 查看類股漲跌排行與資金流向
5. **期貨籌碼** — 使用 `get_futures_oi` 分析外資台指期多空未平倉
6. **國際市場** — 透過 `get_us_market_quote` 回顧美股、美債與匯率動向
7. **整合報告** — 綜合以上數據判斷市場熱點與風險信號

## 範例

```
/market-info
→ 完整市場資訊：大盤 + 法人 + 產業 + 國際

/market-info 大盤
→ 只顯示加權指數、成交量、漲跌幅

/market-info 法人
→ 三大法人每日買賣超與持股異動

/market-info 產業
→ 類股漲跌排行與資金輪動方向

/market-info 國際
→ 美股、美債、匯率與原物料回顧
```

## 關連技能

**market-info** — 市場資訊整理技能
- 盤勢快照與法人動態
- 產業鏈輪動追蹤
- 國際市場回顧
