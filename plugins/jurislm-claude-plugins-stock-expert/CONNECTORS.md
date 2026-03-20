# Connectors

## 已配置的連接器

本插件已針對 Terry Chen 的工作流配置好以下連接器。

## Connectors for this plugin

| Category | 工具 | 狀態 | 用途 |
|----------|------|------|------|
| 台股數據 | tw-stock-data (內建) | ✅ 已配置 | 16 項即時數據工具，核心功能 |
| Chat | Slack | ✅ 已配置 | 風險預警推送、盤前分析推送、停損提醒 |
| Documents | Notion（Claude 內建） | ✅ 已連接 | 持股追蹤、交易紀錄同步、投資研究存檔 |
| Calendar | Google Calendar（Claude 內建） | ✅ 已連接 | 除息日提醒、法說會提醒、定期定額提醒 |
| News | WebSearch（內建） | ✅ 可用 | 財經新聞自動彙整（目前用 WebSearch 替代） |

## 內建 MCP Server: tw-stock-data

透過 Yahoo Finance + TWSE/TAIFEX 公開 API 提供的 16 項工具：

| 工具 | 用途 | 資料來源 |
|------|------|----------|
| `get_stock_quote` | 個股即時報價 | Yahoo Finance |
| `get_stock_history` | 歷史 K 線數據 | Yahoo Finance |
| `get_financials` | 財務指標 | Yahoo Finance |
| `get_institutional_trading` | 法人持股資訊 | Yahoo Finance |
| `compare_stocks` | 多檔個股比較 | Yahoo Finance |
| `get_twse_market_summary` | 大盤加權指數概況 | Yahoo Finance |
| `get_us_market_quote` | 美股指數/個股報價 | Yahoo Finance |
| `get_commodity_quote` | 國際原物料期貨報價 | Yahoo Finance |
| `get_institutional_daily` | 三大法人每日買賣超 | TWSE |
| `get_margin_trading` | 融資融券餘額變化 | TWSE |
| `get_futures_oi` | 期貨未平倉/選擇權籌碼 | TAIFEX |
| `get_monthly_revenue` | 個股月營收 | MOPS |
| `calculate_technical_indicators` | 技術指標計算 | 內建計算引擎 |
| `get_dividend_calendar` | 除權息行事曆 | TWSE |
| `get_sector_performance` | 類股漲跌排行 | TWSE |
| `get_exchange_rate` | 主要貨幣兌台幣匯率 | Yahoo Finance |

## 外部連接器使用情境

### Slack（通訊工具）

連接後可實現：

- **風險預警推送**：`risk-monitor` 發現高風險持股時，自動推送訊息到指定頻道
- **盤前分析推送**：`pre-market-analysis` 完成後，將重點摘要推送給自己或投資群組
- **停損停利提醒**：個股觸及停損/停利條件時，即時通知
- **每日決策摘要**：`daily-decision` 完成後，將行動清單推送到通訊工具

### Notion（資料同步）

連接後可實現：

- **持股追蹤資料庫**：每次分析或交易後，自動更新 Notion 中的持股明細
- **交易紀錄同步**：`trade-logger` 記錄的交易自動同步到 Notion 資料庫
- **績效報表**：定期產生投資組合績效報表
- **FIFO 批次表**：將每檔持股的 FIFO 批次與損益寫入 Notion

**未連接 Notion 時的替代方案**：交易紀錄存在 `Stock/` 目錄的 Markdown 檔案中，FIFO 計算使用 Python。
