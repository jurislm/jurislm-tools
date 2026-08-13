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
  "set up git worktree", "add a .drone.yml pipeline",
  "avoid duplicate deploy", "configure CD / deploy",
  "設定 Vitest", "設定 Bun", "設定測試框架",
  "upgrade to ESLint 9", "migrate to flat config", "audit CI setup", "check release workflow",
  "檢查 repo 設定", "更新 AGENTS.md", "AGENTS.md 讀 CLAUDE.md", "同步 AGENTS.md",
  "sync AGENTS.md with CLAUDE.md",
  or needs to set up Drone CI/CD, release automation, deploy gating, ESLint configuration,
  git worktree, AGENTS.md handoff, or code review workflows for a repository.
argument-hint: "[repo-name]"
---

# JurisLM Repo 設定規範

---

## Repo 分類

| 類型 | 適用 Repo | release-type | Runtime | ESLint 基礎 |
|------|---------|-------------|---------|------------|
| **Next.js** | Next.js web app repos | `node` | Bun | `eslint-config-next` |
| **Node/TS** | Node／TypeScript service repos | `node` | Bun | `@eslint/js` + `typescript-eslint` |
| **Plugin** | Content-first plugin repos | `simple` | — | 無 TS 原始碼，不需要 ESLint |
| **Monorepo** | `jurislm/entire`（唯一已驗證 reference）及其他待驗收 monorepo | `node` | Bun | `@entire/eslint-config` 或目標 repo 的既有設定 |

## Verified Reference 與導入目標

- `jurislm/entire` 是目前唯一已透過可觀測驗收證明的 release delivery 與 monorepo CI/CD reference。
- 其他 repo 都是 adoption target；完成該 repo 自己的 CI、release、部署／發布與 readback 驗收前，不得標示為 verified reference，也不得把它的拓撲當成組織標準。
- `entire` 的 reference 範圍是可驗證的不變量（trusted main delivery、Turborepo 與安全 release contract），不是要複製它的 Runtime、Coolify 部署或 app 拓撲。

---

## Agent 指引檔同步：AGENTS.md 讀取 CLAUDE.md

`CLAUDE.md` 是 JurisLM repo 的人機協作規範單一來源；`AGENTS.md` 只作為 Codex / agents 的入口轉接檔。

執行 `/repo-standards` 審查任一 repo 時，必須先檢查 repo 內是否存在 `AGENTS.md`：

- 若 repo 內沒有 `AGENTS.md`：不需要新增，除非使用者明確要求。
- 若 repo 內有一個或多個 `AGENTS.md`：逐一更新為讀取同層 `CLAUDE.md`；若同層沒有 `CLAUDE.md`，則讀取 repo 根目錄 `CLAUDE.md`。
- 不要把 `CLAUDE.md` 全文複製進 `AGENTS.md`；避免兩份規範 drift。
- 若找不到可對應的 `CLAUDE.md`：先回報阻塞，不要產生空泛或過期規則。

標準 `AGENTS.md` 內容：

```markdown
# AGENTS.md instructions

請先閱讀並遵守同目錄的 `CLAUDE.md`。
若本目錄沒有 `CLAUDE.md`，請改讀 repo 根目錄的 `CLAUDE.md`。
本檔只作為 agents 入口；實際 repo 規範以 `CLAUDE.md` 為準。
```

---

## Git Worktree 規則

**GitHub Flow 單段式：main worktree（根目錄）永遠保持在 `main` 分支，不做 feature commits；每個需求／功能直接從 `main` 建立獨立 feature worktree，沒有 `develop` 分支這一段。**

### 分支結構

```
<repo>/                          ← main worktree，永遠在 main 分支，不做 feature commits
<repo>/.claude/worktrees/
  <change-name>/                 ← feature worktree，需要時建立，直接基於 main
```

### 建立規則

```bash
# 確認現有 worktree 與分支
git worktree list
git branch --show-current  # 根目錄必須顯示 main

# 建立 feature worktree（直接基於最新 main，不動主目錄）
git fetch origin main
git worktree add --no-track -b <change-name> .claude/worktrees/<change-name> origin/main
# ⚠️ <change-name> 若含 "/"（如 feature/auth），-b 後面用原始名稱，
# 但 .claude/worktrees/ 後面的目錄部分要換成 "-"（.claude/worktrees/feature-auth），
# 兩處不是同一個字串，見下方「強制規則」的完整範例
# ⚠️ start point 是 origin/main（remote-tracking ref），若省略 --no-track，
# git 預設會把新分支的 upstream 設成 origin/main（是否真的觸發依
# branch.autoSetupMerge 設定而定，不保證每個環境都一樣）；--no-track 從一開始
# 就不建立這個 tracking，比事後用 git config --unset 解除更可靠——後者在
# upstream 其實沒被設定的環境會直接報錯（exit 5，key 不存在），不是穩妥的做法
git push -u origin <change-name>  # 明確指定 upstream，不要裸 push
```

### 開發流程

```
.claude/worktrees/<change-name> → commit → push origin <change-name> → PR <change-name>→main → merge
```

### 強制規則

- main worktree 根目錄只能在 `main` 分支，不可切換到其他分支
- 若發現根目錄不在 main：立即 `git checkout main && git pull origin main`
- **嚴禁直接 push 到 main**（main 連接 Coolify 自動部署 + Release Please）
- 沒有 `develop` 分支：不建立、不維護、不預期存在——每個 feature worktree 直接從 `main` 分出，PR 一律直接 `<change-name> → main`
- feature worktree 目錄名稱必須與 branch 名稱一致（`.claude/worktrees/<change-name>` ↔ `<change-name>`；branch 名稱含 `/` 時目錄以 `-` 替代，例：branch = `feature/auth` → 目錄 = `.claude/worktrees/feature-auth`）
- `.claude/worktrees/` 由 Claude Code runtime 透過本地 `.git/info/exclude` 自動排除，**不要**額外加進 `.gitignore`；但 `.prettierignore`／ESLint ignores／`vitest.config.ts` 的 `exclude` 不會讀 git 的 exclude 規則，仍須各自手動加入 `.claude/worktrees/**`

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
      '.claude/worktrees/**',
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

release-please 依 repo 類型與明確的平台決策執行：**Coolify web app /
npm-MCP / monorepo** 使用 Drone；**plugin 類型**預設使用 GitHub Actions，
但可像 `jurislm-tools` 一樣明確選擇 Drone。選擇 Drone 的 plugin repo
必須把驗證與 release 一起遷移，不得保留功能重疊的 GitHub Actions。
Drone 的標準順序是先 `github-release`（cut 已合併 release PR），再
`release-pr`（維護下一個版本 PR）。完整模板與變體見
`references/ci-workflow-templates.md`。

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
  - name: github-release
    image: node:20-alpine
    environment:
      RELEASE_PLEASE_TOKEN: { from_secret: RELEASE_PLEASE_TOKEN }
    commands:
      - npx --yes release-please@<EXACT-RELEASE-PLEASE-VERSION> github-release --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
  - name: release-pr
    image: node:20-alpine
    depends_on: [github-release]
    environment:
      RELEASE_PLEASE_TOKEN: { from_secret: RELEASE_PLEASE_TOKEN }
    commands:
      - npx --yes release-please@<EXACT-RELEASE-PLEASE-VERSION> release-pr --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
```

**規則**：
- 先 `github-release`（建 tag / release）再 `release-pr`（維護下一個版本 PR），兩者皆冪等；若反過來，尚未 cut 的已合併 release PR 可能阻擋新 release PR。
- 所有會寫 GitHub 的 Release Please command 都必須使用 `release-please@<EXACT-RELEASE-PLEASE-VERSION>`；目標 repo 必須替換為經測試的精確版本，禁止 unpinned command。
- **`RELEASE_PLEASE_TOKEN`** 為 Drone repo-scope secret（scopes `repo` + `workflow`；Drone Web UI Settings → Secrets）。
- **`release-type` 不可寫在 pipeline** — 必須只放在 `release-please-config.json`（否則 Release Please 會忽略 config 的 `extra-files`，導致 `plugin.json` / `marketplace.json` 版本號不被更新）。
- **`--config-file` + `--manifest-file` 必填** — 明確引用 config，避免隱性 drift。
- ⚠️ **合併 release PR 後須確認 push webhook 有觸發 build**（GitHub 偶爾漏發 → release 卡住沒 cut）。若 trusted delivery 沒有建立，保留候選 PR，修復後由新的 trusted main delivery 重試；不得人工合併或手動執行 write command 繞過 validator。

### Release PR 自動合併契約（所有採用 repo）

Release Please 在 trusted `main` delivery 完成後，必須由該 repo source-controlled 的 validator 自動處理候選 PR；不得保留人工合併 fallback。validator 必須：

- 綁定同一個 delivery commit `C`，並確認 validate／release 前置 pipeline 都成功。
- 以 target-specific closed artifact contract 驗證精確檔案清單、版本欄位與內容；不得把另一個 repo 的檔案 allowlist 直接套用。
- 驗證官方 candidate identity（repository、base branch、head branch、作者、title／body marker）、base／head SHA 與 mergeability。
- 在 merge 前重新讀取 `main` SHA；若沒有 candidate、candidate base 已由較新 delivery 接手，或 final `main` tip 已改變，成功 no-op 並交由較新 delivery 處理。
- 其他 identity、artifact、SHA、API 或 mergeability mismatch 一律 fail closed；merge API 必須帶入剛驗證的 head SHA。

No candidate is a safe no-op；a candidate based on a newer delivery is a safe no-op；a changed final main tip is a safe no-op。其他狀態不得合併。

Validator 只能在 trusted main-delivery pipeline 執行。禁止 `pull_request_target`、candidate-head checkout／執行，以及把 write token 暴露給 PR workflow。

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

### Plugin 類型的 release / 驗證

Plugin 類型預設以 GitHub Actions `release.yml` 跑 Release Please，並以
`version-check.yml` 跑驗證。Repo 也可以明確選擇 Drone；此時
`.drone.yml` 必須同時提供 PR / `main` 的 aggregate validation 與
`main`-only release pipeline，並移除功能重疊的 `release.yml` /
`version-check.yml`。採用 Drone 的 plugin repo 仍須完成自己的 observable acceptance。

部分 plugin（如 `jurislm-plugins`）另有 `sync-plugins.yml`：發版後同步 plugin 定義到 PostgreSQL DB（dev + prod）。

**觸發方式**：手動（`workflow_dispatch` only）——原因：`GITHUB_TOKEN` 建立的 release 不會自動觸發其他 workflow（GitHub 安全限制）。

## Monorepo CI/CD（Turborepo）

所有 JurisLM monorepo 必須在 repo root 提供 `turbo.json`，並以 Turborepo 定義 workspace task 與 cache。`entire` 是唯一已驗證 reference；其他 monorepo 只有完成自己的 observable acceptance 後，才能宣稱符合。

- 已知且固定的 workspace gate 使用 `turbo run <task> --filter=<workspace>`；`--filter` 不是任意縮小檢查範圍的理由。
- `--affected` 只可在 trusted Git base／head 已明確建立、可重現且涵蓋目標 delivery 時使用。
- 無法建立可信 Git 範圍或 affected query 不確定時，執行完整 validation／deploy，不得靜默跳過。
- Turbo cache inputs 必須包含 task 實際讀取的全部 source、config、test 與 lockfile 檔案；漏列會造成 false green，必須由 policy test 或等價 readback 證明。
- monorepo 的 deployment targets 仍依 repo 類型各自定義；不得因採用 Turborepo 而複製 `entire` 的 Coolify topology 到 Plugin／npm repo。

---

## ESLint 設定

所有 repo 統一使用 ESLint 9 flat config，搭配 `--max-warnings=0`。

### 統一規則

| 規則 | 設定 | 說明 |
|------|------|------|
| `@typescript-eslint/no-explicit-any` | `error`（test 檔案豁免） | 禁用 `any` |
| `@typescript-eslint/no-unused-vars` | `error`（`_` 前綴豁免） | 未使用變數 |
| Prettier 整合 | `eslint-config-prettier` | 關閉與 Prettier 衝突的規則 |
| `.claude/worktrees/**` | ignores | 排除 feature worktree 內容 |
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
.claude/worktrees/
```

⚠️ 少了這行，`prettier --write .` 會掃到 feature worktree 內容（各自完整的 checkout），導致 pre-commit 失敗。

---

## CI Workflow 設定（Drone CI）

**lint / typecheck / test 在 Drone（`https://ci.jurislm.com`）執行**——
Coolify web app / npm-MCP / monorepo 類型使用 repo 根目錄
`.drone.yml`。Plugin 類型預設用 GitHub Actions，但允許明確選擇 Drone；
選擇後 validation 與 release 必須都由 Drone 擁有。大型 repo 可把檢查
拆成多個 pipeline；小型 plugin repo 可用單一 aggregate `validate`
pipeline。GitHub PR 顯示一個 aggregated check（`drone/pr`）。

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

單一平台原則：每個 repo 的 CI / release 應只使用一套已選定平台。
Plugin repo 預設的 `release.yml` / `version-check.yml` 不是殘留；但當該
repo 已明確選擇 Drone，它們就必須和 Drone 設定在同一個 migration
中移除，避免雙跑。

### 規範回填協議

當任一 repo 的 `.drone.yml` 發現新陷阱：在來源 repo 修復（PR 含 root cause）→ **同步**回填 `references/ci-workflow-templates.md` + 本檔 → 開 issue 追蹤其他 repo。**禁止**只修單一 repo 不回填。

---

## 部署（CD）與避免重複部署

> 完整設定步驟、守衛邏輯、secret、收尾與踩坑見 `references/ci-workflow-templates.md`「CD 與避免重複部署」「部署收尾」章節。以下為核心規範。

**Coolify auto-deploy 對每個 push main 都部署，包含 release-please 的純版號 commit** → 同一份程式碼被部署兩次（feature 合併一次、release PR 合併再一次）。解法是把部署觸發移到 Drone 並關閉 auto-deploy：

1. **`.drone.yml` 加 `build` pipeline**（`push` main + PR，一般 clone，跑 `bun run build`）與 **`deploy` pipeline**（`push` main、`depends_on` 涵蓋 `lint-typecheck`／`test`／`build`；**只有 `deploy` 用 `clone: { disable: true }`**——它只 curl Coolify API 不需要 repo 內容，`build` 需要完整 clone 才能執行建置）：curl Coolify deploy API，**守衛跳過 release commit**。
2. **守衛**：`echo "$DRONE_COMMIT_MESSAGE" | grep -qE '^chore(\(.+\))?: release [0-9]'`
   - **grep 全訊息（勿加 `head -1`）**：merge commit 合併 release PR 時 HEAD subject 為 `Merge pull request #N from …release-please…`、`chore(main): release X.Y.Z` 落在 body；加 `head -1` 只看 subject 會漏判 → release commit 誤觸發部署（2026-06-02 entire #383 實證）。全訊息 grep 同時涵蓋 merge（body 命中）與 squash（subject 命中）。`release [0-9]` 要求版號數字（排除 `chore: release notes …` 誤判）。
3. **Drone repo-scope secret `COOLIFY_DEPLOY_TOKEN`**（`pull_request: false`）。
4. **只關閉 PROD app 的 Coolify auto-deploy**（`is_auto_deploy_enabled`；先驗證 Drone→Coolify 接線可用再關，避免 prod 靜默停止部署）。
5. **加 `release-pr-auto-merge` pipeline**，讓 Release Please 在 trusted main delivery 後自動合併（Coolify web app 的部署 pipeline 仍須依 repo 類型設定；release PR 不得以人工合併作 fallback）。validator 必須遵守上方「Release PR 自動合併契約」。

**⚠️ deploy-gating 只針對 PROD（push main），不要碰 DEV**：重複部署問題只發生在 prod——release PR / 純版號 `chore` commit 合併進 main 會重觸發 prod 部署；dev（push develop）無 release PR、無此問題。且本標準 `trigger.ref` 慣例**不含 develop** → Drone 根本不在 develop push 建置 → 無法接管 dev 部署。故 **dev app 一律維持 Coolify auto-deploy 不動**；只為 prod app 設 Drone deploy pipeline + 關 prod auto-deploy。

**結果**：feature 合併進 main = prod 部署 1 次；trusted release PR 自動合併進 main = prod 部署 0 次（守衛跳過，僅 release-please 建 tag）；dev 不受影響（仍由 Coolify auto-deploy on develop push）。

**僅適用 Coolify-deployed repo**（web app）。**npm 套件 / MCP repo 不需要**——它們 publish 到 npm，只在 release commit 發布一次，無重複問題。Monorepo（多 app）須為每個 **prod** app 各設一個 deploy step（dev app 不設，維持 auto-deploy）。

⚠️ **合併任何 PR 進 main 後務必確認 push webhook 有觸發 build**（GitHub 偶爾漏發 → release / deploy 卡住）。若 delivery 沒建立，保留 release candidate，修復後由新的 trusted main delivery 重試，不得人工合併或手動執行 write command 繞過 validator。

---

## Code Review 設定

標準**不含**自動 Claude PR 審查（2026-06-02 移除：`claude-code-review.yml` / `claude.yml` / Drone `claude-review` pipeline 皆不再設定，`CLAUDE_CODE_OAUTH_TOKEN` secret 不需要）。code review 採三層：

- **人工 `/code-review`**：發 PR 前必跑多角度 review（見全域 CLAUDE.md PR 流程）。
- **Bot 自動審查**（獨立運作、無需額外 CI 設定）：**CodeRabbit**（PR 自動回審）+ **GitHub Copilot**（透過 `.github/copilot-instructions.md` 客製化指示；首行加「請使用繁體中文回覆所有問題與建議。」；模板見 `references/code-review-setup.md`）。
- **Review 發布**：正式 review 用 `gh pr review <number> --comment --body-file review.md`（顯示在 Reviews 區），**勿**用 `gh pr comment`（發到一般留言區）。

> 為何移除自動 Claude 審查：用戶決定改回人工 `/code-review` + bot；自動 Claude pipeline 每 PR 計費且維運成本高。

---

## 新增 Repo Checklist

完整 checklist（AGENTS.md / Git Worktree / Runtime / 測試 / Release / ESLint / CI / CD / Code Review）見 `references/new-repo-checklist.md`。

**快速概覽**（各類別必做項）：
- **AGENTS.md**：若 repo 內存在 `AGENTS.md`，更新為讀取同層或 repo 根目錄 `CLAUDE.md`；不要複製 CLAUDE 全文
- **Worktree**：feature worktree 直接從 main 建立於 `.claude/worktrees/<change-name>`，不建立 develop；`.claude/worktrees/` 不進 `.gitignore`（由 Claude Code runtime 本地排除）
- **Bun**：`"packageManager": "bun@1.3.14"`，scripts 換成 `bun run vitest` 等
- **Release**：Drone repo 使用 `main`-only release pipeline，依序執行固定精確版本的 `github-release`、`release-pr`；`release-type` 放在 config，Plugin repo 加 `extra-files`，secret 使用 `RELEASE_PLEASE_TOKEN`，並由同一 trusted delivery 的 source-controlled validator 自動合併 release PR；無人工 fallback
- **Release 資格閘門**：使用 `release-type: simple` 的 Drone Plugin repo 必須在 `release-pr` 前執行 `scripts/release-eligibility.mjs`；只有 exit `0` 才呼叫 Release Please，exit `10` 成功跳過，其他錯誤 fail closed；完整模板見 `references/ci-workflow-templates.md`
- **Monorepo**：所有 JurisLM monorepo 必須有 root `turbo.json`；已知 workspace 用 `--filter`，可信 Git base／head 才能用 `--affected`，否則完整 validation／deploy，cache inputs 必須涵蓋 task 讀取的全部檔案
- **ESLint**：`eslint --max-warnings=0`，`.prettierignore` 加 `.claude/worktrees/`
- **CI**：Drone repo 的檢查 pipeline `trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`（**勿**列 develop）；plugin repo 若選 Drone，validation 與 release 一起遷移並移除重疊 GHA
- **CD**（Coolify web app）：`.drone.yml` 加 `build`、`deploy`、`release-pr-auto-merge` 三個 pipeline + release-commit 守衛 + 關閉 Coolify auto-deploy + secret `COOLIFY_DEPLOY_TOKEN`（npm/MCP repo 不需要）
- **Code Review**：人工 `/code-review` + bot（CodeRabbit / Copilot via `.github/copilot-instructions.md`）；**無**自動 Claude review（2026-06-02 移除）
