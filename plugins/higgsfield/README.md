# higgsfield

Higgsfield AI 圖像／影片／3D／音訊生成 — 官方 remote MCP（OAuth）+ 7 個 CLI skills

## 安裝

```bash
/plugin install jurislm-tools@higgsfield
```

## 內容

- MCP server：`https://mcp.higgsfield.ai/mcp`（Higgsfield 官方 hosted remote MCP，30+ 模型）
- 7 個 skill（皆為 `higgsfield` CLI 的 wrapper，`allowed-tools: Bash`）：
  - `higgsfield-generate` — 通用圖像/影片/3D/音訊生成、Marketing Studio、Virality Predictor
  - `higgsfield-product-photoshoot` — 品牌商品攝影（studio/lifestyle/hero banner/ad pack 等模式）
  - `higgsfield-marketplace-cards` — 電商平台商品卡（main image/A+ content）
  - `higgsfield-soul-id` — 訓練個人化 Soul Character（人臉一致性）
  - `higgsfield-video-explainer` — 完整口白解說影片（分鏡 + 配音 + 組裝）
  - `higgsfield-game-generation` — 瀏覽器小遊戲與遊戲素材生成
  - `higgsfield-websites` — 全端網站建置與部署（React 19 + TanStack Start）

## 認證（兩套獨立機制，互不共用）

**MCP（OAuth，無需 API key）**：

- Claude Code 會在第一次呼叫 MCP tool 時自動觸發 OAuth 登入流程（或用 `/mcp` 手動連線），瀏覽器跳轉登入 Higgsfield 帳號即可，不需在 `~/.zshenv` 設定任何 token。

**CLI（skills 依賴，獨立登入）**：

- 7 個 skill 呼叫的是 `higgsfield` CLI。建議先手動安裝 `npm install -g @higgsfield/cli`（npm registry 版本可追蹤/可稽核）；若未安裝，各 skill 的 bootstrap 步驟會自動用官方安裝腳本補裝（未做版本釘選/checksum 驗證，見下方安全提醒）。CLI 認證用 `higgsfield auth login`（互動式），與上面的 MCP OAuth 是兩條不同的 session，需分別登入一次。

## 來源與授權

- 7 個 skill 原樣 vendor 自官方 [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills)（MIT license，vendor 時版本 `0.12.0`，vendor 日期 2026-07-17）。更新需重新執行 `npx skills add higgsfield-ai/skills` 並手動同步覆蓋本目錄，非自動追蹤上游。
- MCP 官方文件：<https://higgsfield.ai/mcp>

## 安全提醒

`npx skills add` 安裝時的自動風險掃描把 `higgsfield-marketplace-cards`、`higgsfield-product-photoshoot` 標為 **High Risk**（且安裝訊息本身註明「skills run with full agent permissions」）。已人工檢視兩者 `SKILL.md`，內容僅為呼叫 `higgsfield` CLI 對應子指令並印出結果 URL，未見額外風險行為，但 vendor 進本 repo 前建議使用者自行複核（尤其未來重新 vendor 更新版本時）。

7 個 skill 的 bootstrap 步驟皆內含 `curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh`（官方 CLI 安裝腳本，未做版本釘選或 checksum 驗證，指向可變的 `main` branch）。這是 vendor 自 upstream 的原樣內容，若要避免此模式，改用已釘選版本的 `npm install -g @higgsfield/cli` 手動安裝、跳過 skill 的自動安裝分支。

## 使用

自然語言即可觸發對應 skill，例如「幫我做一張商品情境照」會路由到 `higgsfield-product-photoshoot`。或直接 `/higgsfield:higgsfield-generate ...` 指定呼叫。

## 版本

版本由 Release Please 集中管理（見根目錄 `.release-please-manifest.json` / `release-please-config.json` 的 `extra-files`）。
