---
name: codebase-sync
version: 1.0.0
description: 探索 codebase 現況，更新 README.md 與 CLAUDE.md，移除過時內容。當使用者說「更新 README」、「更新 CLAUDE.md」、「同步文件」、「移除過時內容」、「explore codebase and update docs」、「codebase 文件已過時」時觸發。
argument-hint: "[repo-path]"
---

# Codebase Sync — 探索並更新 README.md 與 CLAUDE.md

---

## 工作流程

### Step 1：探索 codebase 現況

```bash
# 確認整體結構
ls -la
cat package.json 2>/dev/null | jq '{name, version, scripts, dependencies, devDependencies}'

# 列出所有重要目錄
find . -maxdepth 3 -type d \
  -not -path './.git*' \
  -not -path './node_modules*' \
  -not -path './.next*' \
  -not -path './dist*' \
  -not -path './.worktrees*'

# 讀取現有 README.md 與 CLAUDE.md
cat README.md
cat CLAUDE.md
```

### Step 2：識別過時內容

比對以下項目是否與實際 codebase 一致：

| 檢查項目 | README.md | CLAUDE.md |
|---------|-----------|-----------|
| 目錄結構 | ✓ | ✓ |
| 安裝指令 | ✓ | ✓ |
| 可用 scripts | ✓ | ✓ |
| 環境變數清單 | ✓ | ✓ |
| 版本號 | ✓ | — |
| Plugin/Skill 清單 | ✓（若適用） | ✓（若適用） |
| 部署流程 | ✓ | ✓ |
| DB schema / ports | — | ✓ |
| 常用命令 | — | ✓ |

**過時訊號**：
- 提到已不存在的檔案或目錄
- scripts 名稱與 `package.json` 不符
- 環境變數與 `.env.example` 不符
- 版本號落後於 `package.json` / `plugin.json`
- 描述已移除的功能

### Step 3：更新 README.md

README.md 標準結構：

```markdown
# <專案名稱>

<一句話描述>

## 安裝

<安裝步驟>

## 使用方式 / 可用功能

<主要功能說明>

## 設定

<環境變數 / 設定檔說明>

## 授權

<授權類型>
```

**規則**：
- 只寫使用者需要知道的資訊（安裝、設定、使用）
- 移除已不存在的功能描述
- 版本號從 `package.json` / `plugin.json` 取得，不手動填

### Step 4：更新 CLAUDE.md

CLAUDE.md 標準結構：

```markdown
# CLAUDE.md

<簡短說明>

## 常用命令

<開發/驗證/偵錯常用指令>

## Repository 概覽

<repo 的角色與定位>

## 結構

<目錄樹，只列重要項目>

## <業務相關章節>

<依專案性質填寫：DB 連線、API、部署、注意事項等>
```

**規則**：
- 目錄樹必須反映實際結構（執行 `find` 驗證）
- 常用命令必須可以直接執行（驗證指令是否有效）
- 移除不再存在的說明、deprecated API、已搬移的路徑
- 不重複寫已在 README.md 說明的內容

### Step 5：驗證

```bash
# 確認文件引用的路徑/檔案存在
# 例如：文件說 "cat .claude-plugin/marketplace.json"
ls .claude-plugin/marketplace.json

# 確認文件的 scripts 與 package.json 一致
cat package.json | jq '.scripts'

# 確認環境變數說明與 .env.example 一致（若有）
cat .env.example 2>/dev/null
```

---

## 注意事項

- **不猜測**：只寫能從 codebase 驗證的內容
- **不加功能**：不在文件裡加入尚未實作的功能說明
- **不重複**：README 給使用者看，CLAUDE.md 給 Claude 看，內容不重疊
- **禁止修改版本號**：版本由 Release Please 管理
