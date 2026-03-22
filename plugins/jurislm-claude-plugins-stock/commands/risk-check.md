---
name: risk-check
description: 全持股風險掃描：五維度風險評估、綜合評分、預警建議
---

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../CONNECTORS.md).

# 風險監控

**重要提示**：本工具提供的分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 使用方式

`/risk-check [風險類型]`

## 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `風險類型`（可選） | `基本面`、`技術面`、`籌碼面`、`流動性`、`整體` | 預設為`整體` |

## 工作流程

1. **基本面風險** — 使用 `get_financials` 檢視毛利率、ROE、負債比是否惡化
2. **技術面風險** — 透過 `calculate_technical_indicators` 分析技術指標是否出現賣出訊號
3. **籌碼面風險** — 使用 `get_institutional_trading` 檢視法人是否快速逃出
4. **流動性風險** — 透過 `get_stock_quote` 檢查成交量與買賣價差擴大
5. **股本風險** — 監控現金股利與配股配息是否大幅衰退
6. **綜合評分** — 五維度風險加權計算，給出 0-100 的風險評分
7. **預警建議** — 對高風險持股提出停損或加碼建議

## 範例

```
/risk-check
→ 全持股五維度風險掃描 + 綜合評分 + 預警清單

/risk-check 基本面
→ 只檢查基本面風險（毛利率、ROE、負債比）

/risk-check 技術面
→ 技術指標風險：KD 超買、MACD 死叉、跌破支撐

/risk-check 籌碼面
→ 法人持股異動、融券增加、大宗交易偵測

/risk-check 整體
→ 完整風險評估與停損建議
```

## 關連技能

**risk-monitor** — 風險監控預警技能
- 五維度風險評估
- 綜合風險評分
- 停損停利提醒
- 持股健康度檢查
