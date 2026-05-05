# Code Review 設定

## Copilot 自訂指示檔案

GitHub Copilot 支援三種層級的指示，**同時**提供給 Copilot（非互斥）：

| 檔案路徑 | 套用範圍 | 說明 |
|---------|---------|------|
| `.github/copilot-instructions.md` | 整個 repo | 全域指引，適用所有 Copilot 請求 |
| `.github/instructions/*.instructions.md` | 依 glob 路徑 | 需加 frontmatter `applyTo`，精準控制套用範圍 |
| `.github/prompts/*.prompt.md` | 手動觸發 | VS Code / Visual Studio / JetBrains 可用，以 `/promptname` 呼叫 |

**優先順序**：Personal > Repository > Organization（均會提供，Personal 最優先）

**環境支援矩陣**：

| 環境 | repo-wide | path-specific | prompt files |
|------|-----------|--------------|-------------|
| GitHub.com | ✅ | ✅ | ✅ |
| VS Code | ✅ | ✅ | ✅ |
| Visual Studio | ✅ | ❌ | ✅ |
| JetBrains | ✅ | ❌ | ❌ |

**路徑特定指示 frontmatter 欄位**：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `applyTo` | ✓ | Glob 語法，多個模式用逗號分隔（如 `"**/*.ts,**/*.tsx"`） |
| `excludeAgent` | ✗ | 防止指定 agent 使用此檔案：`"code-review"` 或 `"cloud-agent"` |

**路徑特定指示範例**（`.github/instructions/typescript.instructions.md`）：

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
excludeAgent: "code-review"
---

禁止使用 `any` 類型。使用 `unknown` + type guard 代替。
```

**格式規則**：
- 純 Markdown；路徑特定指示需加 frontmatter
- 無硬性字數限制，但保持精簡（直接下指令，避免模糊描述）
- `.github/copilot-instructions.md` 放 repo 通用規則；語言/框架專屬規則放 `.github/instructions/`

**Node.js/CommonJS Repo 標準模板**：

```markdown
# Copilot Instructions

## 語言與執行環境
- 此專案使用 Node.js（CommonJS，`require`/`module.exports`），不使用 TypeScript 或 ESM
- 不建議使用 `import`/`export` 語法

## 程式碼風格
- 預設使用 `const`；僅在需要重新賦值時使用 `let`，不使用 `var`
- 非同步函式統一使用 `async/await`，避免 `.then()` chain
- 下劃線前綴（`_param`）表示刻意不使用的參數，ESLint 允許此模式

## 測試
- 測試框架為 Jest，新功能必須附帶單元測試
- 不建議使用 Vitest 特有 API（如 `vi.fn()`），統一使用 `jest.fn()`

## Code Review 重點
- 標記任何 `eval()` 或 `new Function()` 使用為安全疑慮
- 用戶輸入直接拼接到字串中（潛在 injection）需標記
- `async` 函式缺少 try/catch 或 `.catch()` 需提醒（unhandled rejection 風險）

## 忽略範圍
- 不審查 `node_modules/`、`dist/`、`coverage/` 目錄下的檔案
- 不對自動生成的 mock 檔案提出風格建議
```

**Next.js Repo 標準模板**：

```markdown
# Copilot Instructions

## 語言與執行環境
- 此專案使用 Next.js（App Router）+ TypeScript
- 禁止使用 `any` 類型，測試檔案除外

## 程式碼風格
- React 元件使用 `const` arrow function，不使用 `function` 宣告
- 伺服器元件優先（Server Components first）；需要互動才使用 `'use client'`
- 所有非同步操作使用 `async/await`

## 測試
- 測試框架為 Vitest + Testing Library
- 不建議 Jest 特有 API，統一使用 `vi.fn()`、`vi.mock()`

## Code Review 重點
- 標記直接暴露在 Client Component 的敏感資料（API key、token）
- `useEffect` 缺少 dependency array 或 cleanup 需提醒
- SQL 字串拼接需標記（injection 風險）

## 忽略範圍
- 不審查 `.next/`、`out/`、`node_modules/` 目錄
- 不對 `next-env.d.ts` 提出修改建議
```

> **注意**：依照 repo 的實際技術棧調整模板，不需要完全照搬。核心原則是「具體且可操作」。

---

## 標準 .github/workflows/claude-code-review.yml

此 workflow 的 prompt 採用多段式架構（FETCH → FILTER → TRIAGE → WRITE → POST），支援 profile 切換（chill / assertive），並內建 path filter、diff 範圍限制、finding cap 等機制，避免生成過多低品質建議。

### 設計原則

| 原則 | 說明 |
|------|------|
| **Diff-bounded scope** | 只審查此 PR 新增 / 修改的行，不標記既有程式碼 |
| **Evidence required** | 每個 finding 必須附 `file:line` + 具體觸發情境 |
| **Severity honesty** | 介於兩級之間時，取較低級 |
| **Actionability cap** | fix 規模不超過此 PR 的 diff 大小，否則降為 INFO |
| **Mechanical conclusion** | 有 HIGH/CRITICAL → 需修改；否則 → 可合併（不依 finding 數量）|
| **Profile gate** | chill 模式：只輸出 HIGH/CRITICAL；assertive 模式：也輸出 MEDIUM/LOW/INFO |

### Profile 切換方式

| 方式 | 說明 |
|------|------|
| 預設 | `chill`（只輸出 HIGH/CRITICAL）|
| PR label | 加上 `review:assertive` label → 自動切換為 assertive |
| 手動觸發 | `workflow_dispatch` → 選擇 profile 輸入 |

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
  workflow_dispatch:
    inputs:
      profile:
        description: Review profile (chill = HIGH/CRITICAL only; assertive = also MEDIUM/LOW/INFO)
        default: chill
        type: choice
        options: [chill, assertive]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Determine review profile
        id: profile
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          # workflow_dispatch input takes highest priority
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "profile=${{ inputs.profile }}" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          # PR label 'review:assertive' overrides default
          if gh pr view ${{ github.event.pull_request.number }} \
              --json labels -q '.labels[].name' \
              | grep -qx "review:assertive"; then
            echo "profile=assertive" >> "$GITHUB_OUTPUT"
          else
            echo "profile=chill" >> "$GITHUB_OUTPUT"
          fi

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: '--allowedTools "Bash(gh:*),Write"'
          prompt: |
            REVIEW_PROFILE: ${{ steps.profile.outputs.profile }}

            You are a code reviewer for PR #${{ github.event.pull_request.number }}.
            Goal: catch real defects this PR introduces. Match findings to severity
            honestly. Do NOT generate volume to look thorough.

            ## Operating Principles

            1. **Diff-bounded scope** — review only lines this PR adds/modifies. Do
               not flag pre-existing content unless this PR worsens it.
            2. **Evidence required** — every finding cites file:line + concrete
               trigger (input/scenario that breaks). No "Consider..." vagueness.
            3. **Severity honesty** — when between two levels, pick the lower.
            4. **Actionability cap** — fix size ≤ this PR's diff size, otherwise
               mark as INFO or open follow-up issue, do NOT block.
            5. **No architectural redesign suggestions** — surface as INFO if at all.
            6. **Profile-aware**:
               - chill: report only ⚠️ Potential Issue at HIGH/CRITICAL.
                 Drop everything else (or surface as INFO if cross-cutting).
               - assertive: also report 🛠️ Refactor (MEDIUM) and 🧹 Nitpick (LOW/INFO).

            ## Phase 1 — FETCH

            ```
            gh pr view ${{ github.event.pull_request.number }} --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions,labels
            gh pr diff ${{ github.event.pull_request.number }} --name-only
            gh pr diff ${{ github.event.pull_request.number }}
            ```

            Note total_diff_size = additions + deletions. Use it as the
            actionability reference: a fix larger than the PR itself is almost
            always a follow-up, not a block.

            ## Phase 2 — FILTER & CONTEXT

            ### Path filter (drop findings on these files entirely)

            Skip any file matching:
            - Build/deps: `**/dist/**`, `**/build/**`, `**/node_modules/**`,
              `**/.next/**`, `**/.nuxt/**`, `**/coverage/**`, `**/.turbo/**`
            - Lock files: `**/*.lock`, `**/package-lock.json`, `**/yarn.lock`,
              `**/pnpm-lock.yaml`, `**/bun.lockb`, `**/Cargo.lock`,
              `**/Gemfile.lock`, `**/composer.lock`
            - Generated: `**/generated/**`, `**/__generated__/**`,
              `**/*.generated.*`, `**/*.gen.*`, `**/*.pb.go`, `**/*.pb.ts`
            - Binary/media: `**/*.{png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,otf,eot,mp3,mp4,wav,mov,pdf,zip,tar,gz}`
            - Minified: `**/*.min.{js,css}`, `**/*.min.js.map`
            - Snapshots: `**/__snapshots__/**`, `**/*.snap`

            ### CLAUDE.md as primary rulebook

            ```
            gh api "repos/${{ github.repository }}/contents/CLAUDE.md?ref=${{ github.event.pull_request.head.sha }}" --jq '.content' | base64 -d
            ```

            Extract a checklist of explicit ❌ / 禁止 / MUST / NEVER rules from
            CLAUDE.md. Any violation in PR's added/modified lines is HIGH minimum.

            ### File-type → applicable categories

            | File type | Categories that apply |
            |-----------|----------------------|
            | Code (`.ts`, `.tsx`, `.py`, `.go`, `.rs`, ...) | Correctness, Type Safety, Security, Performance, Completeness, Pattern Compliance, Maintainability |
            | Docs (`.md`) | Factual accuracy, Internal consistency, Pattern Compliance, Cross-reference validity |
            | CI/config (`.yml`, `.yaml`) | Correctness (does it run?), Security (secrets/permissions), Pattern Compliance |
            | Data (`.json`) | Schema correctness, Pattern Compliance |

            For each non-filtered file, fetch full content at PR head ONLY to
            understand context for diff lines. Do not flag pre-existing content.

            ```
            gh api "repos/${{ github.repository }}/contents/{file}?ref=${{ github.event.pull_request.head.sha }}" --jq '.content' | base64 -d
            ```

            ## Phase 3 — INTERNAL TRIAGE

            **Step A** — Generate candidate findings (think internally; do not post).
            For each diff hunk in non-filtered files, list every potentially
            suspicious thing. Be liberal here.

            **Step B** — Filter pipeline. Each candidate must pass ALL:
            1. Is it on lines this PR added/modified? (else drop — out of scope)
            2. Can you describe the concrete trigger? (else drop — speculation)
            3. Is fix size ≤ total_diff_size? (else demote to INFO or follow-up)
            4. Is the file-type ↔ category combo applicable? (else drop)

            **Step C** — Apply Type × Severity matrix.

            Types (orthogonal to severity):
            - ⚠️ **Potential Issue** — bug / security / data risk / spec mismatch
            - 🛠️ **Refactor Suggestion** — maintainability / performance improvement
            - 🧹 **Nitpick** — style / wording / minor doc polish

            Severity bar (with anchor examples):
            - 🔴 **CRITICAL** — security vulnerability, data loss, crash on common
              input. *Blocks merge. No follow-up acceptable.*
            - 🟠 **HIGH** — logic bug breaking documented use case, CLAUDE.md ❌
              rule violation, silently wrong output.
              Anchor: `if: github.event.pull_request.draft == false` on push event
              silently disables safety net.
              *Blocks merge.*
            - 🟡 **MEDIUM** — quality issue causing friction within next few changes;
              contradiction with existing rules.
              Anchor: rule doc says "嚴禁 hotfix push to main" but new template
              lists "hotfix direct push" as expected event.
              *Recommended; does NOT block; follow-up issue acceptable.*
            - 🔵 **LOW** — style/wording polish.
              Anchor: env var comment could note "names differ per app".
              *Optional. Never blocks.*
            - ⚪ **INFO** — pure FYI; observation worth noting but no action expected.
              Anchor: "this PR introduces a self-referential link to itself; common
              in changelog-style files, accept as is".
              *Never blocks. Author may ignore.*

            **Step D** — Profile gate:
            - chill: keep only ⚠️ Potential Issue at HIGH/CRITICAL. Drop the rest
              (or surface a single one as ⚪ INFO if it has cross-cutting impact).
            - assertive: keep all types at all severities up to LOW; INFO for
              cross-cutting observations only.

            **Step E** — Cap by PR size:
            - total_diff_size < 100: max 5 findings
            - 100–500: max 7 findings
            - > 500: max 10 findings

            If over cap, keep highest severity. Append a line:
            "另有 N 條較低 severity 建議省略。"

            ## Phase 4 — WRITE REVIEW

            Write to "review.md" in Traditional Chinese using this format:

            ## Code Review

            ### 變更摘要
            1–3 bullets capturing intent. Do not restate the diff.

            ### 優點 (略過此節 if nothing concrete to praise)
            Include only specific, non-trivial praise. Skip "符合規範" / "結構合理"
            filler.

            ### 問題與建議

            For each finding:
            ```
            [TYPE icon] [SEVERITY] file:line — Issue
            Trigger: <concrete scenario>
            Fix: <minimal specific change>
            ```

            If no findings: `無 — 此 PR 通過 Phase 3 全部過濾。`

            ### 結論

            Mechanical decision rule (do NOT deviate):
            - Any 🔴 CRITICAL or 🟠 HIGH present → `**需修改**`
            - Otherwise → `**可合併**（含 N 條 🟡 MEDIUM 建議 / M 條 🔵 LOW nit / K 條 ⚪ INFO）`

            ## Phase 5 — Self-check (do NOT include in review.md)

            Before posting, verify:
            - [ ] Every finding cites file:line + concrete trigger
            - [ ] Every finding is on lines this PR changed (not pre-existing)
            - [ ] No findings on path-filtered files
            - [ ] Severity matches anchor examples
            - [ ] Profile gate respected (chill = HIGH/CRITICAL only)
            - [ ] Findings count ≤ cap
            - [ ] Conclusion follows mechanical rule
            - [ ] For each MEDIUM/LOW: would I genuinely block MY OWN PR for this?
                  If no, demote to INFO or drop.

            If any check fails, revise before posting.

            ## Phase 6 — POST

            ```
            gh pr review ${{ github.event.pull_request.number }} --comment --body-file review.md
            ```
```

**關鍵規則**：
- 使用 `anthropics/claude-code-action@v1`（浮動版本，跟最新穩定）
- `claude_args: '--allowedTools "Bash(gh:*),Write"'`（最小權限：只允許 `gh` 命令與 Write）
- `CLAUDE_CODE_OAUTH_TOKEN` 必須在 repo Secrets 設定
- `synchronize` trigger 確保每次 push 後重新 review
- `fetch-depth: 0` 確保完整 git history
- POST 用 `gh pr review --comment`（非 `gh pr comment`），記錄在 PR review 歷史中

---

## 標準 .github/workflows/claude.yml

用於在 Issue / PR 留言中用 `@claude` 觸發 Claude Code 執行任務（互動式，非自動 review）。

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read
```

**與 `claude-code-review.yml` 的差異**：

| | `claude-code-review.yml` | `claude.yml` |
|---|---|---|
| 觸發方式 | PR 開啟 / 每次 push 自動（+ `workflow_dispatch` 手動）| `@claude` 留言觸發 |
| 用途 | 自動 code review | 互動式任務執行 |
| action 版本 | `@v1`（跟最新） | `@v1`（跟最新） |
| `claude_args` | 限定 `Bash(gh:*),Write` | 不限（依留言指示） |
| Profile 切換 | label `review:assertive` / `workflow_dispatch` 輸入 | 不適用 |

**關鍵規則**：
- `CLAUDE_CODE_OAUTH_TOKEN` 與 `claude-code-review.yml` 共用同一個 Secret
- `actions: read` 讓 Claude 可讀取 CI 結果
- 兩個 workflow 都使用 `@v1`（浮動版本）；若遇行為異常，先查 release notes，必要時鎖定特定版本
