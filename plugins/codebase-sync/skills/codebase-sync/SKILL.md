---
name: codebase-sync
version: 2.0.0
description: >
  This skill should be used when the user says "更新 README", "更新 CLAUDE.md", "同步文件",
  "移除過時內容", "codebase 文件已過時", "文件跟不上代碼", "CLAUDE.md 要更新",
  "重構完需要更新文件", "update README", "sync documentation", "docs are outdated",
  "documentation is stale", "docs don't match the code", "update my docs after refactor",
  or wants to audit and refresh README.md and CLAUDE.md to match the current codebase state.
argument-hint: "(no arguments — operates on current directory)"
---

# Codebase Sync — 深度審計並更新 README.md 與 CLAUDE.md

---

## 核心原則：先審計，後動筆

**所有步驟都必須執行，不得以「看起來沒問題」為由跳過。**
每一項結論必須來自實際命令輸出或讀取檔案，不得憑記憶推斷。
每次修改都必須在 Audit Report 中有對應的 finding。

---

## Step 0：執行自動化偵測（必做，輸出原始結果）

以下指令必須全部執行，並將輸出結果記錄下來供 Step 1 分析使用。

```bash
# 0-A 整體結構快照
ls -la
find . -maxdepth 3 -type d \
  -not -path './.git*' \
  -not -path './node_modules*' \
  -not -path './.next*' \
  -not -path './dist*' \
  -not -path './.worktrees*' \
  | sort

# 0-B package.json 狀態（若存在）
jq '{name, version, scripts, dependencies, devDependencies}' package.json 2>/dev/null || echo "(no package.json)"

# 0-C plugin.json 狀態（若存在）
jq '{name, version}' .claude-plugin/plugin.json 2>/dev/null || \
  find . -name "plugin.json" -not -path "*/node_modules/*" -exec echo "Found: {}" \; -exec jq '{name,version}' {} \; 2>/dev/null || \
  echo "(no plugin.json found)"

# 0-D README scripts vs package.json scripts 差異
if [ -f README.md ] && [ -f package.json ]; then
  grep -oE 'bun run [a-z:_-]+' README.md | sed 's/bun run //' | sort -u > /tmp/_readme_scripts.txt
  jq -r '.scripts | keys[]' package.json | sort > /tmp/_pkg_scripts.txt
  echo "=== README 提到但 package.json 沒有的 scripts ==="
  comm -23 /tmp/_readme_scripts.txt /tmp/_pkg_scripts.txt
  echo "=== package.json 有但 README 沒提的 scripts ==="
  comm -13 /tmp/_readme_scripts.txt /tmp/_pkg_scripts.txt
  rm /tmp/_readme_scripts.txt /tmp/_pkg_scripts.txt
fi

# 0-E CLAUDE.md 中提到但實際不存在的目錄
if [ -f CLAUDE.md ]; then
  echo "=== CLAUDE.md 提到的目錄，檢查是否存在 ==="
  grep -oE '`[a-z][a-z0-9_/-]+/`' CLAUDE.md | tr -d '`' | sort -u | while read d; do
    if [ -d "$d" ]; then
      echo "  OK: $d"
    else
      echo "  MISSING: $d"
    fi
  done
fi

# 0-F CLAUDE.md 中提到但實際不存在的檔案
if [ -f CLAUDE.md ]; then
  echo "=== CLAUDE.md 提到的檔案，檢查是否存在 ==="
  grep -oE '`[a-z][a-z0-9_./-]+\.(ts|tsx|js|mjs|md|json|toml|yaml|yml)`' CLAUDE.md | tr -d '`' | sort -u | while read f; do
    if [ -f "$f" ]; then
      echo "  OK: $f"
    else
      echo "  MISSING: $f"
    fi
  done
fi

# 0-G README.md 中提到但實際不存在的目錄與檔案
if [ -f README.md ]; then
  echo "=== README.md 提到的目錄，檢查是否存在 ==="
  grep -oE '`[a-z][a-z0-9_/-]+/`' README.md | tr -d '`' | sort -u | while read d; do
    if [ -d "$d" ]; then
      echo "  OK: $d"
    else
      echo "  MISSING: $d"
    fi
  done
fi

# 0-H 版本號一致性（只報告，不修改）
echo "=== 版本號現況（僅供參考，禁止手動修改）==="
grep -rE '"version"' package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json 2>/dev/null || true
find . -name "plugin.json" -not -path "*/node_modules/*" -exec grep '"version"' {} \; 2>/dev/null || true

# 0-I 未被文件提及的頂層目錄（可能是新增但尚未記錄的）
echo "=== 實際存在的頂層目錄（用來比對文件是否有遺漏）==="
ls -d */ 2>/dev/null | grep -v node_modules | grep -v ".git" || echo "(no subdirectories)"

# 0-J 近期 git commit 摘要（最近 30 筆）
echo "=== 近期 git commits ==="
git log --oneline -30 2>/dev/null || echo "(not a git repo or no commits)"

# 0-K 近期 commit 中新增、刪除、重命名的檔案（A/D/M/R 皆含）
echo "=== 近期 commit 涉及的檔案變動（最近 30 筆）==="
git log --name-status --pretty=format:"--- %h %s" -30 2>/dev/null \
  | grep -E '^[ADMR][0-9]*\t' \
  | sort | uniq -c | sort -rn | head -40 \
  || echo "(no git history)"

# 0-L 最近 30 筆 commit 中新增的檔案（A = Added）
echo "=== 近期新增的檔案（可能尚未記載於文件）==="
git log --name-status --pretty=format: -30 2>/dev/null \
  | grep '^A' | cut -f2- | sort -u \
  | grep -vE '(node_modules|\.git|dist/|\.next/)' \
  || echo "(none)"

# 0-M 最近 30 筆 commit 中刪除的檔案（D = Deleted）
echo "=== 近期刪除的檔案（文件可能仍有引用）==="
git log --name-status --pretty=format: -30 2>/dev/null \
  | grep '^D' | cut -f2- | sort -u \
  | grep -vE '(node_modules|\.git|dist/|\.next/)' \
  || echo "(none)"

# 0-N 近期 commit 的 feat/fix 摘要（用來判斷有哪些功能改動可能影響文件）
echo "=== 近期 feat/fix/refactor commits（最可能需要更新文件）==="
git log --oneline -50 2>/dev/null \
  | grep -E '^[a-f0-9]+ (feat|fix|refactor|perf|BREAKING)' \
  || echo "(none in last 50 commits)"
```

---

## Step 1：深度讀取現有文件

使用 Read 工具（禁用 `cat`）讀取下列所有存在的檔案：

- `Read README.md`
- `Read CLAUDE.md`
- `Read .claude-plugin/marketplace.json`（若存在）
- `Read .claude-plugin/plugin.json`（若存在）
- `Read package.json`（若存在）

若有子目錄的 plugin，也逐一讀取其 `plugin.json`：

```bash
find . -name "plugin.json" -not -path "*/node_modules/*" | head -20
```

---

## Step 2：輸出完整 Audit Report（禁止省略）

分析 Step 0 的結果，**必須輸出以下格式的 Audit Report**，不論是否有發現問題都要輸出：

```
## Codebase Sync Audit Report

### 1. 目錄結構比對
- 文件記載：...
- 實際現況：...
- 差異：[列出所有 MISSING 目錄] 或 [無差異]

### 2. Scripts 比對
- README 提到但 package.json 沒有：[列表] 或 [無]
- package.json 有但 README 沒提：[列表] 或 [無]

### 3. 已刪除但仍被文件引用的路徑
- [逐條列出 MISSING 項目] 或 [無]

### 4. 文件未記載的新增功能/目錄
- [實際存在但文件未提及的重要項目] 或 [無]

### 5. 描述準確性檢查
- [README/CLAUDE.md 的描述與實際程式碼不符之處] 或 [無]

### 6. Plugin/Skill 清單準確性（若適用）
- 文件記載的 plugins：[列表]
- 實際存在的 plugins：[find 結果]
- 差異：[列出]

### 7. 版本號現況（僅報告，不修改）
- package.json：...
- plugin.json：...
- marketplace.json：...

### 8. Git 近期變動分析
- 最近 feat/fix/refactor commits：[列出 0-N 的結果]
- 近期新增但文件未提及的檔案：[0-L 中不在文件裡的項目] 或 [無]
- 近期刪除但文件仍引用的檔案：[0-M 中仍被文件提及的項目] 或 [無]
- 重要功能改動摘要：[從 commit message 判斷哪些改動可能需要更新文件描述]

### 9. 環境變數比對（若有 .env.example）
- README 提到但 .env.example 沒列：[列表] 或 [無 / 跳過]
- .env.example 有但 README 沒提：[列表] 或 [無 / 跳過]

### 待更新事項清單
1. [具體要改什麼，在哪個檔案的哪個章節]
2. ...
（若無任何需要更新的項目，明確說明「經審計，文件與 codebase 一致，無需更新」）
```

---

## Step 3：更新 README.md

**只依 Audit Report 中的「待更新事項」動筆，不得自行添加未在報告中提及的改動。**

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
- 移除 Audit Report 中確認為 MISSING 的目錄/檔案引用
- 加入 Audit Report 中確認存在但文件未提及的重要功能
- 版本號禁止手動修改
- 不加任何 Audit Report 中沒有對應 finding 的新內容

---

## Step 4：更新 CLAUDE.md

**只依 Audit Report 中的「待更新事項」動筆。**

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
- 目錄樹必須與 Step 0-A 的 `find` 結果一致
- 移除 Audit Report 確認為 MISSING 的路徑引用
- 加入 Audit Report 發現存在但未記載的重要路徑
- 常用命令必須與 Step 0-B/C 的 `package.json` 一致
- 不重複寫 README.md 已說明的內容

---

## Step 5：驗證（每項修改都要跑）

```bash
# 5-A 確認 Audit Report 中新加入的每條目錄引用真的存在
# 對每個在「待更新事項」中新增的目錄路徑，執行：
#   find . -maxdepth 3 -type d -path './<新加的路徑>' | head -1
# 若無輸出代表該目錄不存在，不得寫入文件

# 5-B 確認新加入的指令真的在 package.json
jq '.scripts' package.json 2>/dev/null || echo "(no package.json)"

# 5-C 確認 marketplace.json / plugin.json 格式合法
jq . .claude-plugin/marketplace.json 2>&1 || true
jq . .claude-plugin/plugin.json 2>&1 || true
```

---

## Step 0 補充：環境變數比對

若專案有 `.env.example`，在 Step 0 之後額外執行：

```bash
# 比對 README 提到的環境變數 vs .env.example（zsh 相容）
if [ -f .env.example ]; then
  grep -oE '`[A-Z][A-Z0-9_]+`' README.md | tr -d '`' | sort -u > /tmp/_readme_vars.txt
  grep -oE '^[A-Z][A-Z0-9_]+' .env.example | sort -u > /tmp/_env_vars.txt
  echo "=== README 提到但 .env.example 沒列的變數 ==="
  comm -23 /tmp/_readme_vars.txt /tmp/_env_vars.txt
  echo "=== .env.example 有但 README 沒提的變數 ==="
  comm -13 /tmp/_readme_vars.txt /tmp/_env_vars.txt
  rm /tmp/_readme_vars.txt /tmp/_env_vars.txt
else
  echo "(.env.example 不存在，跳過環境變數比對)"
fi
```

比對結果寫入 Audit Report Section 9。

## 模板參考

不同專案類型的 README / CLAUDE.md 標準模板，見 `references/templates.md`：
- Next.js Web App
- MCP Server / CLI Tool
- Plugin / Marketplace

## 常見錯誤

| 錯誤 | 正確做法 |
|------|---------|
| 跳過 Step 0，直接「看起來沒問題」就結束 | 必須執行所有自動化偵測指令並輸出結果 |
| 沒有 Audit Report 就動筆 | 必須先輸出 Audit Report 再修改任何檔案 |
| 把 README 寫成「給 Claude 看的指引」（含 git workflow、commit 規則）| 那些屬於 CLAUDE.md，README 只給人看 |
| 在 CLAUDE.md 重複寫 README 已說明的安裝步驟 | CLAUDE.md 假設讀者已會基本操作，只寫 codebase-specific 細節 |
| 寫 deprecated 功能但加註「(deprecated)」 | 直接刪除，靠 git log 留歷史 |
| 把 plugin 列表寫成「已規劃」「未來會加」 | 只寫**現在已存在**的，沒實作的不寫 |
| 把 git commit message 原文複製進文件（「本次新增了 X」）| git log 是訊號來源，用來找出哪些地方需要更新；文件描述的是當前狀態，不是變更歷史 |

## 注意事項

- **不猜測**：只寫能從 codebase 驗證的內容
- **不加功能**：不在文件裡加入尚未實作的功能說明
- **不重複**：README 給使用者看，CLAUDE.md 給 Claude 看，內容不重疊
- **禁止修改版本號**：版本由 Release Please 管理
- **驗證再寫**：每行涉及檔案路徑/指令的內容都要實際 `ls` / 執行驗證
- **Audit Report 是必交付物**：即使「什麼都不需要改」也必須輸出報告說明原因
