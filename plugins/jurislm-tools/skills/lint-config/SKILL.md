---
name: lint-config
description: JurisLM 各 repo 的 ESLint 設定規範。當使用者詢問「lint 怎麼設定」、「eslint config 怎麼寫」、「新增 repo 要加什麼 lint」、「lint 規則是什麼」時觸發。
argument-hint: "[repo-name]"
---

# JurisLM ESLint 設定規範

所有 jurislm repo 統一使用 ESLint 9 flat config，搭配 `--max-warnings=0`。

---

## Repo 分類

| 類型 | 適用 Repo | 基礎 config |
|------|---------|------------|
| **Next.js** | lawyer, lexvision, stock | `eslint-config-next` |
| **Node/TS** | coolify-mcp, hetzner-mcp, langfuse-mcp | `@eslint/js` + `typescript-eslint` |
| **Plugin** | jurislm-tools, jurislm-plugins | 無 TypeScript 原始碼，不需要 ESLint |
| **Monorepo** | entire | Turborepo，另有 `@entire/eslint-config` 共用設定，暫不統一 |

---

## 統一規則

所有 repo 必須遵守：

| 規則 | 設定 | 說明 |
|------|------|------|
| `@typescript-eslint/no-explicit-any` | `error` | 禁用 `any`（test 檔案豁免） |
| `@typescript-eslint/no-unused-vars` | `error`（`_` 前綴豁免） | 未使用變數 |
| Prettier 整合 | `eslint-config-prettier` | 關閉與 Prettier 衝突的規則 |
| `.worktrees/**` | ignores | 排除 git worktree 的 build 產物 |
| lint script | `eslint --max-warnings=0` | warning 視同 error |

---

## 標準 Next.js eslint.config.mjs

適用：`lawyer`、`lexvision`、`stock`

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

- 有 Playwright E2E 測試的 repo（lawyer、stock）需額外加 Playwright section（參考各 repo 現有設定）
- 字型無法用 `next/font` 載入時（如 LXGW WenKai TC），需加 `'@next/next/no-page-custom-font': 'off'`

---

## 標準 Node/TS eslint.config.js

適用：`coolify-mcp`、`hetzner-mcp`、`langfuse-mcp`

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

---

## package.json lint script

```json
{
  "scripts": {
    "lint": "eslint --max-warnings=0"
  }
}
```

---

## 必要套件

### Next.js repo

```bash
bun add -d eslint eslint-config-next eslint-config-prettier prettier
```

### Node/TS repo

```bash
bun add -d eslint @eslint/js typescript-eslint eslint-config-prettier globals prettier
```

---

## .prettierignore 必含

```
# git worktrees
.worktrees/
```

若 `.prettierignore` 沒有排除 `.worktrees/`，`prettier --write .` 會掃 worktree 的 build 產物，導致 pre-commit 失敗。

---

## 新增 Repo Checklist

1. [ ] 依類型選擇標準 `eslint.config.mjs` 或 `eslint.config.js`
2. [ ] `package.json` 加 `"lint": "eslint --max-warnings=0"`
3. [ ] 安裝必要套件
4. [ ] `.prettierignore` 加 `.worktrees/`
5. [ ] `vitest.config.ts`（若有）的 `exclude` 加 `.worktrees/**`
6. [ ] 執行 `npm run lint` 確認 0 errors 0 warnings
