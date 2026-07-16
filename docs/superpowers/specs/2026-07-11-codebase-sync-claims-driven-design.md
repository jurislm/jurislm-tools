# codebase-sync：從存在性掃描改為 Claims-Driven 逐條取證驗證

- Issue: [jurislm/jurislm-tools#121](https://github.com/jurislm/jurislm-tools/issues/121)
- 日期：2026-07-11

## 問題

`codebase-sync` skill（現行 skill 版本 v2.0.0，見 `plugins/codebase-sync/skills/codebase-sync/SKILL.md` YAML frontmatter；與 `plugin.json` 的 plugin 版本號無關）目的是把最新代碼的**功能與架構變化**同步進 README.md / CLAUDE.md，但現行設計本質是「結構/字串比對 + git-log 啟發式」，無法抓語意層的功能/架構漂移。

四個結構性缺口（詳見 issue）：
1. 全程不讀原始碼（只讀 docs + `package.json` / `plugin.json` + git log）。
2. Audit Report Section 5（描述準確性檢查）是唯一該做語意驗證的段落，卻是空模板，最容易被填「無」草草結案。
3. 存在性檢查對「狀態性描述」（已刪/stub/重建）製造假陰性——目錄存在就回報 OK，掩蓋內容矛盾。
4. git-log 視窗（最近 30-50 筆）與 doc drift 的時間尺度錯配，補不了「舊漂移」。

對抗式多視角評估（4 視角 + 3 紅隊）一致判定現行 v2 設計「does-not-solve」。

## 目標

把文件內容當成一組**可被證偽的宣稱（claims）**，工作方式從「掃目錄看有沒有」改成「把每條可驗證宣稱抽出來，各自綁定該讀哪個權威來源去對照」。範圍天然收斂到文件實際宣稱的點，同時解決「大 repo 讀不完」的問題。

## 範圍

僅修改 `plugins/codebase-sync/skills/codebase-sync/` 底下的檔案：

1. `SKILL.md`（修改）
2. `references/claims-inventory.md`（新增）
3. `references/regression-examples.md`（新增）
4. `references/templates.md`（修改）

不涉及其他 plugin、hook 或 marketplace 設定。版本號交 Release Please 管理，不手動 bump。

## 設計

### 1. Claims Inventory 對照表（`references/claims-inventory.md`，新增）

沿用 issue 給定的 6 類宣稱，每類列出「文件裡長怎樣（範例句型）」與「權威來源（要 Read/grep 的具體指令）」：

| 宣稱類型 | 文件裡長怎樣 | 權威來源 |
|---|---|---|
| CLI 指令 | `sync judicial --category` | 先搜尋 `.command(` 與 `addCommand(` 定位候選位置，再 Read 命中處周邊的完整註冊流程／command tree 確認實際有效註冊（字串命中不等於真的有註冊，可能是註解或死碼），逐條記錄實際輸出 |
| 流程/自動化 | 「pre-commit 跑 lint+typecheck+test」 | `Read .husky/pre-commit`、CI yaml、Dockerfile 逐句對照 |
| 模組/目錄狀態 | 「X 已刪除 / 是 stub / 已重建 / 未啟用」 | `git ls-files modules/X` + Read 進入檔判定內容 |
| 架構/資料流 | 「向量存 pgvector」 | grep service 名 / feature flag + migration + `openspec/changes/` |
| 結構計數 | 「24 modules / 16 packages」 | `git ls-files '*/package.json'` 僅列出被追蹤的路徑，不能當空殼過濾器；須逐一 Read 每個 `package.json` 內容，依「有無實際程式碼、非僅殘留 `node_modules`/`.turbo` 快取」判定是否為空殼後才計數 |
| scripts/env/版本 | `bun run build` / `DATABASE_URL` / 5.x | Read 對應的 `package.json` scripts 區塊、`.env.example`／`.env.shared.example`、`package.json` 的 `engines`／依賴版本號逐條核對；版本只報告現況不改動 |

`SKILL.md` 在 Step 1 之後新增「Step 1.5：建立 Claims Inventory」，指示逐條讀 README.md / CLAUDE.md，依上表分類抽出可驗證宣稱，連結到此參考檔。

### 2. Audit Report Section 5 改為硬性表格

現行：
```text
### 5. 描述準確性檢查
- [README/CLAUDE.md 的描述與實際程式碼不符之處] 或 [無]
```

改為：
```text
### 5. 描述準確性檢查（Claims-Driven）
| 宣稱 | 取證指令 | 實際輸出 | 一致? |
|---|---|---|---|
| ... | ... | ... | 是/否 |
```
規則：任何一列標記「一致」都必須附對應取證指令與實際輸出；不得只寫結論不附證據。若 Claims Inventory 為空（文件本身無可驗證宣稱），需說明原因而非留白。

### 3. git-log 降級為輔助訊號

Step 0-J~0-N 前加警語：git-log 只是線索、非 ground truth；Claims Inventory 驗證必須獨立於 commit 視窗跑過全部宣稱，不得因漂移不在最近 30-50 筆內就略過。

### 4. 修正存在性假陰性

「常見錯誤」表新增一列：
| 錯誤 | 正確做法 |
|---|---|
| 文件對某路徑有狀態性描述（已刪/stub/重建/未啟用）時，只憑目錄存在就回報 OK | 目錄存在 ≠ 宣稱成立，必須 Read 內容確認狀態描述是否仍正確 |

### 5. repo-type 行為驗證清單（`references/templates.md`，修改）

現有三種類型模板（Next.js Web App / MCP Server-CLI Tool / Plugin-Marketplace）各補一段「行為驗證清單」：
- **CLI tool**：驗指令樹（實際註冊的 command/subcommand vs 文件描述）
- **Web app**：驗 routes / middleware-proxy / hooks（pre-commit、CI）
- **Plugin/Marketplace**：驗每個 plugin 的 `plugin.json` 是否與 `marketplace.json` 一致、skill 清單是否對應實際目錄

### 6. 完成提醒 + 內建回歸範例

- 「注意事項」段落新增一句軟性提醒：「Section 5 若整表填『一致』卻無任何取證指令與輸出，代表審計不完整，需回頭補做」——不做額外機制化 gate，靠 agent 自律遵守（維持現行 skill 一貫的「每項結論需來自實際輸出」風格）。
- 新增 `references/regression-examples.md`，收錄 issue 提供的 3 個真實案例（皆發生於 `jurislm/entire`），每案例寫：
  1. 文件宣稱
  2. 天真存在性掃描的結果（會漏掉）
  3. Claims-driven 驗證步驟（該讀哪個檔案/跑哪個指令）
  4. 正確結論
  
  三案例：
  - CLI 指令移除（`sync judicial --category` 已從 CLI 移除，`sync.ts` 檔案仍在只是少了 subcommand）
  - 流程步驟變更（README 說 pre-commit 跑「lint+typecheck+test」，實際跑 lint-staged + turbo lint + turbo typecheck + openspec validate，無 test）
  - 模組狀態矛盾（CLAUDE.md 說 `notifications` 已刪除，實際已重建為 NotificationService + Resend adapter）

  `SKILL.md` 的「模板參考」段落加一句連結到此檔，說明「這才叫深度」的參考範例。

## 驗收標準

比照 issue 給的 3 個 checkbox，人工模擬走一遍新版 SKILL.md 流程（針對 `regression-examples.md` 內建案例）確認能抓到：
- [ ] 案例 1：靠 grep CLI 指令註冊碼抓到已移除的 subcommand
- [ ] 案例 2：靠讀 `.husky/pre-commit` 全文抓到流程步驟不符
- [ ] 案例 3：靠讀 `modules/notifications/src` 抓到狀態描述矛盾，不因目錄存在就回報 OK

以及：
- [ ] `jq . plugins/codebase-sync/.claude-plugin/plugin.json`（若存在）格式合法
- [ ] SKILL.md 的 markdown 結構完整、無斷裂表格
- [ ] 新增的 reference 檔皆從 SKILL.md 有明確連結，不是孤兒檔案

## 不做的事

- 不改其他 plugin
- 不手動改版本號
- 不加自動化程式碼（此 skill 本質是 prompt-based 指引文件，不涉及程式邏輯）
- 不做機制化的「拒絕結案」gate（採軟性提醒，維持現行 skill 風格一致）
