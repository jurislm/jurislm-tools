---
name: release-workflow
description: JurisLM 各 repo 的 Release 工作流程規範。當使用者詢問「如何設定 release」、「release workflow 怎麼寫」、「release-please 怎麼用」、「新增 repo 要怎麼設定」時觸發。
argument-hint: "[repo-name]"
---

# JurisLM Release Workflow 規範

所有 jurislm repo 統一使用 Release Please v4 自動化版本管理。

---

## 標準 release.yml

所有 repo 的 `.github/workflows/release.yml` 統一格式：

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
          release-type: node   # 或 simple，見下方說明
          token: ${{ secrets.GITHUB_TOKEN }}
```

**規則**：
- `workflow_dispatch` 必填（允許手動觸發）
- `permissions` 放在 top 層級（非 job 層級）
- `release-type` 必須明確指定

---

## release-type 選擇

| 類型 | 適用條件 | Repo 範例 |
|------|---------|---------|
| `node` | 有 `package.json` | entire, lawyer, lexvision, stock, coolify-mcp, hetzner-mcp, langfuse-mcp |
| `simple` | 無 `package.json`（plugin repo） | jurislm-tools, jurislm-plugins |

**不統一的原因**：`simple` type 搭配 `extra-files` 同步版本號到 `plugin.json` 和 `marketplace.json`，是 plugin repo 的必要設計，強行用 `node` 需要加無用的 `package.json`。

---

## 標準 release-please-config.json

所有 repo 統一格式（`release-type` 對應上方選擇）：

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
        { "type": "feat", "section": "🚀 New Features" },
        { "type": "fix", "section": "🐛 Bug Fixes" },
        { "type": "perf", "section": "⚡ Performance" },
        { "type": "docs", "section": "📚 Documentation" },
        { "type": "refactor", "section": "♻️ Refactoring" },
        { "type": "style", "section": "🎨 Styles" },
        { "type": "test", "section": "🧪 Tests" },
        { "type": "chore", "section": "🏠 Maintenance", "hidden": true }
      ]
    }
  }
}
```

---

## Plugin Repo 額外設定

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

---

## jurislm-plugins 特殊規則

`jurislm-plugins` 額外有 `sync-plugins.yml`，負責發版後同步 plugin 定義到 PostgreSQL DB（dev + prod）。

**觸發方式**：手動（`workflow_dispatch` only）——發版後需手動到 GitHub Actions 頁面觸發。

原因：`GITHUB_TOKEN` 建立的 release 不會自動觸發其他 workflow（GitHub 安全限制），改用 PAT 可自動化但需額外 secret 設定。

---

## ESLint 設定（Next.js repo）

所有使用 `eslint.config.mjs` 的 repo，`globalIgnores` 必須包含 `.worktrees/**`：

```js
globalIgnores([
  '.next/**',
  'out/**',
  'build/**',
  'next-env.d.ts',
  '.worktrees/**',   // ← 必填，git worktree 的 build 產物不應被 lint
]),
```

**原因**：Next.js 官方範例未包含此 pattern，但 jurislm 所有專案遵守 `.worktrees/` 目錄建立 git worktree 的慣例，build 產物會觸發 ESLint 錯誤。

---

## 新增 Repo Checklist

1. [ ] 建立 `.github/workflows/release.yml`（依標準格式）
2. [ ] 建立 `release-please-config.json`（依統一模板）
3. [ ] Plugin repo：加 `extra-files`，確認目標在陣列第一位
4. [ ] Next.js repo：`eslint.config.mjs` 加 `.worktrees/**`
