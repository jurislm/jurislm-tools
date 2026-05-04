# CI Workflow 模板（lint / typecheck / test）

## 核心原則：避免 push + pull_request 雙重觸發

GitHub Actions 的 `push` 與 `pull_request` 是**獨立 event**，各自有不同的 `github.ref`：

| Event | `github.ref` | 觸發時機 |
|-------|--------------|---------|
| `pull_request: synchronize` | `refs/pull/N/merge` | PR 收到新 commit |
| `push: develop` | `refs/heads/develop` | branch 收到新 commit |

當 push 到一個**已開 PR 的中間分支**（如 `develop` → `main`），兩個 event 同時發生 → CI 跑兩次。
**concurrency group 無法 dedupe**（因為 ref 不同，落在不同 group）→ 每次 push 浪費雙倍 CI 分鐘。

### Anti-pattern（禁止）

```yaml
# ❌ 重複觸發：push: develop 與 pull_request 重疊
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main
      - develop  # ← 重複觸發來源，必須移除
```

### 正確 pattern

```yaml
# ✅ 中間分支由 pull_request 覆蓋，push 只留 main 作為 post-merge safety net
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main  # post-merge safety net only
  workflow_dispatch:
```

**為什麼 main 要留 `push` trigger**：
- `main` 主要透過 PR merge 進入，理論上 PR 階段已跑過 CI
- 但仍可能有 force-push、rebase merge、hotfix direct push、Release Please commit 等
- `push: main` 作為 post-merge safety net，保證 main 永遠有 green CI 紀錄

---

## 標準模板：Node/TS Repo（MCP server 等）

`.github/workflows/ci.yml`：

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint

  typecheck:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run typecheck

  test:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run test
```

**設計重點**：
- `if: github.event.pull_request.draft == false` — draft PR 不跑（push event 此判斷為 true，仍會跑 main push）
- 三個 job 並行（lint / typecheck / test 互相獨立）
- `--frozen-lockfile` 確保 lockfile 一致性
- concurrency group 用 `github.ref` — 同一 PR 後續 push 取消舊 run

---

## 標準模板：Next.js Repo（lawyer / lexvision / stock 等）

與 Node/TS 模板相同，但加入 `build` job：

```yaml
  build:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run build
        env:
          # 提供 build-time placeholder env vars（避免 build 失敗）
          # 實際值由 Coolify 在 deploy 時注入，build 階段只需通過 type/syntax 檢查
          DATABASE_URL: postgresql://localhost/placeholder
          NEXTAUTH_SECRET: build-placeholder-must-be-at-least-32-chars-long
```

---

## 標準模板：Plugin Repo（jurislm-tools / jurislm-plugins）

純文字 plugin 不需 lint/typecheck/test，只需 JSON 驗證：

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate marketplace.json
        run: jq . .claude-plugin/marketplace.json
      - name: Validate plugin.json files
        run: |
          find plugins -name plugin.json -exec jq . {} \;
```

---

## 標準模板：Monorepo（entire）

Turborepo monorepo 用 `turbo` 跑跨 package CI：

```yaml
jobs:
  ci:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
```

`turbo` 會自動快取通過的 package，PR diff 只觸發受影響 package 的 CI。

---

## Audit 既存 Repo

掃描 jurislm 組織下所有 repo 的 ci.yml，找出 `push: develop` 與 `pull_request` 同時存在的設定：

```bash
# 列出所有 jurislm repo
gh repo list jurislm --limit 50 --json name -q '.[].name'

# 掃單一 repo 的 ci.yml trigger 設定
for repo in $(gh repo list jurislm --limit 50 --json name -q '.[].name'); do
  echo "=== $repo ==="
  gh api "repos/jurislm/$repo/contents/.github/workflows/ci.yml" \
    --jq '.content' 2>/dev/null | base64 -d 2>/dev/null \
    | grep -A5 "^on:" || echo "(no ci.yml)"
done
```

或用 `gh search code` 直接定位錯誤 pattern：

```bash
gh search code 'push: branches: develop' --owner jurislm --filename ci.yml
```

---

## 規範回填協議（持續學習迴路）

當任一 repo 的 ci.yml 發現新陷阱：

1. 在來源 repo 修復（PR 含 root cause 分析）
2. **同步**回填到此模板（`references/ci-workflow-templates.md`）
3. 在 `jurislm-tools` 開 issue 追蹤其他 repo 是否需同步
4. SKILL.md 主檔案的 anti-pattern 清單視需要更新

**禁止**：只修單一 repo 不回填模板 → 下一個新 repo 仍會踩同個雷。

---

## 參考

- Issue：[jurislm-tools#82 — CI workflow pattern: duplicate runs from push + pull_request triggers on PR'd branches](https://github.com/jurislm/jurislm-tools/issues/82)
- Fix 範例：[jurislm/coolify-mcp PR #25 (commit `ad447c3`)](https://github.com/jurislm/coolify-mcp/pull/25)
