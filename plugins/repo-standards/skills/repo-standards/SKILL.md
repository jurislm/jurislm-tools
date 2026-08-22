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

| 類型 | 適用 Repo | CI 平台 | release-type | Runtime | ESLint 基礎 |
|------|---------|--------|-------------|---------|------------|
| **Next.js** | Next.js web app repos | Drone | `node` | Bun | `eslint-config-next` |
| **Node/TS** | Node／TypeScript service repos | Drone | `node` | Bun | `@eslint/js` + `typescript-eslint` |
| **Plugin** | Content-first plugin repos | Drone | `simple` | — | 無 TS 原始碼，不需要 ESLint |
| **Monorepo** | `jurislm/entire`（唯一已驗證 reference）及其他待驗收 monorepo | Drone | `node` | Bun | `@entire/eslint-config` 或目標 repo 的既有設定 |

自架 Drone（`https://ci.jurislm.com`）是唯一的 CI 與 release 平台，四種 repo 類型一律適用。
新 repo 直接建立 `.drone.yml`；既有 repo 若仍在其他平台，遷移與移除舊 workflow 屬同一次交付。

`references/ci-workflow-templates.md` 的模板以部署形態命名，對應關係是
Next.js → 模板 A（Coolify web app）、Monorepo → 模板 B、Node/TS → 模板 C（npm / MCP）、
Plugin → 模板 D。

⚠️ 上游 fork（例如 `jurislm/firecrawl`）保留上游自己的 workflow，不受本規範約束——
那些檔案是上游資產。本規範只涵蓋 JurisLM 自有的 repo。

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

## 變更追蹤

**預設以 Linear issue 作為需求、範圍、驗收標準與交付狀態的唯一紀錄**，比照
`jurislm-tools` 根目錄 `CLAUDE.md` 的 Linear + Superpowers 交付鏈。不要建立、引用或
依賴 GitHub Issue。

標準變更影響其他 adoption target 時，用 Linear 的 project、issue 關聯與
blocks／blocked-by 記錄目標與相依關係。

⚠️ **前置條件:已連接的 Linear workspace**（讀寫 issue 用）。`spectra init` 可以由目標
repo 自己跑起來，Linear 不行——沒有 workspace 就沒有預設路徑可走。目標 repo 未接
Linear 時，**開始非瑣碎變更前先問使用者要用哪個追蹤容器**，不要自行假設，也不要因此
略過追蹤。

**只有使用者明確要求 Spectra／OpenSpec 時**才改用它：那時先執行 `spectra --version`，
目標 repo 缺少 `openspec/` 或 `.spectra.yaml` 就先在根目錄 `spectra init`，之後一律以
`proposal → design → specs → tasks` 作為該次交付的唯一紀錄。兩套不混用——一次交付
只屬於其中一個容器。

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

release-please 一律在 Drone 執行，四種 repo 類型皆同——**Coolify web app /
npm-MCP / monorepo / plugin** 都使用 repo 根目錄的 `.drone.yml`。標準順序是
先 `github-release`（cut 已合併 release PR），再 `release-pr`（維護下一個版本
PR）。完整模板與變體見 `references/ci-workflow-templates.md`。

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
      GITHUB_API_TOKEN: { from_secret: GITHUB_API_TOKEN }
    commands:
      - npx --yes release-please@<EXACT-RELEASE-PLEASE-VERSION> github-release --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$GITHUB_API_TOKEN
  - name: release-pr
    image: node:20-alpine
    depends_on: [github-release]
    environment:
      GITHUB_API_TOKEN: { from_secret: GITHUB_API_TOKEN }
    commands:
      - npx --yes release-please@<EXACT-RELEASE-PLEASE-VERSION> release-pr --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$GITHUB_API_TOKEN
```

**規則**：
- 先 `github-release`（建 tag / release）再 `release-pr`（維護下一個版本 PR），兩者皆冪等；若反過來，尚未 cut 的已合併 release PR 可能阻擋新 release PR。
- 所有會寫 GitHub 的 Release Please command 都必須使用 `release-please@<EXACT-RELEASE-PLEASE-VERSION>`；目標 repo 必須替換為經測試的精確版本，禁止 unpinned command。
- **`GITHUB_API_TOKEN`** 為 Drone repo-scope secret（Drone Web UI Settings → Secrets）。classic PAT 最小需求是 `repo` 一個 scope；
  `workflow` 僅在該 repo 有 `.github/workflows/` 時才需要（實查七個 JurisLM repo 皆無）。⚠️ 現行那顆開了 21 個 scope，屬過度授權。
  ⚠️ 它是**跨 JurisLM 各 repo 共用的同一份憑證**，且用途不只 release-please（`release-pr-auto-merge`、`deploy` 也用它）。
  輪替時必須同步更新每一個 repo 的同名 secret；fine-grained PAT 另需 Issues: Read and write（`autorelease:` label），
  有 `release-pr-auto-merge` 的 repo 再加 Administration: Read（讀 branch protection）。
- **`release-type` 不可寫在 pipeline** — 必須只放在 `release-please-config.json`（否則 Release Please 會忽略 config 的 `extra-files`，導致 `plugin.json` / `marketplace.json` 版本號不被更新）。
- **`--config-file` + `--manifest-file` 必填** — 明確引用 config，避免隱性 drift。
- ⚠️ **合併 release PR 後須確認 push webhook 有觸發 build**（GitHub 偶爾漏發 → release 卡住沒 cut）。若 trusted delivery 沒有建立，保留候選 PR，修復後由新的 trusted main delivery 重試；不得人工合併或手動執行 write command 繞過 validator。

### Release PR 自動合併契約（所有採用 repo）

Release Please 在 trusted `main` delivery 完成後，必須由該 repo source-controlled 的 validator 自動處理候選 PR；不得保留人工合併 fallback。validator 必須：

- 綁定同一個 delivery commit `C`，並確認 validate／release 前置 pipeline 都成功。
- 以 target-specific closed artifact contract 驗證精確檔案清單、版本欄位與內容；不得把另一個 repo 的檔案 allowlist 直接套用。
- 驗證官方 candidate identity（repository、base branch、head branch、作者、title／body marker）、base／head SHA、required-check clean 狀態與 mergeability。
- 在寫入前驗證 target branch protection／ruleset：candidate 必須受 latest-base required checks 約束，automation credential 不可繞過，且 release PR 不得要求人工 approval；legacy branch protection 需 `strict: true` 且對 admin credential 啟用 enforcement。
- 只用 GitHub PR merge API 並傳入剛驗證的 head SHA；每個 target 必須先 readback target-compatible merge mode。採 Conventional Commit eligibility 的 target 預設 squash-only，並以已驗證 PR title 作 squash title；若沒有 candidate、candidate base 已由較新 delivery 接手、候選等待時 reread 證實 main 已改變，或 GitHub 拒絕 stale merge 後 reread 證實 main 已改變，成功 no-op 並交由較新 delivery 處理。
- 其他 identity、artifact、SHA、protection、required-check、API 或 mergeability mismatch 一律 fail closed；不得直接更新 main ref。

Release eligibility 的 Compare request 必須綁定 immutable `DRONE_COMMIT`，並從該 commit
沿 first-parent mainline 回到已發布 tag；Compare side branch 的中間提交不可當作 main
delivery subject。first-parent path 不完整時 fail closed。若須為既有 GitHub default merge
歷史做 recovery，僅能接受精確 default merge subject 與通過 Conventional Commit 驗證的
body title；未來 merge policy 不得依賴此相容性分支。

No candidate is a safe no-op；a candidate based on a newer delivery is a safe no-op；a waiting candidate or rejected protected merge that proves main changed is a safe no-op。其他狀態不得合併。

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

Plugin repo（如 `jurislm-tools`）需加 `extra-files` 同步版本號：

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

Plugin 類型的 `.drone.yml` 必須同時提供 PR / `main` 的 aggregate validation 與
`main`-only release pipeline。每個 plugin repo 仍須完成自己的 observable
acceptance，才算符合本標準。

repo 若另有與 CI／release 無關、具獨立語意的 workflow（例如發版後手動觸發的資料
同步），保留與否的判準見 `references/ci-workflow-templates.md`。

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

**lint / typecheck / test 一律在自架 Drone（`https://ci.jurislm.com`）執行**——
四種 repo 類型都使用 repo 根目錄的 `.drone.yml`，validation 與 release 都由
Drone 擁有。大型 repo 可把檢查拆成多個 pipeline；小型 plugin repo 可用單一
aggregate `validate` pipeline。GitHub PR 顯示一個 aggregated check（`drone/pr`）。

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

單一平台原則：每個 repo 的 CI 與 release 只由 Drone 擁有。既有 repo 遷移時，舊平台上所有負責 CI、release 或版本檢查的 workflow 都必須和 Drone
設定在同一次交付中移除，避免雙跑。**認定依用途，不依檔名**——常見的是
`.github/workflows/` 底下的 `ci.yml`、`release.yml`、`version-check.yml`，但實際檔名
由各 repo 自訂，audit 時要讀 workflow 內容而不是比對這份清單。與 CI／release 無關、
具獨立語意的 workflow 不在此列。

### 規範回填協議

當任一 repo 的 `.drone.yml` 發現新陷阱：在來源 repo 修復（PR 含 root cause）→ **同步**回填 `references/ci-workflow-templates.md` + 本檔 → 在該次交付的追蹤紀錄裡登記其他 adoption target（Linear：issue 關聯；選用 Spectra 的 repo：proposal 的 Delivery Relations）。**禁止**只修單一 repo 不回填。

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

PR review 與 merge 的唯一操作契約是目標 repo 自身的 `CLAUDE.md`。目標 repo 缺少
`## PR review and merge contract` 時，先將本 skill 的
`references/review-orchestration-template.md` 複製進其 `CLAUDE.md`，再依 repo 的
required checks 與部署方式客製化。建立 PR 後必須 invoke
`superpowers:requesting-code-review`；收到 finding 時以
`superpowers:receiving-code-review` 逐項處置、修正或記錄具體拒絕理由，並 resolve
所有 review thread。合併前還必須符合 CI、`MERGEABLE`／`CLEAN`、Copilot 與
CodeRabbit gate。

目標 repo 使用 `engineering-delivery` 時，本地 review 由該 Skill invoke
`superpowers:requesting-code-review` 擁有；外部 review 交給 `coderabbit:code-review`
skill，不另起第二套審查機制。

repo 設定必須提供以下前置條件：

- CodeRabbit：`.coderabbit.yaml` 設定 `reviews.auto_review.enabled: false`，每個 PR
  只明確 request App 一次；CLI 只依 canonical contract 作為 App 無法產生有效 review
  時的 fallback。
- Copilot：建立針對 repo 客製化的 `.github/copilot-instructions.md`；每個 PR 一次
  review budget。
- Codex：被動審查，不主動觸發或等待。
- 不設定自動 Claude PR review pipeline：不新增 `claude-code-review.yml`、`claude.yml`
  或 Drone `claude-review`，也不需要 `CLAUDE_CODE_OAUTH_TOKEN`。

完整的 consent、secret preflight、外部審查預算與 gate 細節只以 canonical contract
為準，避免在此複製而 drift。

---

## 新增 Repo Checklist

完整 checklist（AGENTS.md / Git Worktree / Runtime / 測試 / Release / ESLint / CI / CD / Code Review）見 `references/new-repo-checklist.md`。

**快速概覽**（各類別必做項）：
- **AGENTS.md**：若 repo 內存在 `AGENTS.md`，更新為讀取同層或 repo 根目錄 `CLAUDE.md`；不要複製 CLAUDE 全文
- **變更追蹤**：預設用 Linear issue 記錄需求、範圍與驗收；跨 repo 目標用 Linear 的 project 與 issue 關聯表示。僅在使用者明確要求時改用 Spectra 四件套
- **Worktree**：feature worktree 直接從 main 建立於 `.claude/worktrees/<change-name>`，不建立 develop；`.claude/worktrees/` 不進 `.gitignore`（由 Claude Code runtime 本地排除）
- **Bun**：`"packageManager": "bun@1.3.14"`，scripts 換成 `bun run vitest` 等
- **Release**：使用 `main`-only release pipeline，依序執行固定精確版本的 `github-release`、`release-pr`；`release-type` 放在 config，Plugin repo 加 `extra-files`，secret 使用 `GITHUB_API_TOKEN`，並由同一 trusted delivery 的 source-controlled validator 自動合併 release PR；無人工 fallback
- **Release 資格閘門**：使用 `release-type: simple` 的 Plugin repo 必須在 `release-pr` 前執行 `scripts/release-eligibility.mjs`；只有 exit `0` 才呼叫 Release Please，exit `10` 成功跳過，其他錯誤 fail closed；完整模板見 `references/ci-workflow-templates.md`
- **Delivery subject**：資格閘門必須對 immutable `DRONE_COMMIT` 走 first-parent mainline；對 Conventional Commit target，GitHub merge setting 預設 readback 為 squash-only + pull-request title 作 squash title
- **Monorepo**：所有 JurisLM monorepo 必須有 root `turbo.json`；已知 workspace 用 `--filter`，可信 Git base／head 才能用 `--affected`，否則完整 validation／deploy，cache inputs 必須涵蓋 task 讀取的全部檔案
- **ESLint**：`eslint --max-warnings=0`，`.prettierignore` 加 `.claude/worktrees/`
- **CI**：檢查 pipeline `trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`（**勿**列 develop）；既有 repo 遷移時，舊平台上所有 CI、release 與版本檢查用途的 workflow 在同一次交付移除（依用途認定，不依檔名）
- **CD**（Coolify web app）：`.drone.yml` 加 `build`、`deploy`、`release-pr-auto-merge` 三個 pipeline + release-commit 守衛 + 關閉 Coolify auto-deploy + secret `COOLIFY_DEPLOY_TOKEN`（npm/MCP repo 不需要）
- **Code Review**：將 packaged review contract 寫入目標 `CLAUDE.md` 後，依其 invoke Skill-driven review；CodeRabbit 一次明確 App request、Copilot 一次、Codex 被動；**無**自動 Claude review
