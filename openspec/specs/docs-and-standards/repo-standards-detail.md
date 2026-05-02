# Repo Standards Plugin Detail

## Purpose

描述 `repo-standards` plugin 的設計內容，審查並套用 JurisLM 各 repo 的統一設定規範，涵蓋 Release workflow、ESLint、Git worktree、Bun runtime 與 Vitest 設定。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `repo-standards` skill | `plugins/repo-standards/skills/repo-standards/SKILL.md` | 規範主體（473 行，最大 skill） |
| `/repo-standards` command | `plugins/repo-standards/commands/repo-standards.md` | 入口 command |
| code-review-setup reference | `plugins/repo-standards/skills/repo-standards/references/code-review-setup.md` | GitHub Actions code review 設定 |
| eslint-templates reference | `plugins/repo-standards/skills/repo-standards/references/eslint-templates.md` | ESLint 設定模板 |

## Repo 分類

| 類型 | 適用 Repo | release-type | Runtime | ESLint 基礎 |
|------|---------|-------------|---------|------------|
| Next.js | lawyer, lexvision, stock | `node` | Bun | `eslint-config-next` |
| Node/TS | coolify-mcp, hetzner-mcp, langfuse-mcp, judicial-mcp | `node` | Bun | `@eslint/js` + `typescript-eslint` |
| Plugin | jurislm-tools, jurislm-plugins | `simple` | — | 無 TS 原始碼，不需要 ESLint |
| Monorepo | entire | `node` | Bun | `@entire/eslint-config` |

## Git Worktree 規則（JurisLM 統一標準）

main worktree 根目錄必須永遠在 `main` 分支，所有開發在 `.worktrees/develop` 進行：

```
<repo>/                  ← main worktree（只在 main 分支）
<repo>/.worktrees/
  develop/               ← 日常開發
  <feature-branch>/      ← 功能開發（需要時建立）
```

**強制規則**：
- 嚴禁直接 push 到 main（連接 Coolify 自動部署 + Release Please）
- feature worktree 目錄名稱必須與 branch 名稱一致
- `.gitignore` 必須包含 `.worktrees/`

## Release Please 設定

所有 repo 使用 Release Please 自動版本管理：
- `feat:` → minor bump
- `fix:` → patch bump
- `docs:` / `chore:` → 不觸發版本升級

Plugin repo（`release-type: simple`）特別規則：
- 新增 skill、更新 skill 內容 → `feat:`
- 修正錯誤資訊 → `fix:`
- 純格式整理 → `docs:` 或 `chore:`（不觸發）

## 觸發條件

使用者詢問「如何設定新 repo」、「release workflow 怎麼寫」、「worktree 怎麼設定」、「ESLint config 怎麼寫」或需要設定 JurisLM 系列 repo 的標準化時啟動。

## 與其他 plugin 的關係

- 設定完成後建議執行 `codebase-sync` 更新 README.md / CLAUDE.md
- 詳見 [codebase-sync-detail.md](./codebase-sync-detail.md)
