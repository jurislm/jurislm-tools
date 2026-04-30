---
name: repo-standards
version: 1.1.0
description: >
  This skill should be used when the user asks "如何設定新 repo", "release workflow 怎麼寫",
  "release-please 怎麼用", "lint 怎麼設定", "eslint config 怎麼寫", "新增 repo 要怎麼設定",
  "git worktree 怎麼設定", "設定 code review workflow", "設定 GitHub Actions",
  "set up new repo", "configure ESLint", "set up release workflow",
  "set up git worktree", "configure Claude code review", "add GitHub Actions workflow",
  or needs to set up release automation, ESLint configuration, git worktree, or code review
  workflows for a JurisLM repository.
argument-hint: "[repo-name]"
---

# JurisLM Repo 設定規範

---

## Repo 分類

| 類型 | 適用 Repo | release-type | Runtime | ESLint 基礎 |
|------|---------|-------------|---------|------------|
| **Next.js** | lawyer, lexvision, stock | `node` | Bun | `eslint-config-next` |
| **Node/TS** | coolify-mcp, hetzner-mcp, langfuse-mcp, judicial-mcp | `node` | Bun | `@eslint/js` + `typescript-eslint` |
| **Plugin** | jurislm-tools, jurislm-plugins | `simple` | — | 無 TS 原始碼，不需要 ESLint |
| **Monorepo** | entire | `node` | Bun | `@entire/eslint-config` |

---

## Git Worktree 規則

**每個 repo 的 main worktree（根目錄）必須永遠保持在 `main` 分支，所有開發在 `.worktrees/develop` 進行。**

### 分支結構

```
<repo>/               ← main worktree，永遠在 main 分支，不做 feature commits
<repo>/.worktrees/
  develop/            ← develop worktree，日常開發在此
  <feature-branch>/   ← feature worktree，需要時建立
```

### 建立規則

```bash
# 確認現有 worktree 與分支
git worktree list
git branch --show-current  # 根目錄必須顯示 main

# 建立 develop worktree（每個 repo 必備）
git fetch origin
git worktree add .worktrees/develop develop
# 若 develop 分支尚未存在：
git worktree add -b develop .worktrees/develop main

# feature branch worktree（開發特定功能時）
git worktree add -b feature/xxx .worktrees/feature-xxx develop
```

### 開發流程

```
.worktrees/develop → commit → push origin develop → PR develop→main → merge
.worktrees/<feature> → commit → push origin <feature> → PR <feature>→develop → merge
```

### 強制規則

- main worktree 根目錄只能在 `main` 分支，不可切換到其他分支
- 若發現根目錄不在 main：立即 `git checkout main && git pull origin main`
- **嚴禁直接 push 到 main**（main 連接 Coolify 自動部署 + Release Please）
- feature worktree 目錄名稱必須與 branch 名稱一致（`.worktrees/feature-xxx` ↔ `feature/xxx`）
- `.gitignore` 必須包含 `.worktrees/`

---

## Runtime 規範：統一使用 Bun

所有 JavaScript/TypeScript repo 統一使用 **Bun** 作為 runtime 與 package manager。

### package.json 標準設定

```json
{
  "packageManager": "bun@1.3.9",
  "engines": {
    "bun": ">=1.1.0"
  },
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun dist/index.js",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "test": "bun run vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint --max-warnings=0"
  }
}
```

### 命令對照

| 舊（Node.js/npm） | 新（Bun） |
|------------------|---------|
| `npm install` | `bun install` |
| `npm run dev` | `bun run dev` |
| `node dist/index.js` | `bun dist/index.js` |
| `tsx watch src/index.ts` | `bun --watch src/index.ts` |
| `ts-node src/index.ts` | `bun src/index.ts` |
| `npm publish` | `bun publish` |

### 安裝必要套件

```bash
# 移除舊 Node.js 工具
bun remove tsx ts-node

# 加入 Bun 類型
bun add -d @types/bun
```

---

## 測試規範：統一使用 Vitest

所有 TypeScript repo 的單元測試統一使用 **Vitest**。

### 安裝

```bash
bun add -d vitest
```

### package.json scripts

```json
{
  "scripts": {
    "test": "bun run vitest",
    "test:watch": "bun run vitest --watch",
    "test:coverage": "bun run vitest --coverage"
  }
}
```

### vitest.config.ts 標準模板

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '.worktrees/**',
    ],
  },
})
```

### 測試寫法

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('MyModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    const spy = vi.fn().mockReturnValue('result')
    expect(spy()).toBe('result')
  })
})
```

**關鍵 API**：
- Mock：`vi.fn()`, `vi.spyOn()`, `vi.mock()`
- 環境變數：`vi.stubEnv('KEY', 'value')` / `vi.unstubAllEnvs()`
- 模組：`vi.mocked()` 取得 typed mock

---

## Release 設定

### 標準 .github/workflows/release.yml

```yaml
name: Release Please

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

**規則**：
- `workflow_dispatch` 必填（允許手動觸發）
- `permissions` 放在 top 層級（非 job 層級）
- **`release-type` 不可寫在 workflow** — 必須只放在 `release-please-config.json`
- **`config-file` + `manifest-file` 必填** — 明確讓 workflow 引用 config，避免隱性 drift

⚠️ **重要**：若在 workflow 的 `with:` 區塊指定 `release-type`，Release Please 會忽略 `release-please-config.json` 的 `extra-files` 設定，導致 `plugin.json` 和 `marketplace.json` 版本號不會被自動更新。

### release-type 選擇

| 類型 | 適用條件 |
|------|---------|
| `node` | 有 `package.json` |
| `simple` | 無 `package.json`（plugin repo），搭配 `extra-files` 同步版本號 |

### 標準 release-please-config.json

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md",
      "bump-minor-pre-major": true,
      "bump-patch-for-minor-pre-major": true,
      "include-component-in-tag": false,
      "include-v-in-tag": true,
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "perf", "section": "Performance" },
        { "type": "docs", "section": "Documentation" },
        { "type": "refactor", "section": "Refactoring" },
        { "type": "style", "section": "Styles" },
        { "type": "test", "section": "Tests" },
        { "type": "chore", "section": "Maintenance", "hidden": true }
      ]
    }
  }
}
```

### Plugin Repo 額外設定

`jurislm-tools` 和 `jurislm-plugins` 需加 `extra-files` 同步版本號：

```json
"extra-files": [
  {
    "type": "json",
    "path": "plugins/<repo-name>/.claude-plugin/plugin.json",
    "jsonpath": "$.version"
  },
  {
    "type": "json",
    "path": ".claude-plugin/marketplace.json",
    "jsonpath": "$.plugins[0].version"
  }
]
```

⚠️ **重要**：`marketplace.json` 用 `$.plugins[0].version`（index，非 filter），目標 plugin **必須是陣列第一個元素**。

### jurislm-plugins 特殊規則

額外有 `sync-plugins.yml`，發版後同步 plugin 定義到 PostgreSQL DB（dev + prod）。

**觸發方式**：手動（`workflow_dispatch` only）——原因：`GITHUB_TOKEN` 建立的 release 不會自動觸發其他 workflow（GitHub 安全限制）。

---

## ESLint 設定

所有 repo 統一使用 ESLint 9 flat config，搭配 `--max-warnings=0`。

### 統一規則

| 規則 | 設定 | 說明 |
|------|------|------|
| `@typescript-eslint/no-explicit-any` | `error`（test 檔案豁免） | 禁用 `any` |
| `@typescript-eslint/no-unused-vars` | `error`（`_` 前綴豁免） | 未使用變數 |
| Prettier 整合 | `eslint-config-prettier` | 關閉與 Prettier 衝突的規則 |
| `.worktrees/**` | ignores | 排除 git worktree build 產物 |
| lint script | `eslint --max-warnings=0` | warning 視同 error |

> 完整 config 模板見 `references/eslint-templates.md`。

### 必要套件

```bash
# Next.js repo
bun add -d eslint eslint-config-next eslint-config-prettier prettier

# Node/TS repo
bun add -d eslint @eslint/js typescript-eslint eslint-config-prettier globals prettier
```

### .prettierignore 必含

```
# git worktrees
.worktrees/
```

⚠️ 少了這行，`prettier --write .` 會掃 worktree build 產物，導致 pre-commit 失敗。

---

## Code Review 設定

> Copilot 指示模板、`claude-code-review.yml`、`claude.yml` 完整內容見 `references/code-review-setup.md`。

**Checklist 快速說明**：
- 建立 `.github/copilot-instructions.md`（依 repo 類型選用模板）
- 建立 `claude-code-review.yml`（使用 `@v1`，勿鎖定小版本）
- 建立 `claude.yml`（`@claude` 互動觸發）
- 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`（從本機 Keychain 取得：`security find-generic-password -s "Claude" -w`）

**權限規則（容易出錯）**：
- `claude-code-review.yml`：`pull-requests: write`（需要發布 review）
- `claude.yml`：`pull-requests: write` + `issues: write`（需要回覆 @mention）
- 若誤設為 `read`，Claude 能讀取但無法回覆，靜默失敗

**Review 發布方式**：
- ✅ 使用 `gh pr review <number> --comment --body-file review.md`（正式 PR review，顯示在 Reviews 區，與 Copilot 並列）
- ❌ 勿使用 `gh pr comment`（發到一般留言區，不在 Reviews 區）

**勿使用 `/install-github-app` 產生的 plugin 方式**：
- `code-review@claude-code-plugins` 曾因 bash 安全過濾器（攔截含 `\n#` 的命令）失效
- 會錯誤地降低 `pull-requests` 和 `issues` 為 `read`，且移除 `system_prompt` 繁中設定
- 自訂 prompt 方式已驗證有效，格式與語言可控

---

## 新增 Repo Checklist

### Git Worktree
1. [ ] 確認 main worktree 在 `main` 分支：`git branch --show-current`
2. [ ] 建立 develop worktree：`git worktree add .worktrees/develop develop`
3. [ ] `.gitignore` 加入 `.worktrees/`
4. [ ] `.prettierignore` 加入 `.worktrees/`

### Runtime（Bun）
5. [ ] `package.json` 加 `"packageManager": "bun@1.3.9"`
6. [ ] `package.json` 加 `"engines": {"bun": ">=1.1.0"}`
7. [ ] scripts 使用 `bun` 指令（`bun --watch`、`bun dist/index.js` 等）
8. [ ] 移除 `tsx`、`ts-node` 等 Node.js runtime 套件
9. [ ] 加入 `@types/bun`（TypeScript 類型支援）

### 測試（Vitest）
10. [ ] 安裝 vitest：`bun add -d vitest`
11. [ ] 建立 `vitest.config.ts`，`exclude` 加 `.worktrees/**`
12. [ ] `package.json` scripts：`"test": "bun run vitest"`
13. [ ] 測試檔案使用 `import { describe, it, expect, vi } from 'vitest'`
14. [ ] 執行 `bun run test` 確認全通過

### Release
15. [ ] 建立 `.github/workflows/release.yml`（依標準格式，**不指定 `release-type`**）
16. [ ] 建立 `release-please-config.json`（依統一模板，`release-type` 寫在這裡）
17. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位

### ESLint
18. [ ] 依類型建立 `eslint.config.mjs`（Next.js）或 `eslint.config.js`（Node/TS）
19. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
20. [ ] 安裝必要套件
21. [ ] 執行 `bun run lint` 確認 0 errors 0 warnings

### Code Review
22. [ ] 建立 `.github/workflows/claude-code-review.yml`（`@v1`，`pull-requests: write`，`gh pr review --comment`）
23. [ ] 建立 `.github/workflows/claude.yml`（`@claude` 互動觸發，`pull-requests: write`，`issues: write`，保留 `system_prompt` 繁中設定）
24. [ ] 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`
25. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）
26. [ ] `claude.yml` 的 `system_prompt` 設為 `"請使用繁體中文回覆所有問題與建議。"`
27. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）
