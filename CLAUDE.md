# CLAUDE.md

此文件為 Claude Code（claude.ai/code）在此 repository 工作時提供指引。

## 常用命令

```bash
# 驗證 JSON 格式
cat .claude-plugin/marketplace.json | jq .
cat plugins/<name>/.claude-plugin/plugin.json | jq .

# 檢查版本是否同步
grep -A1 '"name": "<plugin>"' .claude-plugin/marketplace.json
cat plugins/<name>/.claude-plugin/plugin.json | grep version
```

## Repository 概覽

此為 Claude Code Plugin Marketplace（`jurislm-plugins`），包含整合 MCP（Model Context Protocol）伺服器與 Claude Code 的 plugins。

## 結構

```
.claude-plugin/marketplace.json  # Marketplace 定義（名稱、擁有者、plugin 列表）
plugins/
  <plugin-name>/
    .claude-plugin/plugin.json   # Plugin 元資料（名稱、描述、版本、作者）
    .mcp.json                    # MCP Server 配置（僅 MCP Server 類型）
    README.md                    # Plugin 文件
    skills/                      # Skill 定義
      <skill-name>/
        SKILL.md                 # 含 YAML frontmatter 的 Skill 定義
        references/              # 參考文件（可選）
    commands/                    # 快捷命令（可選，如 stock）
    hooks/                       # Hook 定義（可選，如 notion-workflow）
    mcp-server/                  # 自建 MCP Server 原始碼（可選）
```

**Plugin 類型**：
- **Skill Only**：`plugin.json` + `README.md` + `skills/`（如 github-release, lessons-learned, podcast-to-blog）
- **Hybrid**：`.mcp.json` + `plugin.json` + `README.md` + `skills/`（如 hetzner, coolify, stock, notion-workflow）

## 新增 Plugin

1. 建立目錄：`plugins/<plugin-name>/`
2. 新增 `.claude-plugin/plugin.json`：
   ```json
   {
     "name": "<plugin-name>",
     "description": "...",
     "version": "1.0.0",
     "author": { "name": "..." }
   }
   ```
3. 新增 `.mcp.json`（MCP Server 配置，兩種格式）：
   ```json
   // stdio 類型（本地進程）
   {
     "mcpServers": {
       "<server-name>": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "<npm-package>"],
         "env": { "API_TOKEN": "${API_TOKEN}" }
       }
     }
   }
   ```
   ```json
   // HTTP 類型（遠端服務）
   {
     "mcpServers": {
       "<server-name>": {
         "type": "http",
         "url": "https://mcp.example.com/mcp"
       }
     }
   }
   ```
4. 在 `.claude-plugin/marketplace.json` 的 `plugins` 陣列中註冊
5. **版本號必須同步**：`marketplace.json` 和 `plugin.json` 的版本保持一致

## 版本管理

發布更新時，需在**兩個**檔案同時更新版本：
- `.claude-plugin/marketplace.json` → `plugins[].version`
- `plugins/<name>/.claude-plugin/plugin.json` → `version`

## 環境變數

使用 MCP Server 的 plugin 通常需要 API token。在 `.mcp.json` 中用 `${VAR_NAME}` 語法引用環境變數。使用者需在 `~/.zshenv` 或 `~/.zshrc` 中設定，Claude Code 才能存取。

目前 plugin 環境變數需求：
- **hetzner**：`HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`）
- **coolify**：`COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL`

## 目前 Plugins

| Plugin | 版本 | 類型 | 說明 |
|--------|------|------|------|
| jurislm-claude-plugins-hetzner | 1.3.0 | Hybrid | hetzner-mcp-server（14 工具）+ hetzner skill |
| jurislm-claude-plugins-coolify | 1.3.4 | Hybrid | jurislm-coolify-mcp（35 工具）+ coolify skill |
| jurislm-claude-plugins-stock | 4.1.0 | Hybrid | 台股投資專家（12 skills + 5 commands + MCP Server）：個股分析、每日決策、投資策略、組合管理、市場資訊、盤前分析、類股分析、風險監控、原物料分析、交易日誌、黑天鵝雷達、應用開發指南 |
| jurislm-claude-plugins-entire | 1.3.0 | Skill Only | Entire 台灣法律 AI 平台開發 Skill（3 skills + 10 references） |
| jurislm-claude-plugins-lawyer | 1.2.1 | Skill Only | 劉尹惠律師事務所網站開發 Skill（Payload CMS、部署、測試） |
| jurislm-claude-plugins-github-release | 1.5.0 | Skill Only | Release Please + Claude Code Review + Release Notes + Husky pre-commit |
| jurislm-claude-plugins-lessons-learned | 1.10.0 | Skill Only | 經驗模式（持續更新）：診斷除錯、測試、基礎設施、安全、架構、業務邏輯、Git 工作流、雲端遷移、前端工具鏈、Docker 部署、資料匯入 |
| notion-workflow | 1.1.1 | Hybrid | Notion HTTP MCP + 7 skills（daily-log、habit-tracker、memory-sync 等）+ hooks |
| podcast-to-blog | 0.1.0 | Skill Only | Podcast 轉部落格文章 |

## 注意事項

- **版本號必須同步**：`marketplace.json` 和 `plugin.json` 的版本必須一致
- **環境變數名稱**：hetzner 用 `HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`）
- **description 語言**：使用繁體中文
- **Plugin 名稱不可與 marketplace 同名**：`jurislm` plugin 在 `jurislm-plugins` marketplace 內會造成歧義，對話中無法區分指的是哪個。命名時加後綴區分（如 `entire`）
- **Skill-Only plugin 不需要 `.mcp.json`**：只有 MCP Server 類型的 plugin 需要 `.mcp.json`。Skill-Only plugin 結構為 `plugin.json` + `README.md` + `skills/` 目錄

## 安裝流程

1. `git push` 到 marketplace repo
2. `/plugin marketplace update jurislm-plugins` — 必須先更新 marketplace 索引
3. `/plugin install <plugin-name>@jurislm-plugins` — 才能安裝
4. 重啟 Claude Code — skills 才會載入
- 跳過步驟 2 會導致 `Plugin not found`
