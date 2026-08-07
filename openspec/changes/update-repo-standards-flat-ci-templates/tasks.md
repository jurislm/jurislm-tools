## 1. 模板 A：補上 build 與 release-pr-auto-merge

- [x] 1.1 `plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`「標準模板 A」段落：範例 YAML 新增 `build` pipeline（`bun run build`，理由：RSC client/server 邊界違規等 build-only 失敗，typecheck/lint 抓不到），移除或修正「Coolify 端會 build，不需要獨立 build job」這段過時論點
- [x] 1.2 同檔案模板 A 範例 YAML 新增 `release-pr-auto-merge` pipeline（`depends_on: [release-please, deploy]`、`concurrency: { limit: 1 }`）——並加一段說明其依賴 `scripts/ci/release-pr-auto-merge.ts`（從 entire/musicer 移植，不重新設計驗證邏輯）
- [x] 1.3 `plugins/repo-standards/skills/repo-standards/SKILL.md`「CI Workflow 設定」（無需改，本就只是概述、指向 reference 檔）與「新增 Repo Checklist」段落同步更新 pipeline 清單描述，與 1.1/1.2 一致；**額外發現並一併修正**：`references/new-repo-checklist.md` 的 CI/CD checklist（item 30-42）也漏了 `build`／`release-pr-auto-merge`，同步補上並重新排序後續項目編號；同一批順手修正該檔「發版收尾」章節一條已不適用的「依模式 95 把 develop 重新同步至 main」殘留項目（與正在修的 CI 內容緊密相關，同一區塊）——**注意**：`new-repo-checklist.md` 更上游的「## Git Worktree」整個章節（develop 兩段式流程）仍是過時的，但已確認超出本次 change 範圍，另開背景任務追蹤（task_d5ba6ae0），本次不動

## 2. 模板 B：核對並修正 pipeline 清單與 entire 現況的落差

- [x] 2.1 用 `git log`／直接讀 `entire/.drone.yml` 核對目前完整 pipeline 清單與計數（design.md 已記錄查證結果：12 條），更新 `ci-workflow-templates.md`「標準模板 B」的 bullet 清單與計數敘述
- [x] 2.2 模板 B 新增一句對 `release-pr-auto-merge`（多 app 版本）的說明，比照既有「Monorepo 多 app 部署較複雜」段落的寫法
- [x] 2.3 模板 B 新增一段簡短點名 `detect-missed-push-builds`／`audit-missed-builds`／`audit-shared-migration-drift` 三條 pipeline 存在＋一句「為何存在」摘要，並明確標註為「entire 累積的事故應對機制，非其他 monorepo 採用時的必要基準」（design.md D2，不展開完整 YAML）

## 3. Living spec 同步

- [x] 3.1 `openspec/specs/docs-and-standards/repo-standards-detail.md` 新增「## CI/CD 模板同步」段落，比照該檔案既有段落風格（說明文，非 SHALL 用語），涵蓋 `specs/docs-and-standards/spec.md` 新增需求的可驗證重點
- [x] 3.2 `openspec validate --strict` 確認四項 artifacts 通過

## 4. 驗收

- [x] 4.1 人工檢查：模板 A、模板 B 的 pipeline 清單、計數、範例 YAML 三者互相一致，且與 `entire/.drone.yml` 現況（12 條）對得上
- [x] 4.2 人工檢查：`SKILL.md` 與 `ci-workflow-templates.md` 之間沒有互相矛盾的敘述（例如一處說「不需要 build job」另一處卻列出 build pipeline）——已確認模板 A 收尾註解的舊論點已移除
- [x] 4.3 確認本次變更未觸碰模板 C（npm/MCP）、模板 D（Plugin）段落（Non-Goals）——已用 diff 核對

## 5. 本地 code review（PR 開出前）

- [x] 5.1 執行 `superpowers:requesting-code-review`（單一 general-purpose reviewer，非 fan-out）：涵蓋 plan alignment／內容正確性／scope discipline／validate 通過與否。結果：0 Critical（第一輪報告有 1 Critical，修正後確認為 Critical）、實際 1 Critical＋2 Important＋2 Minor，**Ready to merge: With fixes**
- [x] 5.2 處理 Critical（「musicer 是 flat repo 落地這兩條 pipeline 的第一個參考實作」為錯誤宣稱）：已用 `git log`／直接讀 `lexvision/.drone.yml` 獨立查證，確認 `jurislm/lexvision` 早在 2026-07-27（`eda8e15`）就已有這兩條 pipeline，且累積了額外強化（拒絕過時部署等）。修正模板 A 開頭敘述與 `release-pr-auto-merge.ts` 移植來源說明，改為推薦優先參考 lexvision
- [x] 5.3 處理 Important #1（prose「設定步驟」「部署收尾」章節與更新後的 YAML／checklist 產生新的內部矛盾）：`ci-workflow-templates.md` 的「設定步驟」步驟 3 補 `build`、新增步驟 6（`release-pr-auto-merge`）；「結果」與「部署收尾」段落補充 auto-merge 情境；`SKILL.md` 的濃縮版「部署（CD）」章節同步補 `build` 與選用的 `release-pr-auto-merge` 項目
- [x] 5.4 處理 Minor #2（模板 B「`build` pipeline 直跑 `cd apps/web && bun run build`」已過時，entire 現在建置 5 個 app）：已用 `entire/scripts/ci/run-gate.sh` 查證現況（web／login／ops／console／docs），修正該 bullet
- [x] 5.5 Minor #1（`release-please` vs `release` pipeline 命名跨 repo 不一致）：reviewer 確認屬既有落差、非本次引入，且是更大範圍的命名一致性決定——記錄但不在本次修正
- [x] 5.6 `openspec validate --strict` 確認四項 artifacts 仍通過

## 6. GitHub Copilot review（PR #198 開出後）

- [x] 6.1 Copilot 自動 review 完成（`COMMENTED`，3 則 inline comment），皆為合理發現：
  - `SKILL.md:463` — 「`build` 與 `deploy` pipeline」與其後的 `clone: { disable: true }` 放同一句，容易誤讀成 build 也要 disable clone（但 build 需要完整 clone 才能執行建置）。已拆開明確標註只有 `deploy` 用 `clone: { disable: true }`
  - `ci-workflow-templates.md:333` — 模板 A 開頭宣告 6 個 pipeline，但「設定步驟」第 6 步（`release-pr-auto-merge`）卻標「選用」，前後矛盾。已移除「選用」，`SKILL.md` 對應段落同步修正
  - `new-repo-checklist.md:62` — `release-pr-auto-merge.ts` 移植來源提及 `entire`／`musicer`，未同步模板 A 已改的「lexvision 優先」推薦。已補上並標註優先順序
- [x] 6.2 `openspec validate --strict` 確認四項 artifacts 仍通過
- [ ] 6.3 回覆並 resolve PR #198 上全部 3 則 Copilot review thread
