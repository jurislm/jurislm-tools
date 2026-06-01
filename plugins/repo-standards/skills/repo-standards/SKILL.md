---
name: repo-standards
# skill 內容版本（獨立於 plugin.json 的發版版本，後者由 release-please 管理）
version: 1.5.0
description: >
  This skill should be used when the user asks "如何設定新 repo", "release workflow 怎麼寫",
  "release-please 怎麼用", "lint 怎麼設定", "eslint config 怎麼寫", "新增 repo 要怎麼設定",
  "git worktree 怎麼設定", "設定 code review workflow", "設定 Drone CI", "drone.yml 怎麼寫",
  "CI 怎麼設定", "部署怎麼設定", "避免重複部署", "deploy gating", "Coolify 部署 pipeline",
  "set up new repo", "configure ESLint", "set up release workflow", "set up Drone CI",
  "set up git worktree", "configure Claude code review", "add a .drone.yml pipeline",
  "avoid duplicate deploy", "configure CD / deploy",
  "設定 Vitest", "設定 Bun", "設定測試框架",
  "upgrade to ESLint 9", "migrate to flat config", "audit CI setup", "check release workflow",
  "檢查 repo 設定",
  or needs to set up Drone CI/CD, release automation, deploy gating, ESLint configuration,
  git worktree, or code review workflows for a repository.
argument-hint: "[repo-name]"
---

# JurisLM Repo 設定規範

---

## Repo 分類

| 類型 | 適用 Repo | release-type | Runtime | ESLint 基礎 |
|------|---------|-------------|---------|------------|
| **Next.js** | lawyer, stock（~~lexvision 已棄用 2026-05-14~~）| `node` | Bun | `eslint-config-next` |
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
  "packageManager": "bun@1.3.14",
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

整合測試驗證 Route Handlers 與資料庫互動（狀態碼、資料結構、錯誤路徑）。資料庫用 **Testcontainers**（Docker 隔離），外部 HTTP 用 **MSW** 攔截。

> 完整 vitest.config.ts 多 project 設定模板與安裝指令，見 `references/testing-config-templates.md`。

---

## Release 設定

release-please 的**目標標準是 Drone `.drone.yml` 的 `release-please` pipeline**（取代原 GitHub Actions `release.yml`）。已遷移：web app（memory-dessert / lawyer）、monorepo（entire，但其 release pipeline 用 `bunx` + `trigger.branch` 且目前僅 `release-pr`）。**Plugin repo（jurislm-tools / jurislm-plugins）尚未遷移，release-please 仍在 GitHub Actions `release.yml`**。完整 pipeline 模板與各變體見 `references/ci-workflow-templates.md`。

### `.drone.yml` 的 release-please pipeline（只在 push main 跑）

```yaml
---
kind: pipeline
type: docker
name: release-please
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: release-please
    image: node:20-alpine
    environment:
      RELEASE_PLEASE_TOKEN: { from_secret: RELEASE_PLEASE_TOKEN }
    commands:
      - npx release-please release-pr --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
      - npx release-please github-release --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
```

**規則**：
- 先 `release-pr`（維護版本 PR）再 `github-release`（建 tag / release），兩者皆冪等。
- **`RELEASE_PLEASE_TOKEN`** 為 Drone repo-scope secret（scopes `repo` + `workflow`；Drone Web UI Settings → Secrets）。
- **`release-type` 不可寫在 pipeline** — 必須只放在 `release-please-config.json`（否則 Release Please 會忽略 config 的 `extra-files`，導致 `plugin.json` / `marketplace.json` 版本號不被更新）。
- **`--config-file` + `--manifest-file` 必填** — 明確引用 config，避免隱性 drift。
- ⚠️ **合併 release PR 後須確認 push webhook 有觸發 build**（GitHub 偶爾漏發 → release 卡住沒 cut）。驗證與手動補救見 `references/ci-workflow-templates.md`「部署收尾」章節。

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

### Plugin repo（jurislm-tools / jurislm-plugins）仍在 GitHub Actions

⚠️ **plugin repo 尚無 `.drone.yml`** —— release-please 由 GHA `release.yml`、版本一致性檢查由 `version-check.yml` 執行。遷移 Drone 前，這些 GHA workflow 是唯一的 release / 驗證機制，**勿移除**。

`jurislm-plugins` 另有 `sync-plugins.yml`：發版後同步 plugin 定義到 PostgreSQL DB（dev + prod）。

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

## CI Workflow 設定（Drone CI）

**已遷移 repo 的 lint / typecheck / test 由自架 Drone（`https://ci.jurislm.com`）執行**（web app / MCP / monorepo），設定檔為 repo 根目錄 `.drone.yml`（取代原 GitHub Actions `ci.yml`）；**plugin repo（jurislm-tools / jurislm-plugins）尚未遷移，仍由 GitHub Actions（`version-check.yml`）驗證**。每個檢查是一個獨立 pipeline（YAML document，`---` 分隔），各自 clone + `bun install`；GitHub PR 只顯示 1 個 aggregated check（`drone/pr`）。

> 完整模板（Coolify Web App / Monorepo / npm 套件 / Plugin 變體 + deploy + secrets）見 `references/ci-workflow-templates.md`。

### 核心規則：避免重複觸發（Drone 版）

用 `trigger.event` + `trigger.ref`（git ref glob）對齊「PR 任意分支 + push 限 main」：

```yaml
trigger:
  event: [push, pull_request]
  ref:
    - refs/heads/main      # push main（post-merge safety net）
    - refs/pull/*/head     # PR（任意分支）
```

- **不要**把 `refs/heads/develop` 放進 `trigger.ref` —— 否則 push develop + PR 會雙 build 競爭 runner（= GitHub Actions 時代 Issue #82 的 duplicate-runs 雷，Drone 用 ref glob 從設計上避免）。
- 中間分支（develop / feature）只由 `refs/pull/*/head` 覆蓋；`push main` 作為繞過 PR（force-push / rebase / release-please commit）的 safety net。
- **release-please commit 守衛**：deploy / lint / test 在純版號 commit 上跳過（見下方 CD 章節）。

### Audit 既存 Repo

```bash
# 逐 repo 解碼 .drone.yml 看 pipeline 與 trigger.ref（已過濾 archived repo）
for repo in $(gh repo list jurislm --limit 50 \
    --json name,isArchived -q '.[] | select(.isArchived == false) | .name'); do
  echo "=== $repo ==="
  gh api "repos/jurislm/$repo/contents/.drone.yml" --jq '.content' 2>/dev/null \
    | tr -d '\n' | base64 -d 2>/dev/null | grep -E '^name:|refs/heads' | head -15 \
    || echo "(no .drone.yml)"
done
```

殘留檢查：**已遷移 Drone 的 repo** 若仍留舊 `.github/workflows/ci.yml` / `release.yml` → 應移除。⚠️ **plugin repo（jurislm-tools / jurislm-plugins）尚未遷移，勿移除其 `release.yml` / `version-check.yml`**；`claude-code-review.yml` / `claude.yml` 多數保留（hybrid），`entire` 已遷至 Drone。

### 規範回填協議

當任一 repo 的 `.drone.yml` 發現新陷阱：在來源 repo 修復（PR 含 root cause）→ **同步**回填 `references/ci-workflow-templates.md` + 本檔 → 開 issue 追蹤其他 repo。**禁止**只修單一 repo 不回填。

---

## 部署（CD）與避免重複部署

> 完整設定步驟、守衛邏輯、secret、收尾與踩坑見 `references/ci-workflow-templates.md`「CD 與避免重複部署」「部署收尾」章節。以下為核心規範。

**Coolify auto-deploy 對每個 push main 都部署，包含 release-please 的純版號 commit** → 同一份程式碼被部署兩次（feature 合併一次、release PR 合併再一次）。解法是把部署觸發移到 Drone 並關閉 auto-deploy：

1. **`.drone.yml` 加 `deploy` pipeline**（`push` main、`depends_on: [lint-typecheck, test]`、`clone: { disable: true }`）：curl Coolify deploy API，**守衛跳過 release commit**。
2. **守衛**：`echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'`
   - `head -1` 只看 subject（避免 squash body 某行誤匹配）；`release [0-9]` 要求版號數字（排除 `chore: release notes …` 誤判）。
3. **Drone repo-scope secret `COOLIFY_DEPLOY_TOKEN`**（`pull_request: false`）。
4. **關閉 Coolify `is_auto_deploy_enabled`**（先驗證 Drone→Coolify 接線可用再關，避免 prod 靜默停止部署）。

**結果**：feature 合併 = 部署 1 次；release PR 合併 = 部署 0 次（守衛跳過，僅 release-please 建 tag）。

**僅適用 Coolify-deployed repo**（web app）。**npm 套件 / MCP repo 不需要**——它們 publish 到 npm，只在 release commit 發布一次，無重複問題。Monorepo（多 app）須為每個 Coolify app 各設一個 deploy step。

⚠️ **合併任何 PR 進 main 後務必確認 push webhook 有觸發 build**（GitHub 偶爾漏發 → release / deploy 卡住）；驗證與手動補 `release-please github-release` 見 reference。

---

## Code Review 設定（多數 repo 維持 GitHub Actions hybrid）

> Copilot 指示模板、`claude-code-review.yml`、`claude.yml` 完整內容見 `references/code-review-setup.md`。

**平台現況**：多數 repo 的 Claude Code Review 仍在 **GitHub Actions**（`claude-code-review.yml` + `claude.yml`，CI/release 已遷 Drone 但 review 留 GHA = hybrid）。例外：`entire` 已將 review 遷至 Drone `claude-review` pipeline（headless `claude -p` + 7-phase prompt + `gh pr review` 回填，`infra/ci-jurislm/claude-review.sh`），並移除了 `@claude` 互動（Drone 無 comment 觸發）。CodeRabbit / Copilot 等 bot review 與平台無關。

**Checklist 快速說明**：
- 建立 `.github/copilot-instructions.md`（依 repo 類型選用模板）
- 建立 `claude-code-review.yml`（使用 `@v1`，完整 6-phase prompt，支援 profile switch）
- 建立 `claude.yml`（`@claude` 互動觸發）
- 在 repo Settings → Secrets 加入 `CLAUDE_CODE_OAUTH_TOKEN`（從本機 Keychain 取得：`security find-generic-password -s "Claude" -w`）

**claude-code-review.yml 核心功能**（詳見 `references/code-review-setup.md`）：
- **Profile 切換**：預設 chill（HIGH/CRITICAL only），加 label `review:assertive` 或 `workflow_dispatch` 切換為 assertive（也輸出 MEDIUM/LOW）
- **Path filter**：自動忽略 lock file、generated、binary、snapshot 等非業務檔案
- **CLAUDE.md rulebook**：自動提取 `❌ / 禁止 / MUST / NEVER` 規則，違反即 HIGH minimum
- **Diff-bounded scope**：只審查此 PR 修改的行，不標記既有程式碼
- **Finding cap**：diff < 100 行最多 5 條，100–500 行 7 條，> 500 行 10 條
- **Mechanical conclusion**：有 HIGH/CRITICAL → 需修改；否則 → 可合併（不以建議數量決定）

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

完整 checklist（Git Worktree / Runtime / 測試 / Release / ESLint / CI / CD / Code Review）見 `references/new-repo-checklist.md`。

**快速概覽**（各類別必做項）：
- **Worktree**：`git worktree add .worktrees/develop develop`，`.gitignore` 加 `.worktrees/`
- **Bun**：`"packageManager": "bun@1.3.14"`，scripts 換成 `bun run vitest` 等
- **Release**：`.drone.yml` 的 `release-please` pipeline（push main only），`release-type` 放在 config，Plugin repo 加 `extra-files`，secret `RELEASE_PLEASE_TOKEN`
- **ESLint**：`eslint --max-warnings=0`，`.prettierignore` 加 `.worktrees/`
- **CI**：`.drone.yml` 各 pipeline `trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`（**勿**列 develop）
- **CD**（Coolify web app）：`.drone.yml` 加 `deploy` pipeline + release-commit 守衛 + 關閉 Coolify auto-deploy + secret `COOLIFY_DEPLOY_TOKEN`（npm/MCP repo 不需要）
- **Code Review**（維持 GitHub Actions hybrid）：`claude-code-review.yml` 要 `pull-requests: write`，勿用 `gh pr comment`
