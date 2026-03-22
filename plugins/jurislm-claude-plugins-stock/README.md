# Stock Plugin

台股投資專家 AI 助手，提供個股分析、每日操作決策、投資策略、組合管理與市場資訊整理。

> **Important**: 本 plugin 提供的分析和建議僅供參考，不構成投資建議。所有分析結果應由使用者自行判斷後再做投資決策。投資有風險，請依個人風險承受能力做出決策。

## 安裝

```
/plugin install jurislm-claude-plugins-stock@jurislm-plugins
```

## Commands

| Command | Description |
|---------|-------------|
| `/stock-analysis` | 個股深度分析 — 基本面、技術面、籌碼面三大面向分析，含 FIFO 逐筆損益追蹤 |
| `/daily-decision` | 每日操作決策 — 收盤後一站式分析，含盤勢快照、持股歸因、損益更新、明日行動清單 |
| `/market-info` | 市場資訊整理 — 快速彙整大盤走勢、法人動態、類股輪動、國際連動 |
| `/pre-market` | 盤前分析 — 開盤前快速掌握國際市場、期貨籌碼、持股注意點 |
| `/risk-check` | 風險監控 — 全持股五維度風險掃描與預警建議 |

## Skills

| Skill | Description |
|-------|-------------|
| `stock-analysis` | 個股三大面向深度分析（基本面、技術面、籌碼面），含 ETF 分析與 FIFO 損益追蹤 |
| `daily-decision` | 每日收盤後五階段整合決策：盤勢快照 → 持股歸因 → 損益更新 → 明日展望 → 行動清單 |
| `market-info` | 台股市場資訊快速整理：大盤、法人、類股、國際連動 |
| `pre-market-analysis` | 開盤前四階段分析：國際市場 → 期貨籌碼 → 持股檢視 → 開盤建議 |
| `investment-strategy` | 投資策略建議：市場階段判斷、選股策略、進出場時機 |
| `portfolio-management` | 投資組合管理：持股配置、FIFO 批次追蹤、再平衡建議 |
| `risk-monitor` | 風險監控預警：五維度風險評估、綜合評分、停損停利建議 |
| `sector-analysis` | 產業鏈分析：上下游關聯、個股行情 vs 產業行情、受惠股判斷 |
| `trade-logger` | 交易紀錄管理：自然語言解析、FIFO 損益計算、持股更新 |

## Example Workflows

### 每日投資決策循環

1. 早上 8:00-9:00 執行 `/pre-market` 取得盤前分析與開盤建議
2. 盤後執行 `/daily-decision` 取得收盤後完整分析與明日行動清單
3. 對特定個股用 `/stock-analysis 2330` 深入分析
4. 定期用 `/risk-check` 檢查持股風險狀態

### 新股研究流程

1. 執行 `/stock-analysis [代號]` 取得基本面、技術面、籌碼面分析
2. 搭配 `/market-info` 了解當前市場環境
3. 確認符合投資策略後，以自然語言記錄買入：「我今天買了 2330 台積電 1000 股 @ 850」

### 風險管理流程

1. 每週執行 `/risk-check` 全面掃描持股風險
2. 對高風險持股用 `/stock-analysis [代號]` 深入診斷
3. 根據建議執行停損或停利，以 trade-logger 記錄交易

## MCP 數據服務 (tw-stock-data)

內建 MCP server，透過 Yahoo Finance + TWSE/TAIFEX 公開 API 提供 **16 項**即時數據工具：

### 基礎數據（v1.0~v1.5）
- **get_stock_quote** — 個股即時報價（股價、漲跌、PE、殖利率等）
- **get_stock_history** — 歷史 K 線數據（支援日/週/月線，含均線計算）
- **get_financials** — 財務指標（毛利率、ROE、EPS、配息紀錄等）
- **get_institutional_trading** — 法人持股與機構投資人資訊
- **compare_stocks** — 多檔個股關鍵指標比較（最多 5 檔）
- **get_twse_market_summary** — 大盤加權指數即時概況

### 國際市場與資金面（v1.6）
- **get_us_market_quote** — 美股指數/個股/ETF 即時報價（支援中文別名）
- **get_commodity_quote** — 國際原物料期貨報價（黃金、原油、銅等）
- **get_institutional_daily** — 三大法人每日買賣超（TWSE 公開資訊）
- **get_margin_trading** — 融資融券餘額變化（散戶信心指標）

### v2.0.0 新增
- **get_futures_oi** — 期貨未平倉/選擇權籌碼（外資台指期多空、Put/Call Ratio）— TAIFEX
- **get_monthly_revenue** — 個股月營收（MOPS 公開資訊觀測站）
- **calculate_technical_indicators** — 技術指標一鍵計算（KD、MACD、RSI、布林通道、均線排列、量能分析、支撐壓力、綜合評分）
- **get_dividend_calendar** — 除權息行事曆（TWSE）
- **get_sector_performance** — 類股漲跌排行（資金輪動方向）
- **get_exchange_rate** — 主要貨幣兌台幣匯率及走勢

### 安裝需求

需要安裝 Python 套件：`pip install yfinance mcp pandas numpy`

## MCP Integration

> 詳見 [CONNECTORS.md](CONNECTORS.md) 了解所有連接器設定。

本 Plugin 內建 `tw-stock-data` MCP server 提供核心數據。可額外連接外部 MCP 增強功能：

- **新聞 API** — 自動取得財經新聞，減少 WebSearch 依賴
- **文件儲存** — Google Drive、Notion 整合投資筆記
- **通訊工具** — Slack 推送風險預警通知
- **試算表** — Google Sheets 自動更新持股追蹤表
- **日曆** — Google Calendar 除息日、法說會提醒

> **Note:** 即使不連接任何外部 MCP，Plugin 仍可透過內建 MCP server 和 WebSearch 正常運作。

## Skill 之間的關係

```
                ┌────────────────┐
                │ daily-decision │  ← 每日整合決策
                └───────┬────────┘
        ┌───────┬───────┴───────┬───────────┐
        ▼       ▼               ▼           ▼
  market-info  portfolio   stock-analysis  investment
  (盤勢快照)   (損益計算)    (歸因分析)    (展望研判)

  pre-market ←→ daily-decision  ← 一日決策循環（早盤前 + 收盤後）

  risk-monitor → stock-analysis ← 高風險股深入診斷
  trade-logger ← daily-decision ← 行動清單→記錄交易
  sector-analysis ←→ stock-analysis ← 個股 vs 產業行情
```

## v3.1.0 更新內容

借鑑 Anthropic Finance Plugin 的設計模式，進行全面品質升級：

- **新增 Commands**：5 個快速指令入口（`/stock-analysis`、`/daily-decision`、`/market-info`、`/pre-market`、`/risk-check`）
- **品質檢查清單**：每個 Skill 新增結構化品質檢查清單（Quality Checklist），確保分析輸出品質一致
- **分析反模式提醒**：標注常見的分析反模式（Anti-Patterns），避免模糊、空洞的分析
- **指標追蹤框架**：新增長期分析品質追蹤指標（如決策準確率、歸因準確度）
- **CONNECTORS.md**：新增連接器文件，說明 MCP 整合方式和建議配置
- **Plugin 配置優化**：`.mcp.json` 新增 `recommendedCategories`，plugin.json 更新版本資訊

## 注意事項

本 plugin 提供的分析和建議僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力做出決策。

## 授權

MIT
