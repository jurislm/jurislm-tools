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
        id: claude-review
        uses: anthropics/claude-code-action@v1.0.70
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            You are a code reviewer. Review the changes in PR #${{ github.event.pull_request.number }}.

            1. Run `gh pr diff ${{ github.event.pull_request.number }}` to get the diff
            2. Analyze the changes
            3. Write your review to /tmp/review.md using the Write tool

            The review must be in Traditional Chinese (繁體中文) with this format:

            ## Code Review

            ### 變更摘要
            (bullet points)

            ### 優點
            (what's good about these changes)

            ### 問題與建議
            (issues with file:line references, or "無" if none)

            ### 結論
            (can merge / needs changes)

            IMPORTANT: You MUST write the review to /tmp/review.md using the Write tool. Do not try to post it yourself.

      - name: Post Review Comment
        if: always() && hashFiles('/tmp/review.md') != ''
        run: gh pr comment ${{ github.event.pull_request.number }} --body-file /tmp/review.md
        env:
          GH_TOKEN: ${{ github.token }}
```

## 關鍵設計說明

### 兩步驟架構：Claude 寫檔、Actions 發留言

**這是最關鍵的設計。** 不讓 Claude 自己執行 `gh pr comment`，改為：

1. Claude 用 `Write` 工具把 review 寫到 `/tmp/review.md`
2. 獨立的 GitHub Actions step 用 `github.token` 發留言

**為什麼這樣做：**

| 方法 | 問題 |
|------|------|
| Claude 執行 `gh pr comment --body "## Review\n### ..."` | `\n#` 模式被 bash 安全過濾器攔截 |
| Claude 執行 `gh pr comment --body-file review.md` | `Bash(gh:*)` 需要 `claude_args` 授權，且 Claude 用的是 temp sandbox，`review.md` 路徑不穩定 |
| **Claude 寫 `/tmp/review.md`，Actions step 發留言** | ✅ 完全繞過 bash 安全過濾器問題 |

### 為什麼不用 `code-review@claude-code-plugins`

官方 `code-review` plugin 在 `@v1.0.70+` 版本因以下原因失效：
1. **Bash 安全過濾器**：plugin 內部用 `gh pr comment --body "## Review\n### ..."` 發布留言，`\n#` 模式被攔截
2. **Permission mode**：plugin 的 bash 命令需要互動核准，CI 無法核准

### 其他配置

- **`pull-requests: write`**：`Post Review Comment` step 的 `gh pr comment` 需要此權限
- **`issues: read`**（非 `write`）：review 只需讀取，不需建立 issue
- **`fetch-depth: 0`**：完整 git history，讓 `gh pr diff` 能正確取得 diff
- **版本固定 `@v1.0.70`**：`@v1` 浮動 tag 可能因版本更新導致 401 錯誤
- **`if: always() && hashFiles('/tmp/review.md') != ''`**：即使 Claude step 失敗仍嘗試發留言，且確認檔案存在才執行
- **`GH_TOKEN: ${{ github.token }}`**：使用 GitHub 內建 token，不需額外 secret

## 自訂指引

- **路徑篩選**：加入 `paths:` 可限制只在特定檔案變更時觸發（如 `src/**/*.ts`）
- **Review 格式**：修改 prompt 中的格式模板即可自訂 review 輸出
- **語言**：prompt 中指定 `Traditional Chinese (繁體中文)`，可改為其他語言

## 來源

`entire/.github/workflows/claude-code-review.yml`（2026-03-12 驗證通過）
