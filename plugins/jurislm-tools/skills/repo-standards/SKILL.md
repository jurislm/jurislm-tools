---
name: repo-standards
description: JurisLM 各 repo 的統一設定規範，涵蓋 Release 工作流程與 ESLint 設定。當使用者詢問「如何設定新 repo」、「release workflow 怎麼寫」、「release-please 怎麼用」、「lint 怎麼設定」、「eslint config 怎麼寫」、「新增 repo 要怎麼設定」時觸發。
argument-hint: "[repo-name]"
---

# JurisLM Repo 設定規範

---

## Repo 分類

| 類型 | 適用 Repo | release-type | ESLint 基礎 |
|------|---------|-------------|------------|
| **Next.js** | lawyer, lexvision, stock | `node` | `eslint-config-next` |
| **Node/TS** | coolify-mcp, hetzner-mcp, langfuse-mcp | `node` | `@eslint/js` + `typescript-eslint` |
| **Plugin** | jurislm-tools, jurislm-plugins | `simple` | 無 TS 原始碼，不需要 ESLint |
| **Monorepo** | entire | `node` | `@entire/eslint-config`（暫不統一） |

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
          release-type: node   # 或 simple，見 Repo 分類表
          token: ${{ secrets.GITHUB_TOKEN }}
```

**規則**：
- `workflow_dispatch` 必填（允許手動觸發）
- `permissions` 放在 top 層級（非 job 層級）
- `release-type` 必須明確指定

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
        { "type": "feat", "section": "🚀 New Features" },
        { "type": "fix", "section": "🐛 Bug Fixes" },
        { "type": "perf", "section": "⚡ Performance" },
        { "type": "docs", "section": "📚 Documentation" },
        { "type": "refactor", "section": "♻️ Refactoring" },
        { "type": "style", "section": "🎨 Styles" },
        { "type": "test", "section": "🧪 Tests" },
        { "type": "chore", "section": "🏠 Maintenance", "hidden": true }
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

### 標準 Next.js eslint.config.mjs

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.worktrees/**',
  ]),
]);

export default eslintConfig;
```

**注意**：
- Playwright E2E 測試（lawyer、stock）需額外加 Playwright section
- 字型無法用 `next/font` 載入時（如 LXGW WenKai TC），需加 `'@next/next/no-page-custom-font': 'off'`

### 標準 Node/TS eslint.config.js

```js
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.worktrees/'],
  },
);
```

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

所有 repo 的 `.github/workflows/claude-code-review.yml` 統一格式，關鍵規則：
- 使用 `anthropics/claude-code-action@v1.0.70`
- `claude_args: '--allowedTools "Bash(gh:*),Write"'`
- prompt 中「問題與建議」需包含：
  > IMPORTANT: Do NOT suggest deferring fixes to follow-up PRs. Every suggestion you make is expected to be fixed in the current PR before merge.
- 「結論」需包含：
  > if there are any suggestions above, the conclusion must be "needs changes"

---

## 新增 Repo Checklist

### Release
1. [ ] 建立 `.github/workflows/release.yml`（依標準格式，指定正確 `release-type`）
2. [ ] 建立 `release-please-config.json`（依統一模板）
3. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位

### ESLint
4. [ ] 依類型建立 `eslint.config.mjs`（Next.js）或 `eslint.config.js`（Node/TS）
5. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
6. [ ] 安裝必要套件
7. [ ] `.prettierignore` 加 `.worktrees/`
8. [ ] `vitest.config.ts`（若有）的 `exclude` 加 `.worktrees/**`
9. [ ] 執行 `npm run lint` 確認 0 errors 0 warnings

### Code Review
10. [ ] 建立 `.github/workflows/claude-code-review.yml`（依統一格式）
