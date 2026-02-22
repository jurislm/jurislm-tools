---
name: github-release
description: This skill should be used when the user asks to "set up GitHub Actions", "add release workflow", "add CI/CD", "configure Release Please", "add Claude Code review", "set up automated releases", "add pre-commit hook", "set up Husky", or wants to standardize GitHub workflows for a new or existing project. Activate when user mentions GitHub Actions, release automation, CI/CD setup, or git hooks.
---

# GitHub Release 標準化工作流指南

為所有專案提供一致的 GitHub Actions 配置與 Git Hook 設定，涵蓋自動版本管理、Claude Code 整合、Release Notes 分類與 pre-commit 品質檢查。

## 執行流程（每次使用此 Skill 必須執行）

呼叫此 Skill 時，**自動完成**以下步驟，無需等待用戶確認：

### Step 1：確認目標 repo

```bash
gh repo view --json nameWithOwner -q '.nameWithOwner'
```

### Step 2：同步 GitHub Labels

**移除** GitHub 預設但不需要的 labels：
```bash
for label in "bug" "documentation" "duplicate" "enhancement" "good first issue" "help wanted" "invalid" "question" "wontfix"; do
  gh label delete "$label" --yes 2>/dev/null || true
done
```

**確保**以下 labels 存在（已存在則跳過）：

| Label | 顏色 | 說明 |
|-------|------|------|
| `feat` | `#0075ca` | New feature |
| `fix` | `#d73a4a` | Bug fix |
| `docs` | `#0075ca` | Documentation changes |
| `refactor` | `#e4e669` | Code refactoring |
| `test` | `#0e8a16` | Tests |
| `ci` | `#1d76db` | CI/CD changes |
| `chore` | `#e4e669` | Maintenance |
| `perf` | `#0075ca` | Performance improvement |
| `breaking` | `#b60205` | Breaking change |
| `major` | `#b60205` | Major version bump |
| `minor` | `#0075ca` | Minor version bump |
| `patch` | `#0e8a16` | Patch version bump |

```bash
gh label create "feat" --color "#0075ca" --description "New feature" 2>/dev/null || true
gh label create "fix" --color "#d73a4a" --description "Bug fix" 2>/dev/null || true
gh label create "docs" --color "#0075ca" --description "Documentation changes" 2>/dev/null || true
gh label create "refactor" --color "#e4e669" --description "Code refactoring" 2>/dev/null || true
gh label create "test" --color "#0e8a16" --description "Tests" 2>/dev/null || true
gh label create "ci" --color "#1d76db" --description "CI/CD changes" 2>/dev/null || true
gh label create "chore" --color "#e4e669" --description "Maintenance" 2>/dev/null || true
gh label create "perf" --color "#0075ca" --description "Performance improvement" 2>/dev/null || true
gh label create "breaking" --color "#b60205" --description "Breaking change" 2>/dev/null || true
gh label create "major" --color "#b60205" --description "Major version bump" 2>/dev/null || true
gh label create "minor" --color "#0075ca" --description "Minor version bump" 2>/dev/null || true
gh label create "patch" --color "#0e8a16" --description "Patch version bump" 2>/dev/null || true
```

### Step 3：建立缺少的 workflow 檔案

檢查並建立（已存在則跳過）：

```bash
ls .github/workflows/release.yml 2>/dev/null || echo "MISSING"
ls .github/workflows/claude.yml 2>/dev/null || echo "MISSING"
ls .github/workflows/claude-code-review.yml 2>/dev/null || echo "MISSING"
ls .github/release.yml 2>/dev/null || echo "MISSING"
```

對每個缺少的檔案，使用下方模板建立。

### Step 4：設定 Husky（僅當 `package.json` 存在時）

```bash
ls package.json 2>/dev/null && echo "HAS_PACKAGE_JSON" || echo "SKIP_HUSKY"
```

若有 `package.json`，檢查 `.husky/pre-commit` 是否存在，缺少則建立。

### Step 5：回報結果

列出所有已建立 / 已存在 / 跳過的項目。

---

## 標準配置檔清單

每個專案應包含以下 5 個檔案：

| 檔案 | 觸發條件 | 用途 |
|------|----------|------|
| `.husky/pre-commit` | git commit | Husky pre-commit hook（格式化、lint、typecheck、test） |
| `.github/workflows/release.yml` | push to main | Release Please 自動建立 release PR |
| `.github/workflows/claude.yml` | @claude 留言 | Claude Code 回應 issue/PR 中的 @claude 指令 |
| `.github/workflows/claude-code-review.yml` | PR opened/synced | Claude Code 自動 PR Review |
| `.github/release.yml` | release 建立時 | GitHub Release Notes 自動分類 |

## 檔案模板

### 0. Git Hook — Husky Pre-commit（`.husky/pre-commit`）

在每次 commit 前自動執行品質檢查，確保不合格的代碼無法進入 repository。

> 參考來源：`references/pre-commit.md`

**安裝 Husky**：

```bash
bun add -D husky
bunx husky init
```

**pre-commit hook 內容**：

```sh
#!/bin/sh

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "${BLUE}Running pre-commit checks...${NC}"

# 前置檢查
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
    echo "${YELLOW}No staged files to commit. Skipping pre-commit checks.${NC}"
    exit 0
fi

# 1. 代碼格式化
echo "${BLUE}[format] Auto-formatting code...${NC}"
if ! bun format; then
    echo "${RED}[format] Format failed!${NC}"
    exit 1
fi
echo "${GREEN}[format] Code formatted!${NC}"
git diff --cached --name-only --diff-filter=ACMR -z | xargs -0 -I {} git add "{}"

# 2. 代碼風格檢查
echo "${BLUE}[lint] Running ESLint...${NC}"
if ! bun lint; then
    echo "${RED}[lint] Lint failed!${NC}"
    exit 1
fi
echo "${GREEN}[lint] Lint passed!${NC}"

# 3. TypeScript 類型檢查
echo "${BLUE}[typecheck] Running type checks...${NC}"
if ! bun typecheck; then
    echo "${RED}[typecheck] Type check failed!${NC}"
    exit 1
fi
echo "${GREEN}[typecheck] Type check passed!${NC}"

# 4. 單元測試
echo "${BLUE}[test] Running unit tests...${NC}"
if ! bunx vitest run; then
    echo "${RED}[test] Tests failed!${NC}"
    exit 1
fi
echo "${GREEN}[test] All tests passed!${NC}"

echo ""
echo "${GREEN}All pre-commit checks passed!${NC}"
```

**自訂**：
- 依專案需求增減步驟，至少保留 format + lint + typecheck
- 確保 `package.json` 中定義了 `format`、`lint`、`typecheck` scripts
- 若使用 OpenSpec，加入 `bunx @fission-ai/openspec validate --specs` 步驟

### 1. Release Please（`.github/workflows/release.yml`）

自動依據 Conventional Commits 產生版本號與 changelog，建立 release PR。

> 參考來源：`references/release-yml.md`

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
          release-type: node
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Conventional Commits 規則**：
- `feat:` → MINOR 版本（0.1.0 → 0.2.0）
- `fix:` → PATCH 版本（0.1.0 → 0.1.1）
- `feat!:` 或 `BREAKING CHANGE:` → MAJOR 版本（0.1.0 → 1.0.0）

**注意**：需在 GitHub Repo → Settings → Actions → General → Workflow permissions 啟用「Allow GitHub Actions to create and approve pull requests」。

### 2. Claude Code Action（`.github/workflows/claude.yml`）

在 issue/PR 中使用 @claude 與 Claude Code 互動。

> 參考來源：`references/claude-yml.md`

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
      pull-requests: read
      issues: read
      id-token: write
      actions: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read
```

### 3. Claude Code Review（`.github/workflows/claude-code-review.yml`）

PR 開啟或更新時自動觸發 Claude Code Review。

> 參考來源：`references/claude-code-review-yml.md`

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
      pull-requests: read
      issues: read
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code Review
        id: claude-review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          plugin_marketplaces: 'https://github.com/anthropics/claude-code.git'
          plugins: 'code-review@claude-code-plugins'
          prompt: '/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}'
```

### 4. Release Notes 分類（`.github/release.yml`）

GitHub 自動產生 Release Notes 時的分類規則。

> 參考來源：`references/release-notes-yml.md`

```yaml
changelog:
  exclude:
    labels:
      - ignore-for-release
      - dependencies
    authors:
      - dependabot
      - renovate

  categories:
    - title: '⚠️ Breaking Changes'
      labels:
        - breaking

    - title: '🚀 New Features'
      labels:
        - feat

    - title: '🐛 Bug Fixes'
      labels:
        - fix

    - title: '⚡ Performance'
      labels:
        - perf

    - title: '📚 Documentation'
      labels:
        - docs

    - title: '♻️ Refactoring'
      labels:
        - refactor

    - title: '🧪 Tests'
      labels:
        - test

    - title: '🔧 CI/CD'
      labels:
        - ci

    - title: '🏠 Maintenance'
      labels:
        - chore

    - title: '📦 Other Changes'
      labels:
        - '*'
```

## 建置工作流

為新專案設定時，依序執行：

1. 安裝 Husky 並建立 pre-commit hook
2. 建立 `.github/workflows/` 目錄
3. 複製上述 4 個 GitHub 配置檔
4. 在 GitHub Repo Settings 設定：
   - **Secrets**: 新增 `CLAUDE_CODE_OAUTH_TOKEN`
   - **Actions permissions**: 啟用「Allow GitHub Actions to create and approve pull requests」
5. 確認 `package.json` 存在（Release Please `release-type: node` 需要）

## 前置需求

### Secrets 設定

| Secret | 用途 | 取得方式 |
|--------|------|----------|
| `GITHUB_TOKEN` | Release Please | 自動提供，不需手動設定 |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code Action | [Claude Code OAuth](https://console.anthropic.com/) |

### Repo Settings

- **Actions → General → Workflow permissions**:
  - Read and write permissions
  - Allow GitHub Actions to create and approve pull requests

### Husky

```bash
bun add -D husky
bunx husky init
```

## 已套用的專案

| 專案 | 狀態 |
|------|------|
| terry90918/stock | 5 檔齊全 |
| terry90918/lawyer-app | 5 檔齊全 |

## PR 必做項目

建立 PR 時**必須**設定 labels 和 assignee，否則 Release Notes 無法正確分類：

```bash
gh pr edit <num> --add-label "feat,fix,docs"    # 至少一個 label
gh pr edit <num> --add-assignee terry90918       # 指定負責人
```

**可用 labels**：`feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`, `perf`, `breaking`, `major`, `minor`, `patch`

這些 labels 對應 `.github/release.yml` 的分類規則，確保 Release Notes 自動歸類正確。

## 注意事項

- `release-type: node` 適用於有 `package.json` 的專案；其他語言請改為對應類型（如 `python`、`go` 等）
- Claude Code Review 的 `prompt` 使用了 `${{ github.repository }}` 和 `${{ github.event.pull_request.number }}`，這些是 GitHub context 變數，安全且不涉及使用者輸入注入
- `.github/release.yml` 不是 workflow，是 GitHub Release Notes 的配置檔，放在 `.github/` 根目錄下
- `.husky/pre-commit` 需要 `chmod +x` 執行權限（`bunx husky init` 會自動處理）
