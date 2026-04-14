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

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

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

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1.0.70
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: '--allowedTools "Bash(gh:*),Write"'
          prompt: |
            You are a code reviewer. Review the changes in PR #${{ github.event.pull_request.number }}.

            ## Phase 1 — FETCH

            Get PR metadata and diff:
            ```
            gh pr view ${{ github.event.pull_request.number }} --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions
            gh pr diff ${{ github.event.pull_request.number }} --name-only
            gh pr diff ${{ github.event.pull_request.number }}
            ```

            ## Phase 2 — CONTEXT

            Read CLAUDE.md for project conventions (if it exists):
            ```
            gh api "repos/${{ github.repository }}/contents/CLAUDE.md?ref=${{ github.event.pull_request.head.sha }}" --jq '.content' | base64 -d
            ```

            For each changed file, read its full content at the PR head (not just the diff):
            ```
            gh api "repos/${{ github.repository }}/contents/{file}?ref=${{ github.event.pull_request.head.sha }}" --jq '.content' | base64 -d
            ```

            ## Phase 3 — REVIEW

            Review each changed file in full. Check across these categories:

            | Category | What to Check |
            |---|---|
            | **Correctness** | Logic errors, off-by-ones, null handling, edge cases |
            | **Type Safety** | Type mismatches, unsafe casts, `any` usage |
            | **Pattern Compliance** | Matches project conventions from CLAUDE.md |
            | **Security** | Injection, auth gaps, secret exposure, XSS |
            | **Performance** | N+1 queries, unbounded loops, memory leaks |
            | **Completeness** | Missing tests, missing error handling |
            | **Maintainability** | Dead code, magic numbers, deep nesting |

            Assign severity to each finding:
            - **[CRITICAL]** Security vulnerability or data loss risk — must fix before merge
            - **[HIGH]** Bug or logic error likely to cause issues — should fix before merge
            - **[MEDIUM]** Code quality issue — fix recommended
            - **[LOW]** Style nit — optional

            ## Phase 4 — WRITE REVIEW

            Write your review to "review.md" using the Write tool.
            The review must be in Traditional Chinese with this format:

            ## Code Review

            ### 變更摘要
            (bullet points summarizing what changed)

            ### 優點
            (what's good about these changes)

            ### 問題與建議
            For each issue: `[SEVERITY] file:line — description and suggested fix`
            Write 無 if no issues found.
            IMPORTANT: Do NOT suggest deferring fixes to follow-up PRs. Every suggestion must be fixed in the current PR before merge. Never use phrases like "可在後續 PR 處理", "not blocking merge", or "can be addressed later".

            ### 結論
            (可合併 / 需修改 — if there are ANY suggestions above, the conclusion MUST be "需修改")

            After writing review.md, post it as a PR comment:
            gh pr comment ${{ github.event.pull_request.number }} --body-file review.md
```

**關鍵規則**：
- 使用 `anthropics/claude-code-action@v1.0.70`（不升版，v1.0.70 之後的版本引入 bash 安全過濾器，會導致 `Bash(gh:*)` 受限）
- `claude_args: '--allowedTools "Bash(gh:*),Write"'`（最小權限：只允許 `gh` 命令與 Write）
- `CLAUDE_CODE_OAUTH_TOKEN` 必須在 repo Secrets 設定
- `synchronize` trigger 確保每次 push 後重新 review
- `fetch-depth: 0` 確保完整 git history

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
| 觸發方式 | PR 開啟 / 每次 push 自動 | `@claude` 留言觸發 |
| 用途 | 自動 code review | 互動式任務執行 |
| action 版本 | `@v1.0.70`（鎖版） | `@v1`（跟最新） |
| `claude_args` | 限定 `Bash(gh:*),Write` | 不限（依留言指示） |

**關鍵規則**：
- `CLAUDE_CODE_OAUTH_TOKEN` 與 `claude-code-review.yml` 共用同一個 Secret
- `actions: read` 讓 Claude 可讀取 CI 結果
- `claude.yml` 使用 `@v1`（浮動版本），因為互動式用途風險較低；若遇行為異常，應檢查 release notes，必要時改為鎖定特定版本（如 `@v1.0.70`）
