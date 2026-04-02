# CLAUDE.md

此文件為 Claude Code（claude.ai/code）在此 repository 工作時提供指引。

## 常用命令

```bash
# 驗證 JSON 格式
cat .claude-plugin/marketplace.json | jq .
cat plugins/jurislm-tools/.claude-plugin/plugin.json | jq .

# 檢查版本是否同步
grep '"version"' .claude-plugin/marketplace.json
grep '"version"' plugins/jurislm-tools/.claude-plugin/plugin.json
```

## Repository 概覽

此為 Claude Code Plugin Marketplace（`jurislm-plugins`），GitHub repo：`terry90918/jurislm-tools`。

## 結構

```
.claude-plugin/marketplace.json       # Marketplace 定義（名稱、擁有者、plugin 列表）
plugins/jurislm-tools/
├── .claude-plugin/plugin.json        # Plugin 元資料
├── .mcp.json                         # MCP Server 配置
└── skills/
    ├── coolify/SKILL.md
    ├── hetzner/SKILL.md
    └── podcast-to-blog/SKILL.md
```

## 目前 Plugins

| Plugin | 版本 | 類型 | 說明 |
|--------|------|------|------|
| jurislm-tools | 1.7.0 | Hybrid | Coolify MCP（35 工具）+ Hetzner MCP（14 工具）+ podcast-to-blog skill |

## 版本管理

**禁止手動修改版本號** — Release Please 自動處理（`feat:` → minor，`fix:` → patch）。

`release-please-config.json` 的 `extra-files` 設定會自動同步：
- `plugins/jurislm-tools/.claude-plugin/plugin.json` → `$.version`
- `.claude-plugin/marketplace.json` → `$.plugins[0].version`

⚠️ **重要**：`marketplace.json` 的版本更新使用 `$.plugins[0].version`（依陣列索引）。release-please 不支援 filter jsonpath（`?(@.name==...)`），因此 **`jurislm-tools` 必須永遠是 `plugins` 陣列的第一個元素**，否則會更新到錯誤的版本。

## 環境變數

MCP Server 需要的環境變數，在 `~/.zshenv` 設定（非 `~/.zshrc`）：

- **coolify**：`COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL`
- **hetzner**：`HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`）

## 安裝流程

1. `git push` 到 marketplace repo
2. `/plugin marketplace update jurislm-plugins` — 必須先更新 marketplace 索引
3. `/plugin install jurislm-tools@jurislm-plugins` — 才能安裝
4. 重啟 Claude Code — skills 才會載入

跳過步驟 2 會導致 `Plugin not found`。

## 注意事項

- **版本號禁止手動修改**：交由 Release Please 管理
- **`jurislm-tools` 必須是 `marketplace.json` plugins 陣列第一個元素**
- **環境變數必須在 `~/.zshenv`**：MCP Server 是非互動式子進程，不 source `~/.zshrc`
- **description 語言**：使用繁體中文
