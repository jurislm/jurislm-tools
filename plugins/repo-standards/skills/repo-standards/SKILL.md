---
name: repo-standards
version: 1.3.0
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
# 注意：branch 名稱的 "/" 在目錄名稱中改為 "-"
# 例：branch = feature/auth → 目錄 = .worktrees/feature-auth
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

所有 repo 共用欄位：

```json
{
  "packageManager": "bun@1.3.9",
  "engines": {
    "bun": ">=1.1.0"
  }
}
```

**Node/TS repo（MCP server 等）** 的 scripts：

```json
{
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

**Next.js repo** 的 scripts：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
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

### 三層測試分工

| 層級 | 工具 | 範疇 |
|------|------|------|
| **單元測試** | Vitest | 純函式、業務邏輯 |
| **整合測試** | Vitest + Testcontainers + MSW | API Route Handlers ↔ DB |
| **E2E 測試** | Playwright | 完整使用者流程、頁面渲染 |

### 整合測試（Next.js repo）

整合測試驗證 **Route Handlers 與資料庫之間的互動**（狀態碼、資料結構、錯誤路徑），不包含頁面層級（Server Components、完整渲染）——頁面由 Playwright E2E 覆蓋。

**測試方式**：直接 import handler 函式，傳入標準 `Request` 物件呼叫，不需啟動完整 Next.js server。

**外部依賴處理**：

| 依賴類型 | 處理方式 | 原因 |
|---------|---------|------|
| 資料庫 | **Testcontainers**（Docker 隔離容器） | 不應 mock，確保測試資料乾淨可重複 |
| 外部 HTTP（Anthropic API 等） | **MSW** 攔截 | 避免真實費用與網路不穩 |

**vitest.config.ts — 多 project 設定（Next.js repo，單元 + 整合分離）**：

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '.worktrees/**'],
    projects: [
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        name: 'integration',
        test: {
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['tests/integration/setup.ts'],
        },
      },
    ],
  },
})
```

**安裝整合測試套件**（以 PostgreSQL 為例，依實際 DB 選擇對應套件）：

```bash
bun add -d @testcontainers/postgresql msw
# MySQL: @testcontainers/mysql
# Generic: testcontainers
```

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

## CI Workflow 設定（lint / typecheck / test）

> 完整模板（含 Node/TS、Next.js、Plugin、Monorepo 變體）見 `references/ci-workflow-templates.md`。

### 核心規則：避免 push + pull_request 雙重觸發

`push` 與 `pull_request` 是獨立 event，`github.ref` 不同（`refs/heads/develop` vs `refs/pull/N/merge`）→ concurrency group 無法 dedupe，每次 push 浪費雙倍 CI 分鐘。

**Anti-pattern（禁止）**：

```yaml
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main
      - develop  # ❌ 重複觸發來源
```

**正確 pattern**：

```yaml
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main  # ✅ 只留 main 作為 post-merge safety net
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**為什麼 main 仍要 `push` trigger**：
- 中間分支（develop、feature）由 `pull_request` 完整覆蓋
- main 仍可能因 force-push、rebase merge、Release Please commit 等繞過 PR → 需 post-merge safety net

### 通用 job 規則

**Draft PR 跳過條件 — 必須 push-safe**：

```yaml
if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
```

**陷阱**：直接寫 `if: github.event.pull_request.draft == false` 會在 `push` / `workflow_dispatch` event 下評估為 false（因為 `github.event.pull_request` 為 null）→ **`push: main` safety net 完全不會跑**。先判斷 `event_name` 才安全。

- `--frozen-lockfile` 確保 lockfile 一致性
- 多個獨立 job 並行（lint / typecheck / test 不互相依賴）

### Audit 既存 Repo

GitHub code search 是**逐行**比對，多行 YAML 無法用單行字串命中。用以下方式：

```bash
# 逐 repo 解碼 ci.yml 看 on: 區塊（已過濾 archived repo）
for repo in $(gh repo list jurislm --limit 50 \
    --json name,isArchived -q '.[] | select(.isArchived == false) | .name'); do
  echo "=== $repo ==="
  gh api "repos/jurislm/$repo/contents/.github/workflows/ci.yml" \
    --jq '.content' 2>/dev/null | base64 -d 2>/dev/null \
    | sed -n '/^on:/,/^[a-zA-Z][a-zA-Z]*:/p' | head -25 \
    || echo "(no ci.yml)"
done
```

或用 `gh search code` 找含 `develop` 的 ci.yml（命中後人工確認 `on:` 區塊）：

```bash
gh search code 'develop' --owner jurislm --filename ci.yml
```

### 規範回填協議

當任一 repo 發現新 ci.yml 陷阱：
1. 在來源 repo 修復（PR 含 root cause 分析）
2. **同步**回填到 `references/ci-workflow-templates.md`
3. 開 issue 追蹤其他 repo 是否需同步

**禁止**：只修單一 repo 不回填模板 → 下個新 repo 仍會踩同雷。

⚠️ **Reference**：[Issue #82 — CI workflow duplicate runs](https://github.com/jurislm/jurislm-tools/issues/82)

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
9. [ ] 加入 `@types/bun`（Node/TS repo 專用，Next.js repo 不需要）

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

### CI Workflow
22. [ ] 建立 `.github/workflows/ci.yml`（依 `references/ci-workflow-templates.md` 對應 repo 類型）
23. [ ] 確認 trigger 為 `pull_request` + `push: main` only（**禁止** `push: develop` 或其他中間分支）
24. [ ] 設定 `concurrency.group: ${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true`
25. [ ] 各 job 加 push-safe draft 條件：`if: github.event_name != 'pull_request' || github.event.pull_request.draft == false`（**勿**直接寫 `github.event.pull_request.draft == false`，會破壞 `push: main` safety net）
26. [ ] 開 PR 確認 CI **只跑一次**（檢查 Actions 頁面，每次 push 應只看到 1 個 run，非 2 個）

### Code Review
27. [ ] 建立 `.github/workflows/claude-code-review.yml`（`@v1`，`pull-requests: write`，`gh pr review --comment`）
28. [ ] 建立 `.github/workflows/claude.yml`（`@claude` 互動觸發，`pull-requests: write`，`issues: write`，保留 `system_prompt` 繁中設定）
29. [ ] 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`
30. [ ] 建立 `.github/copilot-instructions.md`（**必須針對此 repo 客製化**，首行加入 `請使用繁體中文回覆所有問題與建議。`，並包含：project overview、git workflow、tool/module 分類、key design decisions、code conventions、code review 重點、auto-generated files 列表）
31. [ ] `claude.yml` 的 `system_prompt` 設為 `"請使用繁體中文回覆所有問題與建議。"`
32. [ ] 視需要在 `.github/instructions/` 建立路徑特定指示（加 `applyTo` frontmatter）
