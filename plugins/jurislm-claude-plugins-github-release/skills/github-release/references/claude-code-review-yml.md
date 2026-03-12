# Claude Code Review Workflow

## 檔案位置

`.github/workflows/claude-code-review.yml`

## 用途

PR 開啟或更新時自動觸發 Claude Code Review，Claude 分析 diff 後自動發布繁體中文 review 留言。

## 完整內容

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
      issues: read
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

            1. Run `gh pr diff ${{ github.event.pull_request.number }}` to get the diff
            2. Analyze the changes
            3. Write your review to the file "review.md" using the Write tool

            The review must be in Traditional Chinese with this format:

            ## Code Review

            ### 變更摘要
            (bullet points)

            ### 優點
            (what's good about these changes)

            ### 問題與建議
            (issues with file:line references, or 無 if none)

            ### 結論
            (can merge / needs changes)

            After writing review.md, post it as a PR comment:
            gh pr comment ${{ github.event.pull_request.number }} --body-file review.md
```

## 關鍵配置說明

### `claude_args: '--allowedTools "Bash(gh:*),Write"'`

**這是最關鍵的配置。** Claude Code 在 CI 環境中有 permission mode 機制：

| 工具 | 預設權限 | 說明 |
|------|---------|------|
| `Read`, `Edit`, `Glob`, `Grep` | ✅ 允許 | 檔案讀取與編輯 |
| `Write` | ❌ 需核准 | 建立新檔案 |
| `Bash(*)` | ❌ 需核准 | 執行命令 |
| Git（唯讀） | ✅ 允許 | `git log`, `git diff` 等 |

CI 環境無人互動核准 → 未授權的工具會被拒絕（`permission_denials_count > 0`）。

`--allowedTools` 明確授權：
- `Write`：讓 Claude 可以建立 `review.md` 檔案
- `Bash(gh:*)`：只允許 `gh` 開頭的命令（安全限制），用於 `gh pr comment`

### 為什麼不用 `code-review@claude-code-plugins`

官方 `code-review` plugin 在 `@v1.0.70+` 版本因以下原因失效：
1. **Bash 安全過濾器**：plugin 內部用 `gh pr comment --body "## Review\n### ..."` 發布留言，`\n#` 模式被 Claude Code 的 bash 安全過濾器攔截
2. **Permission mode**：plugin 的 bash 命令需要互動核准，CI 無法核准

### 其他配置

- **`pull-requests: write`**：GitHub Actions token 需要寫入權限才能發 PR 留言
- **`fetch-depth: 0`**：完整 git history，讓 `gh pr diff` 能正確取得 diff
- **版本固定 `@v1.0.70`**：`@v1` 浮動 tag 可能因版本更新導致 401 錯誤
- **`CLAUDE_CODE_OAUTH_TOKEN`**：與 claude.yml 共用同一個 secret

### 替代方案：使用 `settings` input

```yaml
settings: |
  {
    "permissions": {
      "allow": ["Bash(gh:*)", "Write"],
      "deny": ["WebFetch"]
    }
  }
```

## 自訂指引

- **路徑篩選**：加入 `paths:` 可限制只在特定檔案變更時觸發（如 `src/**/*.ts`）
- **Review 格式**：修改 prompt 中的格式模板即可自訂 review 輸出
- **語言**：prompt 中指定 `Traditional Chinese`，可改為其他語言

## 來源

`entire/.github/workflows/claude-code-review.yml`（2026-03-12 驗證通過）
