# Release Please Workflow

## 檔案位置

- `.github/workflows/release.yml`
- `release-please-config.json`（必要）
- `.release-please-manifest.json`（必要）

## 用途

自動依據 Conventional Commits 產生版本號與 changelog，建立 release PR。推送到 main 時觸發。

## 完整內容

### `.github/workflows/release.yml`

```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### `release-please-config.json`

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "include-component-in-tag": false
    }
  }
}
```

### `.release-please-manifest.json`

```json
{
  ".": "3.0.0"
}
```

## 關鍵配置說明

### 必須使用 Manifest 模式（config + manifest 檔案）

**不要**在 workflow 中使用 `release-type: node`（簡單模式）。原因：

Release Please v4 簡單模式會從 `package.json` 的 `name` 欄位衍生 **component name**，然後搜尋 `{component}-v*` 格式的 git tag。如果現有 tag 是 `v3.0.0`（無 component 前綴），Release Please 找不到而從 `1.0.0` 重新開始。

| 模式 | 配置方式 | tag 搜尋格式 | 風險 |
|------|---------|-------------|------|
| 簡單模式 | `release-type: node` in workflow | `{package.json.name}-v*` | 找不到現有 tag → 版本重置 |
| Manifest 模式 | config + manifest 檔案 | 依 `include-component-in-tag` 設定 | 可控 |

### `include-component-in-tag: false`

設定 tag 格式為 `v*`（如 `v3.1.0`），而非 `jurislm-v3.1.0`。單一套件的 monorepo 應設為 `false`。

### `.release-please-manifest.json` 的用途

記錄當前版本。Release Please 每次建立 release PR 時會自動更新此檔案。**初次設定時**必須手動填入當前版本號（與最新 git tag 一致）。

## 自訂指引

- **release-type**：`node` 適用有 `package.json` 的專案；其他語言改為 `python`、`go`、`rust` 等
- **Conventional Commits 規則**：
  - `feat:` → MINOR（3.0.0 → 3.1.0）
  - `fix:` → PATCH（3.0.0 → 3.0.1）
  - `feat!:` 或 `BREAKING CHANGE:` → MAJOR（3.0.0 → 4.0.0）
- **前置設定**：GitHub Repo → Settings → Actions → General → Workflow permissions → 啟用「Allow GitHub Actions to create and approve pull requests」
- **GITHUB_TOKEN**：自動提供，不需手動設定 secret
- **多套件 monorepo**：在 `packages` 中為每個子套件設定獨立路徑和 `release-type`

## 常見問題

| 問題 | 原因 | 解法 |
|------|------|------|
| Release PR 版本號從 1.0.0 開始 | 簡單模式 + component name 導致 tag 搜尋不到 | 改用 manifest 模式 + `include-component-in-tag: false` |
| Release PR 沒有出現 | 沒有 `feat:` 或 `fix:` commit | 確認 commit message 符合 Conventional Commits |
| 版本號沒有遞增 | manifest 中的版本與 git tag 不一致 | 手動修正 `.release-please-manifest.json` |

## 來源

`entire/.github/workflows/release.yml` + `entire/release-please-config.json`（2026-03-13 修正驗證）
