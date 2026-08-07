## Context

`repo-standards` skill 的 CI 章節（`SKILL.md` + `references/ci-workflow-templates.md`）用兩個「標準模板」描述 Drone CI 該怎麼設：模板 A（flat repo Coolify web app）與模板 B（monorepo，明言「不是 copy-paste 模板，以 `entire/.drone.yml` 為準鏡像」）。模板 B 既然是「鏡像 entire」，理論上該隨 entire 演進同步更新；模板 A 雖然是獨立設計（不是逐檔鏡像），但其「Next.js build 在 Coolify 端進行、CI 不需要獨立 build job」這個論點的前提——flat repo 不會遇到只有 prod build 才會爆的失敗類別——並不成立：entire 在 2026-06-02 新增 `build` pipeline的理由（RSC client/server 邊界違規，typecheck/lint 抓不到）是 Next.js App Router 的通用風險，與 monorepo 與否無關。

`jurislm/musicer` 設定 Drone CI 時（`add-drone-ci` change）因此對「該完全比照 entire 現況，還是比照模板 A」產生真實分歧——使用者最終指示比照 entire 現況，並指出這是模板 A 過時、不是 entire 過度設計。

已用 `git log` 查證（非假設）：

| Pipeline | entire 新增時間 | commit |
|---|---|---|
| `build` | 2026-06-02 | `e6544614` |
| `release-pr-auto-merge` | 2026-07-21 | `371c48a7` |

**實作階段補充（code review 發現，2026-08-07）**：本次撰寫 proposal 時的環境盤點只查了 entire（模板 B 的鏡像來源），沒有檢查其他已宣稱屬於模板 A 類別的 sibling repo 是否已經自行超前模板 A 落地這兩條 pipeline。Code review 用 `git log` 查證發現 `jurislm/lexvision`（同屬 flat repo）早在 2026-07-27（`eda8e15`）就已有 `build`＋`release-pr-auto-merge`，比 musicer 的 `add-drone-ci` change 早了約 10 天，且累積了額外強化（拒絕過時部署、綁定 release 合併需完整檢查通過等後續 commit）。已修正 `ci-workflow-templates.md` 內「musicer 是第一個參考實作」的錯誤宣稱，改為推薦優先參考 lexvision。這也印證本節開頭的論點本身——環境盤點若只查了「理論上的鏡像來源」（entire），仍可能漏掉「其他已自行超前的同類 repo」，值得記入未來規範回填協議的檢查項。

`ci-workflow-templates.md` 最後一次觸碰「模板 A」相關段落的 commit 早於這兩個時間點；2026-07-27 那次修改（`27dd346`）雖然是該檔案目前最新的一次改動，但只修正了 release-please 步驟順序與新增 Plugin 型 Drone 支援，並未回頭檢視模板 A 或模板 B 的 pipeline 清單——用實際 diff 核對過，這兩個段落完全沒被觸碰。這證實落差是「規範回填協議沒被執行」，不是「當時評估過、決定不採用」。

## Goals / Non-Goals

**Goals:**
- 模板 A 補上 `build`（含「為何 flat repo 也需要」的通用理由）與 `release-pr-auto-merge`（含 `concurrency: limit: 1`）
- 模板 B 的 pipeline 清單與計數與 entire 目前實際狀態一致
- 在 `docs-and-standards/repo-standards-detail.md` 留一條可驗證的要求，讓「模板落後參考 repo」這類落差未來更容易被檢查出來

**Non-Goals:**
- 不把 entire 專屬的 `detect-missed-push-builds`／`audit-missed-builds`／`audit-shared-migration-drift` 三條事故驅動 pipeline 寫進模板 A——這些解決的是 entire 已實際發生過的特定事故（漏發 webhook、shared DB migration 漂移），flat repo 與 monorepo 皆無對應歷史前不需要當成必要基準；模板 B 僅點名這三者存在、標註為「entire 累積的事故應對機制，非其他 monorepo 採用時的必要基準」，不逐一展開完整 YAML
- 不變更任何已上線 repo 的 `.drone.yml`——這是 skill 參考內容本身的修正，各 repo 是否要據此更新是各自獨立的後續決定
- 不重新設計「規範回填協議」本身的執行機制（例如自動化檢查）——本次只補一條人工可驗證的 spec 要求

## Decisions

### D1. 模板 A 新增 `build` 與 `release-pr-auto-merge`，理由獨立於「鏡像 entire」

模板 A 從未宣稱是 entire 的鏡像（那是模板 B 的定位），所以補上這兩條 pipeline 的理由不是「因為 entire 有」，而是各自成立：

- `build`：RSC client/server 邊界違規等 build-only 失敗，是任何 Next.js App Router app（不論 flat 或 monorepo）共通的風險類別，與 lint/typecheck 檢查的靜態分析範疇不重疊。原本「Coolify 端會 build，不需要 CI 另外 build」的論點沒有考慮到：CI build 失敗發生在 merge 前（PR 階段就能攔截），Coolify build 失敗發生在 deploy 階段（合併之後才發現，雖然不影響 prod 因為部署失敗、但反饋週期慢很多）
- `release-pr-auto-merge`：release-please 版本 PR 全自動合併，是「deploy-gating 之後」的自然延伸——deploy pipeline 已確保部署程式碼有把關，release PR 合併本身也該有等價的把關（自身檢查 + deploy 皆綠燈才合併），不需要每次手動合併

### D2. 模板 B：只更新 pipeline 清單與計數，不逐一補完事故驅動 pipeline 的完整 YAML

entire 目前實際 `.drone.yml` 共 12 條 pipeline（`lint-typecheck`／`cli`／`app`／`module`／`package`／`release`／`build`／`deploy`／`release-pr-auto-merge`／`detect-missed-push-builds`／`audit-missed-builds`／`audit-shared-migration-drift`），模板 B 目前文字只列 7 條（缺 `deploy`、`release-pr-auto-merge`、與三條事故驅動 pipeline）。

更新方式：pipeline 清單與計數改為準確反映全部 12 條；`deploy`／`release-pr-auto-merge` 沿用模板 A 新增的說明方式（多 app 版本，模板 B 原本已有「Monorepo 多 app 部署較複雜」的說明段落，`release-pr-auto-merge` 補一句對應）；三條事故驅動 pipeline 只點名存在＋一句「為何存在」的極簡摘要＋標註為 entire 累積結果而非其他 monorepo 的必要基準，不展開完整 YAML 或觸發細節——這三者高度綁定 entire 的具體事故史（webhook 漏發、shared DB migration 落差），對其他目前還沒有 monorepo 的 repo 而言，展開完整模板的維護成本高於其參考價值。

### D3. `docs-and-standards/repo-standards-detail.md` 新增一條可驗證要求

該檔案目前是高層次摘要（Repo 分類、Worktree 規則、Release Please 設定），沒有涉及 pipeline 層級細節，也沒有任何要求描述「模板要跟參考 repo 同步」這件事本身。新增一條 MODIFIED Requirement，明確要求「flat-repo CI 模板的 pipeline 清單須與 entire 現況同步」，並附一個可操作的驗證情境（比對 `entire/.drone.yml` 的 pipeline 名稱清單與模板 A 文件內容一致）。這條要求本身不會自動被強制執行（repo-standards 沒有自動化檢查機制，見 Non-Goals），但至少讓未來人工或 agent 審查這個 skill 時，有一條明確、可對照的判準，而不是像這次一樣要重新從 git log 挖掘證據才發現落差。

## Risks / Trade-offs

- **[風險] 模板更新後，其他已用模板 A 建立 CI 的 repo（memory-dessert／lawyer／stock）現在跟新模板不一致**：這是純文件變更，不會主動去改這些 repo 的 `.drone.yml`（見 Non-Goals）。→ **緩解**：這些 repo 若要補 `build`／`release-pr-auto-merge`，是各自獨立的後續決定，不在本次範圍；本次只確保「以後有人依照模板 A 設定新 repo 時」拿到正確版本
- **[Trade-off] 模板 B 只點名三條事故驅動 pipeline 而不展開完整內容**：若未來真的有新 monorepo 需要同樣的事故防護，仍需要回頭讀 entire 原始碼而非直接抄模板。→ 已在 D2 說明取捨：這三者對「其他 repo 尚無對應事故史」時的參考價值低，展開只會製造維護負擔（entire 自己都還在持續調整這幾條 pipeline 的行為，如 `detect-missed-push-builds` 的 `depends_on` 順序曾因實際 bug 調整過）

## Migration Plan

1. 更新 `SKILL.md`、`references/ci-workflow-templates.md`（模板 A／B）
2. 更新 `openspec/specs/docs-and-standards/repo-standards-detail.md`（同步 living spec，非只改 delta）
3. `openspec validate --strict`
4. PR → merge（純文件變更，無部署驗收步驟）
5. 歸檔本 change

無 rollback 疑慮——純 Markdown 內容變更，沒有執行期行為，git revert 即可完全復原。

## Open Questions

（無）
