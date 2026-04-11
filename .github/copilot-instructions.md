# Copilot Instructions

## 專案類型
- 此為 Claude Code Plugin Marketplace，包含 skills、commands 和 MCP server 整合
- 無 TypeScript 原始碼，使用 Markdown（SKILL.md）定義 skills

## 檔案結構規則
- `plugins/jurislm-tools/skills/*/SKILL.md` — skill 定義（Markdown 格式）
- `plugins/jurislm-tools/commands/*.md` — command 定義（Markdown 格式）
- `plugins/jurislm-tools/.claude-plugin/plugin.json` — plugin 元資料
- `.claude-plugin/marketplace.json` — marketplace 定義

## 版本管理
- **禁止手動修改版本號**：Release Please 自動處理
- `jurislm-tools` 必須是 `marketplace.json` 的 `plugins` 陣列第一個元素

## Code Review 重點
- SKILL.md 的 description 必須使用繁體中文
- skill trigger 條件需清晰具體
- command 的 argument-hint 需準確反映實際參數

## 忽略範圍
- 不審查 `.worktrees/` 目錄
