## 1. 模板 A：補上 build 與 release-pr-auto-merge

- [ ] 1.1 `plugins/repo-standards/skills/repo-standards/references/ci-workflow-templates.md`「標準模板 A」段落：範例 YAML 新增 `build` pipeline（`bun run build`，理由：RSC client/server 邊界違規等 build-only 失敗，typecheck/lint 抓不到），移除或修正「Coolify 端會 build，不需要獨立 build job」這段過時論點
- [ ] 1.2 同檔案模板 A 範例 YAML 新增 `release-pr-auto-merge` pipeline（`depends_on: [release-please, deploy]`、`concurrency: { limit: 1 }`）
- [ ] 1.3 `plugins/repo-standards/skills/repo-standards/SKILL.md`「CI Workflow 設定」與「新增 Repo Checklist」段落同步更新 pipeline 清單描述，與 1.1/1.2 一致

## 2. 模板 B：核對並修正 pipeline 清單與 entire 現況的落差

- [ ] 2.1 用 `git log`／直接讀 `entire/.drone.yml` 核對目前完整 pipeline 清單與計數（design.md 已記錄查證結果：12 條），更新 `ci-workflow-templates.md`「標準模板 B」的 bullet 清單與計數敘述
- [ ] 2.2 模板 B 新增一句對 `release-pr-auto-merge`（多 app 版本）的說明，比照既有「Monorepo 多 app 部署較複雜」段落的寫法
- [ ] 2.3 模板 B 新增一段簡短點名 `detect-missed-push-builds`／`audit-missed-builds`／`audit-shared-migration-drift` 三條 pipeline 存在＋一句「為何存在」摘要，並明確標註為「entire 累積的事故應對機制，非其他 monorepo 採用時的必要基準」（design.md D2，不展開完整 YAML）

## 3. Living spec 同步

- [ ] 3.1 `openspec/specs/docs-and-standards/repo-standards-detail.md` 併入本次 change 的 `specs/docs-and-standards/spec.md` 新增需求（「Flat-repo CI template stays synchronized with its reference repo」），比照該檔案既有段落風格（非強制逐字照抄 spec.md 的 SHALL 用語，維持檔案原本的說明文風格即可，但涵蓋同樣的可驗證重點）
- [ ] 3.2 `openspec validate --strict` 確認四項 artifacts 通過

## 4. 驗收

- [ ] 4.1 人工檢查：模板 A、模板 B 的 pipeline 清單、計數、範例 YAML 三者互相一致，且與 `entire/.drone.yml` 現況（12 條）對得上
- [ ] 4.2 人工檢查：`SKILL.md` 與 `ci-workflow-templates.md` 之間沒有互相矛盾的敘述（例如一處說「不需要 build job」另一處卻列出 build pipeline）
- [ ] 4.3 確認本次變更未觸碰模板 C（npm/MCP）、模板 D（Plugin）段落（Non-Goals）
