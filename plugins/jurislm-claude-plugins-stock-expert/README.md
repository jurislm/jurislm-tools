# Stock Expert Plugin

台股投資專家 AI 助手，提供個股分析、每日操作決策、投資策略、組合管理與市場資訊整理。

## 功能

### 每日操作決策 (daily-decision)
收盤後一站式分析：今日盤勢快照 → 持股漲跌歸因 → 逐筆損益更新 → 明日展望研判 → 行動清單。

**觸發方式**：「今天該怎麼操作」、「明天要買還是賣」、「盤後分析」、「明天佈局」、「漲跌原因」

### 個股分析 (stock-analysis)
輸入股票代號或名稱，獲得基本面、技術面、籌碼面的完整分析，包含 ETF 分析與 FIFO 逐筆損益追蹤。

**觸發方式**：「分析 2330」、「台積電可以買嗎」、「0050 ETF 分析」

### 投資策略 (investment-strategy)
根據目前市場狀況提供選股策略、進出場時機建議。

**觸發方式**：「現在適合進場嗎」、「選股策略」、「存股推薦」

### 投資組合管理 (portfolio-management)
檢視持股配置、風險評估、再平衡建議，含 FIFO 逐筆批次追蹤。

**觸發方式**：「檢視我的持股」、「資產配置建議」、「該不該換股」

### 台股資訊整理 (market-info)
快速彙整大盤走勢、法人動態、產業新聞等市場資訊。

**觸發方式**：「今天台股怎樣」、「法人買賣超」、「台股新聞」

## MCP 數據服務 (tw-stock-data)

內建 MCP server，透過 Yahoo Finance 提供以下即時數據工具：

- **get_stock_quote** — 個股即時報價（股價、漲跌、PE、殖利率等）
- **get_stock_history** — 歷史 K 線數據（支援日/週/月線，含均線計算）
- **get_financials** — 財務指標（毛利率、ROE、EPS、配息紀錄等）
- **get_institutional_trading** — 法人持股與機構投資人資訊
- **compare_stocks** — 多檔個股關鍵指標比較（最多 5 檔）
- **get_twse_market_summary** — 大盤加權指數即時概況

### 安裝需求

需要安裝 Python 套件：`pip install yfinance mcp`

## 安裝

```
/plugin install jurislm-claude-plugins-stock-expert@jurislm-plugins
```

## Skill 之間的關係

```
                ┌────────────────┐
                │ daily-decision │  ← 每日整合決策
                └───────┬────────┘
        ┌───────┬───────┴───────┬───────────┐
        ▼       ▼               ▼           ▼
  market-info  portfolio   stock-analysis  investment
  (盤勢快照)   (損益計算)    (歸因分析)    (展望研判)
```

## 注意事項

本 plugin 提供的分析和建議僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 授權

MIT
