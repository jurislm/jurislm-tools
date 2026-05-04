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

## Draft PR 跳過條件（push-safe 寫法）

要讓 draft PR 不跑 CI，但 `push: main` 與 `workflow_dispatch` 仍正常執行，**必須先判斷 event_name**：

```yaml
# ✅ 正確：push / workflow_dispatch 不存在 pull_request 物件，先排除
if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
```

**為什麼不能直接 `if: github.event.pull_request.draft == false`**：
- `push` event 沒有 `pull_request` 物件 → `github.event.pull_request` 為 null
- `null.draft == false` 評估為 **false** → job 被跳過 → `push: main` safety net 完全失效

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
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint

  typecheck:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run typecheck

  test:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
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
- `if:` 條件 push-safe — 只在 `pull_request` event 且為 draft 時跳過；`push` / `workflow_dispatch` 一律執行
- 三個 job 並行（lint / typecheck / test 互相獨立）
- `--frozen-lockfile` 確保 lockfile 一致性
- concurrency group 用 `github.ref` — 同一 PR 後續 push 取消舊 run

---

## 標準模板：Next.js Repo（lawyer / lexvision / stock 等）

完整模板與 Node/TS 相同（`name:` / `on:` / `concurrency:` / `lint` / `typecheck` / `test` 三個 job），**追加** `build` job 至 `jobs:` 區塊：

```yaml
  # 此 job 需插入 Node/TS 完整模板的 jobs: 區塊（與 lint/typecheck/test 並列）
  build:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
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

⚠️ 上方為 `build` job **片段**，需與 Node/TS 完整模板合併使用，不可單獨複製當作完整 workflow。

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
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
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
  ci:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
```

**Turborepo 加速建議**：若 monorepo 使用 Turborepo，可在 `package.json` 將 `lint` / `typecheck` / `test` script 委派至 `turbo run lint` 等，利用 `turbo` 的 cache 與 affected-only 執行，自動跳過未受 PR 變更影響的 package。

---

## Audit 既存 Repo

GitHub code search 以**逐行文字比對**運作，多行 YAML（`push:` / `branches:` / `- develop` 各佔一行）無法用單行字串命中。實務上用以下兩種方式：

```bash
# 方式 1：直接逐 repo 解碼 ci.yml，用 grep 看 on: 區塊
for repo in $(gh repo list jurislm --limit 50 \
    --json name,isArchived,pushedAt -q '.[] | select(.isArchived == false) | .name'); do
  echo "=== $repo ==="
  gh api "repos/jurislm/$repo/contents/.github/workflows/ci.yml" \
    --jq '.content' 2>/dev/null | base64 -d 2>/dev/null \
    | sed -n '/^on:/,/^[a-zA-Z][a-zA-Z]*:/p' | head -25 \
    || echo "(no ci.yml)"
done
```

```bash
# 方式 2：用 gh search code 找含 develop 的 ci.yml（再人工確認 on: 區塊）
gh search code 'develop' --owner jurislm --filename ci.yml
```

⚠️ **棄用 repo 過濾**：上方使用 `--json isArchived,pushedAt` 過濾 archived repo；若需更嚴格，可加 `select(.pushedAt > "2025-01-01")` 之類的時間條件。

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
- Review 修正：[jurislm-tools PR #83 review feedback](https://github.com/jurislm/jurislm-tools/pull/83)（push-safe `if:` 條件）
