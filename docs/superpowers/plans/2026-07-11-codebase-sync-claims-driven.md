# codebase-sync Claims-Driven 驗證 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `codebase-sync` skill 從「存在性掃描」改為「claims-driven 逐條取證驗證」，讓 Audit Report Section 5 真正抓到語意層的功能/架構漂移。

**Architecture:** 純文件/prompt 修改。新增兩個 reference 檔（`claims-inventory.md` 宣稱分類對照表、`regression-examples.md` 3 個真實回歸案例），修改 `templates.md` 補行為驗證清單，修改 `SKILL.md` 串起 Claims Inventory 流程並把 Section 5 改成硬性取證表格。不涉及任何程式邏輯，沒有測試框架可跑；「驗證」以 grep 確認內容存在、`jq` 驗證 JSON 合法、以及最終依 3 個回歸案例人工模擬走查 SKILL.md 流程取代單元測試。

**Tech Stack:** Markdown / YAML frontmatter（Claude Code skill 格式）、`jq`、`grep -E`（ERE）

## Global Constraints

- 僅修改 `plugins/codebase-sync/skills/codebase-sync/` 底下的檔案：`SKILL.md`、`references/claims-inventory.md`（新增）、`references/regression-examples.md`（新增）、`references/templates.md`
- 不改其他 plugin、hook 或 marketplace 設定
- 版本號禁止手動修改，交 Release Please 管理（`SKILL.md` YAML frontmatter 的 `version: 2.0.0` 這次不動，仍屬 v2 內的調整）
- 新增的 reference 檔必須從 `SKILL.md` 有明確連結，不留孤兒檔案
- grep 範例一律用 ERE 語法（`grep -E`，alternation 用未跳脫的 `|`），對齊 PR #124 review 修正
- 所有取證指令範例必須是真實可執行的指令（不可寫假指令），但允許用 `<cli 進入點>` 之類的佔位符表示「依實際 repo 填入路徑」

---

### Task 1: 新增 `references/claims-inventory.md`（宣稱分類對照表）

**Files:**
- Create: `plugins/codebase-sync/skills/codebase-sync/references/claims-inventory.md`

**Interfaces:**
- Consumes: 無（獨立內容檔）
- Produces: `SKILL.md` Step 1.5（Task 4）會連結到此檔的檔名 `references/claims-inventory.md`；Task 4 引用此檔中定義的「6 類宣稱」分類法（CLI 指令／流程自動化／模組目錄狀態／架構資料流／結構計數／scripts-env-版本）

- [ ] **Step 1: 建立檔案內容**

```bash
mkdir -p plugins/codebase-sync/skills/codebase-sync/references
```

寫入 `plugins/codebase-sync/skills/codebase-sync/references/claims-inventory.md`：

```markdown
# Claims Inventory — 宣稱分類 → 權威來源對照表

`codebase-sync` 的核心方法論：把 README.md / CLAUDE.md 的內容當成一組**可被證偽的宣稱（claims）**，不是「掃目錄看有沒有」，而是把每條可驗證宣稱抽出來，各自綁定該讀哪個權威來源去對照。

依下表分類逐條核對。每一類都要問：「文件這樣寫，我該去讀哪個檔案 / 跑哪個指令才能確認它還成立？」

| 宣稱類型 | 文件裡長怎樣（範例句型） | 權威來源（實際要 Read / grep 的指令） |
|---|---|---|
| CLI 指令 | 「執行 `sync judicial --category` 可以…」 | `grep -rE '\.command\(|addCommand\(' <cli 進入點>`，逐條比對文件寫的指令是否真的有註冊 |
| 流程/自動化 | 「pre-commit 會跑 lint + typecheck + test」 | `Read .husky/pre-commit`、CI yaml（如 `.github/workflows/*.yml` 或 `.drone.yml`）、`Dockerfile`，逐句對照文件描述的步驟 |
| 模組/目錄狀態 | 「X 模組已刪除」「Y 是 stub」「Z 已重建」「W 未啟用」 | `git ls-files modules/X`（確認是否還有檔案）+ `Read` 該目錄的進入檔，判定內容是否符合文件說的狀態 |
| 架構/資料流 | 「向量資料存在 pgvector」「訊息透過 X service 轉發」 | grep 相關 service 名稱 / feature flag + `Read` migration 檔 + `Read openspec/changes/` 底下相關 proposal |
| 結構計數 | 「目前有 24 個 modules / 16 個 packages」 | `git ls-files '*/package.json'`，過濾掉空殼目錄（沒有實際程式碼的 package.json）後數量比對，不要用 `find` 數目錄（會把空目錄也算進去） |
| scripts / env / 版本 | `bun run build`、`DATABASE_URL`、版本號 `5.x` | 沿用 `SKILL.md` Step 0 既有的 script/env 差異比對邏輯；版本號只報告現況，不做修改 |

## 使用方式

1. 在 `SKILL.md` Step 1.5，逐句讀 README.md / CLAUDE.md，把每個符合上表任一類的句子記錄下來，標註「屬於哪一類」與「要跑什麼取證指令」。
2. 把這份清單餵進 Step 2 Audit Report 的 Section 5 表格——每條宣稱一列，實際執行對應的取證指令，填入輸出，標記一致與否。
3. 若文件完全沒有可歸類的宣稱句（極少見，通常代表文件過度精簡），Section 5 要說明「無可驗證宣稱」的原因，而不是留空。

## 常見誤判

- **只看關鍵字比對就結案**：例如文件說「已移除 X 指令」，只 grep 檔名還在就回報「OK 沒問題」——檔案還在不代表指令還在，必須看該檔案裡的指令註冊碼。
- **狀態性描述當存在性檢查做**：見 `SKILL.md` 常見錯誤表——目錄存在 ≠ 宣稱成立。
- **只驗證「文件有寫的」，沒驗證「文件沒寫但代碼有的」**：Section 4（文件未記載的新增功能/目錄）要單獨處理，不算在 Claims Inventory 裡。
```

- [ ] **Step 2: 驗證檔案格式與連結完整**

```bash
test -f plugins/codebase-sync/skills/codebase-sync/references/claims-inventory.md && echo "exists"
grep -c '^|' plugins/codebase-sync/skills/codebase-sync/references/claims-inventory.md
```

Expected: `exists`，且表格行數 ≥ 7（含表頭與分隔線）

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/references/claims-inventory.md
git commit -m "feat(codebase-sync): 新增 claims inventory 對照表"
```

---

### Task 2: 新增 `references/regression-examples.md`（3 個真實回歸案例）

**Files:**
- Create: `plugins/codebase-sync/skills/codebase-sync/references/regression-examples.md`

**Interfaces:**
- Consumes: 無（獨立內容檔）
- Produces: `SKILL.md`「模板參考」段落（Task 8）會連結到此檔的檔名 `references/regression-examples.md`

- [ ] **Step 1: 建立檔案內容**

寫入 `plugins/codebase-sync/skills/codebase-sync/references/regression-examples.md`：

```markdown
# Regression Examples — Claims-Driven 驗證該挖多深

以下 3 個案例皆實際發生於 `jurislm/entire`，是舊版「存在性掃描」設計會漏掉、但 claims-driven 逐條取證能抓到的真實漂移。每個案例照「文件宣稱 → 天真掃描結果 → claims-driven 驗證步驟 → 正確結論」的順序寫，作為「這才叫深度」的參考範例。

## 案例 1：CLI 指令移除

**文件宣稱**：README 教使用者執行 `sync judicial --category <type>` 來同步司法資料。

**天真存在性掃描的結果（會漏掉）**：`find . -name "sync.ts"` 或 `grep -r "sync.ts" .` 會找到 CLI 進入點檔案 `sync.ts` 仍然存在 → 誤判為「OK，指令還在」。

**Claims-driven 驗證步驟**：
```bash
grep -rE '\.command\(|addCommand\(' <cli 進入點目錄>
```
讀取輸出，逐條比對 `judicial` 相關的 subcommand 是否真的還有 `--category` 這個選項被註冊。

**正確結論**：`sync.ts` 檔案雖然還在，但 `--category` 這個 subcommand 已經從指令註冊碼移除，改成用 `job trigger`、`embed judicial`、`chunk judicial` 這幾個獨立指令取代。README 若不更新，使用者照著做會得到「unknown option」錯誤。

---

## 案例 2：流程步驟變更

**文件宣稱**：README / CLAUDE.md 寫「pre-commit 會跑 lint + typecheck + test」。

**天真存在性掃描的結果（會漏掉）**：`test -f .husky/pre-commit && echo OK` 只確認檔案存在，不會讀內容 → 誤判為「OK，pre-commit 設定沒問題」。

**Claims-driven 驗證步驟**：
```bash
cat .husky/pre-commit
```
（用 Read 工具讀取，逐句核對每個實際執行的指令。）

**正確結論**：實際 `.husky/pre-commit` 執行的是 lint-staged + `turbo lint` + `turbo typecheck` + `openspec validate`，**沒有跑 test**。文件寫「跑 test」是錯的，會誤導開發者以為 pre-commit 會擋掉測試失敗的 commit。

---

## 案例 3：模組狀態矛盾

**文件宣稱**：CLAUDE.md 寫「`notifications` 模組已刪除」。

**天真存在性掃描的結果（會漏掉）**：`ls modules/notifications 2>/dev/null || echo MISSING` 若目錄不存在會回報 MISSING（看似「文件寫得對，目錄真的不在」）；但若目錄事後被重建，這個檢查會回報「目錄存在」→ 很容易被誤判成「文件過時但無傷大雅」而不深究內容。

**Claims-driven 驗證步驟**：
```bash
git ls-files modules/notifications
```
確認目錄底下實際有哪些檔案，然後用 Read 工具讀取進入檔（例如 `modules/notifications/src/index.ts`）確認目前的實作內容。

**正確結論**：`notifications` 模組不僅沒刪除，還已經**重建成新架構**（`NotificationService` + Resend adapter）。CLAUDE.md 說「已刪除」是嚴重過時的狀態性描述——目錄存在這件事本身就該觸發「讀內容確認」，而不是因為「反正文件說已刪除，目錄還在也可能只是殘留」就略過。

---

## 這三個案例的共通教訓

1. **檔案/目錄存在性檢查只能證明「東西沒被整個刪掉」，證明不了「內容還符合文件描述」。**
2. **任何涉及「指令、流程、狀態」的宣稱，都要讀到會實際執行/被讀取的那一層（指令註冊碼、hook 全文、模組進入檔），不能停在「這個路徑存在」就結案。**
3. **git-log 視窗抓不到「舊漂移」**——案例 1、2、3 的變更時間點不確定是否落在最近 30-50 筆 commit 內；claims-driven 驗證必須獨立於 commit 視窗，逐條把 Claims Inventory 跑完。
```

- [ ] **Step 2: 驗證檔案存在**

```bash
test -f plugins/codebase-sync/skills/codebase-sync/references/regression-examples.md && echo "exists"
grep -c '^## 案例' plugins/codebase-sync/skills/codebase-sync/references/regression-examples.md
```

Expected: `exists`，且案例數為 `3`

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/references/regression-examples.md
git commit -m "feat(codebase-sync): 新增 3 個真實漂移回歸案例參考"
```

---

### Task 3: 修改 `references/templates.md` — 各類型補「行為驗證清單」

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/references/templates.md`

**Interfaces:**
- Consumes: 無
- Produces: 無新介面，純內容補充

- [ ] **Step 1: 在 Web App 模板後插入行為驗證清單**

在 `## CLAUDE.md — Web App` 區塊結尾（`- <專案專屬陷阱>` 那個 code block 結束、`\`\`\`` 之後），`## CLAUDE.md — Plugin / Marketplace` 之前，插入：

```markdown
### 行為驗證清單 — Web App

- Routes：`find app -name "page.tsx" -o -name "route.ts"`，比對文件描述的功能是否都對應到實際路由檔案
- Middleware / Proxy：`Read middleware.ts`（或 Next.js 16 的 `proxy.ts`），核對文件描述的攔截規則、redirect 邏輯是否仍成立
- Pre-commit / CI hooks：`Read .husky/pre-commit`、CI yaml，逐句核對文件寫的檢查步驟（如「跑 lint + test」）是否與實際指令一致，不得只憑檔案存在就判定 OK
```

- [ ] **Step 2: 在 CLI Tool 模板後插入行為驗證清單**

在 `## README.md — MCP Server / CLI Tool` 區塊結尾（`| \`tool_a\` | ... |` 那個 code block 結束之後），`## CLAUDE.md — Web App` 之前，插入：

```markdown
### 行為驗證清單 — CLI Tool

- 指令樹：`grep -rE '\.command\(|addCommand\(' <cli 進入點>`，列出所有實際註冊的 command/subcommand，逐條比對文件寫的用法是否還存在
- 選項/flag：對照 CLI 進入點原始碼中 `.option(` / `.addOption(` 的定義，確認文件列出的每個 flag 都還真的被註冊
```

- [ ] **Step 3: 在 Plugin/Marketplace 模板後插入行為驗證清單**

在 `## CLAUDE.md — Plugin / Marketplace` 區塊結尾（`develop → PR → main` 那個 code block 結束之後），`## 偵測過時內容的具體規則` 之前，插入：

```markdown
### 行為驗證清單 — Plugin / Marketplace

- `plugin.json` vs `marketplace.json`：每個 plugin 的 `name`、`version` 是否兩邊一致（`jq '.version' plugins/<name>/.claude-plugin/plugin.json` 對照 `jq '.plugins[] | select(.name=="<name>") | .version' .claude-plugin/marketplace.json`）
- Skill 清單：`find plugins -name "SKILL.md"` 找出實際存在的 skill，確認文件的 plugin 清單表格都有對應列出，反之亦然
```

- [ ] **Step 4: 驗證插入位置正確、markdown 結構完整**

```bash
grep -n '^## ' plugins/codebase-sync/skills/codebase-sync/references/templates.md
grep -c '^### 行為驗證清單' plugins/codebase-sync/skills/codebase-sync/references/templates.md
```

Expected: `## ` 標題順序維持原本 6 個大區塊（README×2, CLAUDE.md×2, 偵測規則, 不要做的事）不變且無斷裂；`### 行為驗證清單` 數量為 `3`

- [ ] **Step 5: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/references/templates.md
git commit -m "feat(codebase-sync): templates 補齊 repo-type 行為驗證清單"
```

---

### Task 4: 修改 `SKILL.md` — 新增 Step 1.5「建立 Claims Inventory」

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/SKILL.md:156-162`

**Interfaces:**
- Consumes: Task 1 產出的 `references/claims-inventory.md`
- Produces: 「Step 1.5」這個段落標題，供 Task 5（Section 5 表格說明）文字引用

- [ ] **Step 1: 定位並插入新段落**

原文（`SKILL.md` 第 156-162 行）：

```markdown
```bash
find . -name "plugin.json" -not -path "*/node_modules/*" | head -20
```

---

## Step 2：輸出完整 Audit Report（禁止省略）
```

改為：

```markdown
```bash
find . -name "plugin.json" -not -path "*/node_modules/*" | head -20
```

---

## Step 1.5：建立 Claims Inventory（宣稱清點）

把 README.md / CLAUDE.md 逐句讀過，抽出所有**可被驗證的宣稱**（claim）——不是「看起來合理就跳過」，而是每一句涉及指令、流程、模組狀態、架構、計數、版本/env 的描述都要抽出來，記錄「宣稱內容」與「要讀哪個權威來源核對」。

**分類與權威來源對照表見 `references/claims-inventory.md`**，依該表的 6 種宣稱類型（CLI 指令／流程自動化／模組目錄狀態／架構資料流／結構計數／scripts-env-版本）逐條分類。

這份 Claims Inventory 是 Step 2 Audit Report Section 5 的輸入——沒有先做這步，Section 5 無法填寫。

---

## Step 2：輸出完整 Audit Report（禁止省略）
```

用 Edit 工具執行這個替換（`old_string` 從 `find . -name "plugin.json"` 那個 code block 開始，到 `## Step 2：輸出完整 Audit Report（禁止省略）` 結束，`new_string` 為上方改後版本）。

- [ ] **Step 2: 驗證新段落存在且順序正確**

```bash
grep -n '^## Step' plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected 輸出依序為：`## Step 0：...`、`## Step 1：...`、`## Step 1.5：建立 Claims Inventory（宣稱清點）`、`## Step 2：...`、`## Step 3：...`、`## Step 4：...`、`## Step 5：...`

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/SKILL.md
git commit -m "feat(codebase-sync): 新增 Step 1.5 Claims Inventory 流程"
```

---

### Task 5: 修改 `SKILL.md` — Audit Report Section 5 改為硬性取證表格

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/SKILL.md`（原第 186-187 行，Task 4 完成後行號會位移，用內容定位而非行號）

**Interfaces:**
- Consumes: Task 4 的 Step 1.5 段落名稱（表格說明文字會提到「Step 1.5」）
- Produces: 無新介面

- [ ] **Step 1: 替換 Section 5 內容**

原文：

```markdown
### 5. 描述準確性檢查
- [README/CLAUDE.md 的描述與實際程式碼不符之處] 或 [無]
```

改為：

```markdown
### 5. 描述準確性檢查（Claims-Driven，逐條取證）
| 宣稱 | 取證指令 | 實際輸出 | 一致? |
|---|---|---|---|
| [從 Step 1.5 Claims Inventory 逐條列入] | [實際執行的 Read/grep 指令] | [指令的實際輸出摘要] | 是/否 |

若 Claims Inventory（Step 1.5）為空，代表文件本身無可驗證宣稱，必須說明原因，不得留空。任何一列標記「是（一致）」都必須附對應取證指令與實際輸出，不得只寫結論不附證據。
```

用 Edit 工具執行這個替換。

- [ ] **Step 2: 驗證表格結構完整**

```bash
grep -A5 '### 5. 描述準確性檢查' plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected: 輸出包含表頭 `| 宣稱 | 取證指令 | 實際輸出 | 一致? |` 與分隔線 `|---|---|---|---|`

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/SKILL.md
git commit -m "feat(codebase-sync): Section 5 改為 claims-driven 硬性取證表格"
```

---

### Task 6: 修改 `SKILL.md` — git-log 降級為輔助訊號警語

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/SKILL.md`（Step 0 的 bash code block 內，`# 0-J` 那一行之前）

**Interfaces:**
- Consumes: 無
- Produces: 無新介面，純警語補充

- [ ] **Step 1: 在 0-J 前插入警語註解**

原文（Step 0 bash block 內）：

```bash
# 0-J 近期 git commit 摘要（最近 30 筆）
echo "=== 近期 git commits ==="
git log --oneline -30 2>/dev/null || echo "(not a git repo or no commits)"
```

改為：

```bash
# ⚠️ 以下 0-J~0-N 為 git-log 啟發式，僅供輔助線索、非 ground truth。
# Claims Inventory（Step 1.5）驗證必須獨立於此 commit 視窗跑過全部宣稱，
# 不得因某項漂移不在最近 30-50 筆 commit 內就略過不查。
# 0-J 近期 git commit 摘要（最近 30 筆）
echo "=== 近期 git commits ==="
git log --oneline -30 2>/dev/null || echo "(not a git repo or no commits)"
```

用 Edit 工具執行這個替換。

- [ ] **Step 2: 驗證警語存在且 bash 語法未破壞**

```bash
grep -B1 '# 0-J' plugins/codebase-sync/skills/codebase-sync/SKILL.md | head -5
bash -n <(sed -n '/^```bash/,/^```$/p' plugins/codebase-sync/skills/codebase-sync/SKILL.md | sed '/^```/d') 2>&1 | head -20
```

Expected: 第一個指令輸出看到警語三行註解；第二個指令（語法檢查整份 Step 0 腳本）無語法錯誤輸出（純註解行不影響 bash 語法）

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/SKILL.md
git commit -m "feat(codebase-sync): git-log 分析加註記為輔助訊號非 ground truth"
```

---

### Task 7: 修改 `SKILL.md` — 常見錯誤表新增假陰性列

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/SKILL.md`（「常見錯誤」表格）

**Interfaces:**
- Consumes: 無
- Produces: 無新介面

- [ ] **Step 1: 新增表格列**

原文（表格最後一列）：

```markdown
| 把 git commit message 原文複製進文件（「本次新增了 X」）| git log 是訊號來源，用來找出哪些地方需要更新；文件描述的是當前狀態，不是變更歷史 |
```

改為（在此列之後新增一列）：

```markdown
| 把 git commit message 原文複製進文件（「本次新增了 X」）| git log 是訊號來源，用來找出哪些地方需要更新；文件描述的是當前狀態，不是變更歷史 |
| 文件對某路徑有狀態性描述（已刪/stub/重建/未啟用）時，只憑目錄存在就回報 OK | 目錄存在 ≠ 宣稱成立，必須 Read 內容確認狀態描述是否仍正確（見 `references/regression-examples.md` 案例 3）|
```

用 Edit 工具執行這個替換。

- [ ] **Step 2: 驗證表格列數增加且格式正確**

```bash
grep -c '^|' plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected: 比 Task 7 執行前多 1 列（可先用 `git diff --stat` 確認只新增一行）

- [ ] **Step 3: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/SKILL.md
git commit -m "feat(codebase-sync): 常見錯誤表補狀態性描述假陰性案例"
```

---

### Task 8: 修改 `SKILL.md` — 模板參考連結 regression-examples + 注意事項軟性提醒

**Files:**
- Modify: `plugins/codebase-sync/skills/codebase-sync/SKILL.md`（「模板參考」段落、「注意事項」段落）

**Interfaces:**
- Consumes: Task 2 產出的 `references/regression-examples.md`
- Produces: 無新介面

- [ ] **Step 1: 修改「模板參考」段落**

原文：

```markdown
## 模板參考

不同專案類型的 README / CLAUDE.md 標準模板，見 `references/templates.md`：
- Next.js Web App
- MCP Server / CLI Tool
- Plugin / Marketplace
```

改為：

```markdown
## 模板參考

不同專案類型的 README / CLAUDE.md 標準模板，見 `references/templates.md`：
- Next.js Web App
- MCP Server / CLI Tool
- Plugin / Marketplace

真實案例示範「claims-driven 驗證該挖多深」，見 `references/regression-examples.md`（3 個實際發生過、天真存在性掃描會漏掉的漂移案例）。
```

- [ ] **Step 2: 修改「注意事項」段落，新增軟性提醒**

原文（注意事項段落最後一列）：

```markdown
- **Audit Report 是必交付物**：即使「什麼都不需要改」也必須輸出報告說明原因
```

改為（在此列之後新增一列）：

```markdown
- **Audit Report 是必交付物**：即使「什麼都不需要改」也必須輸出報告說明原因
- **Section 5 不得空表過關**：若整張表填「是（一致）」卻無任何取證指令與實際輸出，代表審計不完整，必須回頭補做，不能只憑印象填「一致」
```

用 Edit 工具分別執行這兩個替換。

- [ ] **Step 3: 驗證兩處修改都生效**

```bash
grep -A2 '## 模板參考' plugins/codebase-sync/skills/codebase-sync/SKILL.md | grep -c "regression-examples"
grep -c "Section 5 不得空表過關" plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected: 兩個指令輸出都是 `1`

- [ ] **Step 4: Commit**

```bash
git add plugins/codebase-sync/skills/codebase-sync/SKILL.md
git commit -m "feat(codebase-sync): 模板參考連結回歸案例 + Section 5 完成提醒"
```

---

### Task 9: 最終驗證 — 依 spec 驗收標準人工走查

**Files:**
- 無新增/修改，純驗證

**Interfaces:**
- Consumes: Task 1-8 全部產出
- Produces: 驗收結論（供 PR 描述使用）

- [ ] **Step 1: JSON 格式驗證**

```bash
jq . plugins/codebase-sync/.claude-plugin/plugin.json
```

Expected: 輸出合法 JSON（此 Task 未動 plugin.json，此步驟純確認未被意外破壞）

- [ ] **Step 2: 確認新增 reference 檔都從 SKILL.md 有連結（無孤兒檔案）**

```bash
grep -c "references/claims-inventory.md" plugins/codebase-sync/skills/codebase-sync/SKILL.md
grep -c "references/regression-examples.md" plugins/codebase-sync/skills/codebase-sync/SKILL.md
grep -c "references/templates.md" plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected: 三個指令輸出都 ≥ `1`

- [ ] **Step 3: markdown 結構完整性檢查（標題層級、code block 配對）**

```bash
grep -c '^```' plugins/codebase-sync/skills/codebase-sync/SKILL.md
```

Expected: 偶數（代表所有 code fence 都有頭有尾配對）

- [ ] **Step 4: 依案例 1 人工走查新版 SKILL.md 流程**

模擬情境：一個 repo 的 README 寫「執行 `sync judicial --category` 同步司法資料」，但 CLI 進入點已移除該 subcommand。

依新版 SKILL.md 走：Step 1.5 應抽出這句作為「CLI 指令」類宣稱 → 依 `references/claims-inventory.md` 對照表，權威來源是 `grep -rE '\.command\(|addCommand\(' <cli 進入點>` → Step 2 Section 5 表格會列出這條宣稱、取證指令、實際輸出（不含 `--category`）、一致=否。

Expected: 確認新版流程的每一步都有明確指向這個結論的路徑（不是「可能抓到」而是「流程步驟本身要求抓到」）

- [ ] **Step 5: 依案例 2 人工走查**

模擬情境：文件寫「pre-commit 跑 lint+typecheck+test」，實際 `.husky/pre-commit` 沒有 test 步驟。

依新版 SKILL.md 走：Step 1.5 應抽出這句作為「流程/自動化」類宣稱 → 權威來源是 `Read .husky/pre-commit` → Section 5 表格列出宣稱、Read 出的實際內容、一致=否。

Expected: 同上，確認流程步驟本身會導向這個結論

- [ ] **Step 6: 依案例 3 人工走查**

模擬情境：CLAUDE.md 寫「`notifications` 已刪除」，實際已重建。

依新版 SKILL.md 走：Step 1.5 應抽出這句作為「模組/目錄狀態」類宣稱 → 常見錯誤表已明確禁止「目錄存在就回報 OK」→ 權威來源是 `git ls-files modules/notifications` + Read 進入檔 → Section 5 表格列出宣稱、實際讀到的內容（NotificationService + Resend adapter）、一致=否。

Expected: 同上

- [ ] **Step 7: 產出驗收結論摘要（供 PR 描述使用）**

手動確認以下清單全部打勾後，記錄到 commit message 或 PR 描述：

- [ ] 案例 1（CLI 指令移除）：新流程有明確步驟導向抓到
- [ ] 案例 2（流程步驟變更）：新流程有明確步驟導向抓到
- [ ] 案例 3（模組狀態矛盾）：新流程有明確步驟導向抓到，且常見錯誤表已禁止假陰性判法
- [ ] `plugin.json` 格式合法
- [ ] SKILL.md markdown 結構完整
- [ ] 新增 reference 檔皆有從 SKILL.md 連結

- [ ] **Step 8: 最終 commit（若 Step 1-6 有發現需要補的小修正）**

若走查過程中發現任何段落措辭不夠精確（例如取證指令範例與 claims-inventory.md 不一致），在此步驟修正並 commit：

```bash
git add plugins/codebase-sync/skills/codebase-sync/
git commit -m "fix(codebase-sync): 依最終走查修正措辭一致性"
```

若無需修正，此步驟略過（不建立空 commit）。

---

## Self-Review 摘要（供執行者參考）

- **Spec 覆蓋**：spec 的 6 項改動 → Task 1（對照表）、Task 5（Section 5 表格）、Task 6（git-log 降級）、Task 7（假陰性修正）、Task 3（repo-type 清單）、Task 2+8（完成提醒+回歸範例），全部有對應 Task
- **無 placeholder**：所有 Task 的程式碼/文字區塊皆為完整內容，無 TBD
- **一致性**：Task 4 的 Step 1.5 標題文字與 Task 5 Section 5 表格說明中引用的「Step 1.5」字樣一致；Task 1 claims-inventory.md 的 grep 範例與 Task 5 Section 5 表格範例、Task 3 CLI 行為驗證清單的 grep 範例，三處指令語法一致（皆用 ERE `|` 不跳脫）
