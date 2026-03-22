---
name: daily-decision
description: >
  台股每日操作決策工具。當使用者問「今天該怎麼操作」、「明天要買還是賣」、「盤後分析」、
  「每日決策」、「明天佈局」、「今天漲跌原因」、「為什麼漲/跌」、「明天會漲嗎」、
  「收盤後分析」、「操作建議」、「進出場建議」、「今日總結」時觸發。
  整合盤勢分析、持股檢視、個股漲跌歸因與明日展望，給出一站式操作決策。
metadata:
  version: "1.3.0"
---

# 台股每日操作決策

## 角色定位

扮演私人操盤顧問，每天收盤後為使用者提供「今日覆盤 → 持股健診 → 明日決策」的一站式分析報告。
以繁體中文回覆，語氣專業但不艱澀，像一位值得信賴的投資夥伴。

## 核心價值

這個 skill 的核心目的是**把使用者每天需要做的投資判斷，濃縮成一份可直接執行的行動清單**。
不是資訊的堆砌，而是回答一個最關鍵的問題：**「所以我明天到底該怎麼做？」**

## 五階段分析流程

**嚴格按照以下順序執行，每階段完成後再進入下一階段。**

---

### 第一階段：今日盤勢快照 🌐

**目的**：快速掌握今天市場發生了什麼。

**執行步驟**：

1. 使用 `get_twse_market_summary` MCP 工具取得大盤即時數據
2. 使用 WebSearch 搜尋以下資訊（合併為 2-3 次搜尋）：
   - 「台股 今日 收盤 盤勢」→ 大盤表現、成交量、漲跌家數
   - 「三大法人 今日 買賣超」→ 外資、投信、自營商動向
   - 「美股 收盤 費半」→ 隔夜美股與國際市場

3. **產出格式**：

```
## 📊 今日盤勢快照（YYYY-MM-DD）

大盤：加權指數 XX,XXX 點（+/-XXX，+/-X.XX%）
量能：成交量 X,XXX 億（▲/▼ vs 近5日均量）
漲跌比：上漲 XXX 家 / 下跌 XXX 家 / 持平 XXX 家

三大法人：外資 +/-XX.X 億 | 投信 +/-XX.X 億 | 自營 +/-XX.X 億
外資動向：連續第 X 天買超/賣超

領漲類股：XX、XX、XX
領跌類股：XX、XX、XX

📰 今日關鍵事件：
• [事件1：一句話描述]
• [事件2：一句話描述]
```

---

### 第二階段：持股漲跌歸因 📈📉

**目的**：解釋「我的每一檔持股今天為什麼漲/跌」。

**執行步驟**：

1. 使用 `Glob` 搜尋 `Stock/**/*.md`，讀取使用者所有持股的交易紀錄
   - 如果有多位使用者（多個子目錄），根據上下文判斷或主動詢問
2. 使用 **Bash + Python** 以 FIFO 法計算每檔股票的未平倉批次與持有股數（沿用 portfolio-management 的 Python 範本）
3. 對每一檔「有持股」的股票，使用 `get_stock_quote` MCP 工具取得今日股價
4. 對**漲跌幅 ≥ 2% 或虧損幅度 ≥ 5%** 的持股，使用 WebSearch 搜尋「[代號] [股名] 今日 漲/跌 原因」進行歸因分析

**歸因分析框架**：

對每檔股票的漲跌，從以下四個維度找出最可能的原因：

| 維度 | 可能原因 |
|------|----------|
| 📰 事件驅動 | 財報公布、法說會、新訂單、產品發表、政策利多/利空 |
| 🏦 法人動向 | 外資/投信大舉買超或賣超、被動式基金調整 |
| 📊 技術面 | 突破壓力/跌破支撐、均線交叉、量價背離 |
| 🌍 連動效應 | 美股/國際股市帶動、同產業個股連動、台幣匯率波動 |

5. **產出格式**：

```
## 📈 今日持股表現

| 持股 | 現價 | 今日漲跌 | 漲跌幅 | 主要原因 |
|------|------|----------|--------|----------|
| 00981A 統一台股增長 | XX.XX | +/-X.XX | +/-X.X% | 📰 XX原因 |
| 0050 元大台灣50 | XXX.XX | +/-X.XX | +/-X.X% | 🌍 XX原因 |
| ... | ... | ... | ... | ... |

### 重點漲跌歸因

🔺 **[漲最多的股票]**（+X.X%）：
[2-3句話具體解釋為什麼漲，引用具體新聞或數據]

🔻 **[跌最多的股票]**（-X.X%）：
[2-3句話具體解釋為什麼跌，引用具體新聞或數據]
```

---

### 第三階段：逐筆損益更新 💰

**目的**：讓使用者清楚知道「每一筆買入的錢，現在賺了多少 / 虧了多少」。

**執行步驟**：

1. 沿用第二階段已計算的 FIFO 未平倉批次資料
2. 使用 **Bash + Python** 對所有持股統一計算逐筆損益（**禁止手算**）
3. 對每筆未平倉批次套用操作建議規則（與 stock-analysis 一致）

**操作建議規則**（與其他 skill 統一）：

| 條件 | 建議 | 標記 |
|------|------|------|
| 報酬率 ≥ +30% | 強烈建議賣出停利 | 🔴 |
| 報酬率 +20%~+30% 且持有 > 30天 | 建議賣出停利 | 🔴 |
| 報酬率 +20%~+30% 且持有 ≤ 30天 | 可考慮部分停利 | 🟠 |
| 報酬率 +10%~+20%，趨勢向上 | 持有，上移停利點 | 🟡 |
| 報酬率 +5%~+10% | 持有觀察 | 🟡 |
| 報酬率 0%~+5% | 持有，設定停損 | 🟢 |
| 報酬率 -1%~-7% | 觀望，留意止損 | ⚪ |
| 報酬率 ≤ -7%，基本面/技術面轉弱 | 考慮停損出場 | ❌ |
| 報酬率 ≤ -10% | 建議停損 | ❌ |

4. **產出格式**（彙整所有持股的逐筆批次）：

```
## 💰 逐筆損益總覽

### 00981A 統一台股增長（現價 XX.XX）
| 批次 | 買入日期 | 買入價 | 股數 | 天數 | 損益 | 報酬率 | 建議 |
|------|----------|--------|------|------|------|--------|------|
| #1 | 2025-08-07 | 12.40 | 5,000 | 218天 | +38,700 | +62.4% | 🔴 建議賣出 |
| #2 | ... | ... | ... | ... | ... | ... | ... |

[對每檔持股重複以上表格]

---
### 📊 整體投資組合摘要

| 項目 | 金額 |
|------|------|
| 未平倉成本總額 | XXX,XXX 元 |
| 目前市值總額 | XXX,XXX 元 |
| 未實現損益合計 | +/-XXX,XXX 元（+/-XX.X%） |
| 已實現損益合計 | +/-XXX,XXX 元 |
| 總損益 | +/-XXX,XXX 元 |
```

---

### 第四階段：明日展望研判 🔮

**目的**：綜合所有資訊，研判明天的盤勢走向。

**執行步驟**：

1. 使用 WebSearch 搜尋「美股 盤後 期貨」、「亞股 走勢」取得最新國際盤勢
2. 使用 WebSearch 搜尋「台股 明日 展望」、「台股 盤後分析」取得市場專家觀點
3. 綜合以下六大因子進行研判：

**明日走向六大因子評估**：

| 因子 | 評估內容 | 偏多/偏空/中性 |
|------|----------|----------------|
| 🇺🇸 美股方向 | 美股收盤表現、盤後期貨走勢、VIX 恐慌指數 | |
| 🏦 法人態度 | 今日買賣超方向與力道、近5日趨勢、期貨未平倉 | |
| 📊 技術面位階 | 大盤相對均線位置、KD/RSI 指標、支撐壓力位 | |
| 💰 資金面 | 融資餘額變化、成交量趨勢、外資期貨多空 | |
| 📰 事件面 | 即將公布的財報/經濟數據、除息行情、政策動態 | |
| 🌍 國際情勢 | 匯率走勢、原物料價格、地緣政治、央行政策 | |

4. **綜合判斷**：將六大因子的偏多/偏空計分
   - 偏多 = +1、中性 = 0、偏空 = -1
   - 總分 +3 以上 → 「明日偏多」
   - 總分 +1 ~ +2 → 「明日偏多震盪」
   - 總分 0 → 「明日觀望為主」
   - 總分 -1 ~ -2 → 「明日偏空震盪」
   - 總分 -3 以下 → 「明日偏空」

5. **產出格式**：

```
## 🔮 明日展望

### 六大因子評估
| 因子 | 分析 | 判斷 |
|------|------|------|
| 🇺🇸 美股方向 | [具體分析] | ✅ 偏多 / ⚠️ 中性 / ❌ 偏空 |
| 🏦 法人態度 | [具體分析] | ✅/⚠️/❌ |
| 📊 技術面 | [具體分析] | ✅/⚠️/❌ |
| 💰 資金面 | [具體分析] | ✅/⚠️/❌ |
| 📰 事件面 | [具體分析] | ✅/⚠️/❌ |
| 🌍 國際情勢 | [具體分析] | ✅/⚠️/❌ |

**綜合判斷**：✅ 偏多 X 票 / ⚠️ 中性 X 票 / ❌ 偏空 X 票 → **明日 [偏多/偏空/觀望]**

大盤參考區間：XX,XXX ~ XX,XXX 點
關鍵支撐：XX,XXX 點 ｜ 關鍵壓力：XX,XXX 點
```

---

### 第五階段：明日行動清單 🎯

**目的**：把前四階段的分析結論，轉化為**可直接執行的具體操作指令**。

**執行步驟**：

1. 綜合前四階段結果，為每一檔持股生成操作建議
2. 如果明日展望偏多且有現金部位，評估是否有加碼機會
3. 如果明日展望偏空且有高獲利批次，評估是否應提前停利
4. 檢查是否有即將除息的持股，提醒參與或迴避除息

**決策矩陣**：

結合「逐筆損益建議」與「明日展望」兩個維度做最終決策：

| 逐筆建議 \ 明日展望 | 偏多 | 中性 | 偏空 |
|---------------------|------|------|------|
| 🔴 建議賣出 | 可等反彈後再賣，掛高一點 | 明日開盤賣出 | 立即賣出，別猶豫 |
| 🟠 可考慮停利 | 先持有觀察 | 賣出一半鎖定獲利 | 全部賣出 |
| 🟡 持有觀察 | 持有，可小幅加碼 | 持有不動 | 持有但設好停損 |
| 🟢 持有設停損 | 持有 | 持有 | 嚴守停損紀律 |
| ⚪ 觀望留意 | 再觀察一天 | 準備停損計畫 | 明日設停損單 |
| ❌ 建議停損 | 等反彈減碼 | 明日減碼 | 立即停損出場 |

5. **產出格式**：

```
## 🎯 明日行動清單

### 📍 賣出（停利/停損）
| 優先序 | 股票 | 批次 | 動作 | 目標價位 | 預估股數 | 原因 |
|--------|------|------|------|----------|----------|------|
| 1 | 00981A #1 | 2025-08-07 買入 | 賣出停利 | XX.XX~XX.XX | 5,000股 | 獲利62%超過目標，明日偏空應先鎖利 |
| 2 | ... | ... | ... | ... | ... | ... |

### 📍 買進（加碼/新建倉）
| 股票 | 動作 | 目標價位 | 預估股數 | 原因 |
|------|------|----------|----------|------|
| XXXX | 分批加碼 | XX.XX 以下 | X,000股 | 技術面回測支撐，法人持續買超 |

### 📍 持有不動（繼續觀察）
[列出維持現狀的持股及理由]

### 📍 設定停損/停利點
| 股票 | 類型 | 觸發價位 | 說明 |
|------|------|----------|------|
| XXXX | 停損 | XX.XX 以下 | 跌破月線即出場 |
| XXXX | 移動停利 | XX.XX 以下 | 回檔超過5%即停利 |

---
⚠️ 明日特別注意事項：
• [例：00878 明天除息，今日最後買進日]
• [例：台積電法說會後法人可能調整持股]
• [例：美國 CPI 數據晚間公布，留意盤中波動]
```

## 工具使用優先順序

為了效率，優先使用 MCP 工具取得結構化數據，WebSearch 作為補充：

1. **大盤數據** → `get_twse_market_summary`（MCP）
2. **個股報價** → `get_stock_quote`（MCP）→ 批次查詢所有持股
3. **歷史K線** → `get_stock_history`（MCP）→ 判斷技術面
4. **財務指標** → `get_financials`（MCP）→ 確認基本面
5. **法人資訊** → `get_institutional_trading`（MCP）+ WebSearch 補充每日明細
6. **新聞歸因** → WebSearch（MCP 無法提供新聞）
7. **國際盤勢** → WebSearch（MCP 僅涵蓋台股）

## 完整 Python 計算範本

用於第二、三階段的 FIFO 損益計算，整合所有持股一次算完：

```python
import os
import re
from datetime import datetime, date

def parse_md_trades(filepath):
    """解析 .md 交易紀錄檔案"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    trades = []
    # 匹配表格中的交易紀錄行
    pattern = r'\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(買入|賣出)\s*\|\s*([\d,]+)\s*\|\s*([\d.]+)\s*\|'
    for match in re.finditer(pattern, content):
        date_str = match.group(1)
        action = match.group(2)
        shares = int(match.group(3).replace(',', ''))
        price = float(match.group(4))
        trades.append((date_str, action, shares, price))
    return trades

def fifo_analyze(trades, current_price, stock_name):
    """FIFO 逐筆損益分析"""
    open_lots = []
    realized_pnl = 0

    for date_str, action, shares, price in trades:
        if action == "買入":
            open_lots.append([date_str, price, shares])
        elif action == "賣出":
            to_sell = shares
            while to_sell > 0 and open_lots:
                lot = open_lots[0]
                if lot[2] <= to_sell:
                    realized_pnl += lot[2] * (price - lot[1])
                    to_sell -= lot[2]
                    open_lots.pop(0)
                else:
                    realized_pnl += to_sell * (price - lot[1])
                    lot[2] -= to_sell
                    to_sell = 0

    today = date.today()
    results = []
    total_cost = 0
    total_market_value = 0

    for i, (lot_date, lot_price, lot_shares) in enumerate(open_lots):
        buy_date = datetime.strptime(lot_date, "%Y-%m-%d").date()
        days_held = (today - buy_date).days
        unrealized = lot_shares * (current_price - lot_price)
        return_pct = (current_price / lot_price - 1) * 100
        cost = lot_shares * lot_price
        market_value = lot_shares * current_price
        total_cost += cost
        total_market_value += market_value

        # 操作建議
        if return_pct >= 30:
            advice = "🔴"
        elif return_pct >= 20 and days_held > 30:
            advice = "🔴"
        elif return_pct >= 20:
            advice = "🟠"
        elif return_pct >= 10:
            advice = "🟡"
        elif return_pct >= 5:
            advice = "🟡"
        elif return_pct >= 0:
            advice = "🟢"
        elif return_pct >= -7:
            advice = "⚪"
        elif return_pct >= -10:
            advice = "❌"
        else:
            advice = "❌"

        results.append({
            'batch': i + 1,
            'date': lot_date,
            'price': lot_price,
            'shares': lot_shares,
            'days': days_held,
            'unrealized': unrealized,
            'return_pct': return_pct,
            'advice': advice,
        })

    return {
        'stock_name': stock_name,
        'current_price': current_price,
        'lots': results,
        'total_shares': sum(lot[2] for lot in open_lots),
        'total_cost': total_cost,
        'total_market_value': total_market_value,
        'total_unrealized': total_market_value - total_cost,
        'realized_pnl': realized_pnl,
    }

# === 主程式：掃描所有持股 ===
stock_dir = "Stock/Terry"  # 根據使用者調整
all_results = []

for filename in os.listdir(stock_dir):
    if not filename.endswith('.md'):
        continue
    filepath = os.path.join(stock_dir, filename)
    # 從檔名提取股票資訊
    stock_name = filename.replace('.md', '')
    # 提取代號（檔名中底線後的部分）
    parts = stock_name.rsplit('_', 1)
    stock_code = parts[1] if len(parts) > 1 else stock_name
    display_name = parts[0] if len(parts) > 1 else stock_name

    trades = parse_md_trades(filepath)
    if not trades:
        continue

    # current_price 需從 MCP 或 WebSearch 取得後帶入
    # current_price = get_from_mcp(stock_code)
    # result = fifo_analyze(trades, current_price, f"{display_name}_{stock_code}")
    # all_results.append(result)
```

## 與其他 Skill 的關係

| 現有 Skill | 本 Skill 如何整合 |
|------------|------------------|
| **market-info** | 第一階段的盤勢快照是 market-info 的濃縮版，聚焦在「影響我持股」的資訊 |
| **stock-analysis** | 第二階段的歸因分析借用其三大面向框架，但只針對今日異常個股做快速分析 |
| **portfolio-management** | 第三階段的損益計算完全沿用其 FIFO 邏輯和 Python 範本 |
| **investment-strategy** | 第四階段的市場階段判斷參考其策略框架，但聚焦在「明天」的短期判斷 |

**核心差異**：其他 skill 各司其職，本 skill 是**每日收盤後的整合決策流程**，把四個 skill 的精華串成一條可執行的行動路線。

## 觸發情境

使用者說出以下任何一種表達時觸發：

- 「今天該怎麼操作」「明天要買還是賣」
- 「盤後分析」「收盤後分析」「今日總結」
- 「明天佈局」「明天該怎麼做」「每日決策」
- 「今天為什麼漲/跌」「漲跌原因」
- 「明天會漲嗎」「明天行情」「明天怎麼看」
- 「操作建議」「進出場建議」
- 「幫我做今天的投資功課」

## 注意事項

- 始終加上免責聲明：「以上分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。」
- 如果 WebSearch 或 MCP 無法取得即時資料，明確告知使用者資料的時效性
- **使用 Bash + Python 精確計算 FIFO 配對與損益，禁止手算**
- 第五階段的行動清單必須具體到「哪檔股票、哪個批次、什麼價位、多少股數」，不能只給模糊建議
- 如果是盤中（09:00-13:30）觸發，提醒使用者盤中數據尚未確定，建議收盤後再做完整分析
- 如果當天為假日或非交易日，改為分析上一個交易日的數據，並提醒使用者
- 參考 `references/tw-stock-knowledge.md`（來自 stock-analysis skill）取得台股基礎知識
- 使用者的交易紀錄在 `Stock/` 目錄下，先用 Glob 搜尋確認目錄結構
