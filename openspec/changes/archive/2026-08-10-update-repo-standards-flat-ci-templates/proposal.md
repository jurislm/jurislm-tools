## Why

`repo-standards` skill's "標準模板 A"（flat repo Coolify web app：memory-dessert/lawyer/stock 這類）只列 4 條 Drone pipeline（`lint-typecheck`/`test`/`release-please`/`deploy`），並明言「Next.js 的 build 在 Coolify 端進行，CI 不需要獨立 build job」，也沒有 `release-pr-auto-merge`。但 `jurislm/entire`（模板 B 的鏡像來源）目前實際的 `.drone.yml` 已有 `build` pipeline（2026-06-02 新增，`e6544614`）與 `release-pr-auto-merge` pipeline（2026-07-21 新增，`371c48a7`），模板 A 從未回填這兩項演進。`jurislm/musicer` 設定 Drone CI 時因此對「該抄哪個版本」產生真實困惑（Closes #196）。skill 自己文件內定義的「規範回填協議」正是為了避免這種落差，這次補做。

## What Changes

- `SKILL.md`／`references/ci-workflow-templates.md` 的模板 A 新增 `build` pipeline（附「為何 flat repo 也需要」說明：與 monorepo 與否無關，是任何 Next.js App Router app 都可能遇到的 build-only 失敗類別，如 RSC client/server 邊界違規）與 `release-pr-auto-merge` pipeline（含 `concurrency: limit: 1`）
- 同步核對模板 B（monorepo）現有的 pipeline 清單與 entire 目前實際 `.drone.yml` 是否一致，修正發現的落差
- `docs-and-standards/repo-standards-detail.md` 補一條要求：flat-repo CI 模板需與 entire 現況同步，作為未來「規範回填協議」是否確實執行的可驗證依據

## Non-goals

- 不新增 entire 專屬的事故驅動 pipeline（`detect-missed-push-builds`／`audit-missed-builds`／`audit-shared-migration-drift`）進模板 A——這些解決 entire 已發生過的特定事故，flat repo 目前無對應歷史，`musicer` 的 `add-drone-ci` change 已就此單獨記錄範圍決定
- 不變更任何已上線 repo 的實際 `.drone.yml`（本次純粹是修正 skill 參考內容本身）
- 不評估或變更模板 A／B 以外的其他標準模板（C：npm/MCP、D：Plugin）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `docs-and-standards`：`repo-standards-detail` 新增「flat-repo CI 模板與 entire 現況同步」的可驗證要求

## Impact

- 受影響 plugin：`repo-standards`（`plugins/repo-standards/skills/repo-standards/SKILL.md`、`references/ci-workflow-templates.md`）
- 純文件內容修正，不影響任何已部署的 CI/CD 行為
- 觸發來源：`jurislm/musicer` 的 `openspec/changes/add-drone-ci/`（design.md 完整記錄比對過程），對應 issue #196
