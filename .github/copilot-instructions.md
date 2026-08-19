請使用繁體中文回覆所有問題與建議。

# Copilot Instructions for jurislm-tools

## Project overview

`jurislm-tools` 是九個 plugin 組成的 Claude Code Marketplace，Codex 亦可透過 Claude marketplace 相容層載入。`.claude-plugin/marketplace.json` 與 `plugins/<name>/.claude-plugin/plugin.json` 是結構來源；不要建議恢復已移除的單一 `jt` plugin。

## Git workflow

- 採 GitHub Flow：feature branch 直接對 `main` 開 PR。
- 主目錄維持在 `main`，實作使用 `.claude/worktrees/<change-name>`。
- 禁止直接 push `main`。
- 版本由 Release Please 管理，不得手動修改。

## Repository structure

```text
.claude-plugin/marketplace.json
plugins/<plugin-name>/
├── .claude-plugin/plugin.json
├── .mcp.json
├── skills/<name>/SKILL.md
├── commands/<name>.md
└── README.md
```

目前 marketplace entries：`coolify`、`hetzner`、`langfuse`、`repo-standards`、`podcast-to-blog`、`codebase-sync`、`learn-eval`、`jt-flow`、`higgsfield`。

## Review requirements

- 依序執行 `npm ci`、`npm run validate` 與 `claude plugin validate .`。
- `coolify` 必須維持 marketplace 第一個 entry；Release Please 更新 `$.plugins[0].version`。
- Marketplace entry、source folder 與 plugin manifest 名稱必須一致。
- 接收 token／key／secret 的 npm MCP launcher 必須鎖定精確 semver，不得使用 `@latest` 或 range。
- 安裝識別字必須是 `plugin@jurislm-tools`。
- MCP 環境變數只能記錄名稱，不得輸出值；本機設定放在 `~/.zshenv`。
- Skill trigger 必須具體，避免過度廣泛。
- 不審查 `.claude/worktrees/` 或 Release Please 產生的 CHANGELOG 格式。
