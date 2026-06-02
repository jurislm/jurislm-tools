# Drone CI/CD 模板（lint / typecheck / test / release / deploy）

> CI / release / 部署觸發的標準平台是自架 Drone（`https://ci.jurislm.com`），設定檔為 repo 根目錄的 **`.drone.yml`**。平台依 **repo 類型**決定（repo 名僅為範例）：
>
> | repo 類型 | CI（lint/typecheck/test）| release-please | 部署 / 發布 |
> |---|---|---|---|
> | Coolify web app（如 memory-dessert）| Drone | Drone | Drone `deploy` pipeline（deploy-gating，模板 A）|
> | Monorepo（如 entire）| Drone（per-package pipeline）| Drone | 每個 app 一個 deploy step |
> | npm / MCP（如 coolify-mcp）| Drone | release-please + npm publish | npm（無 Coolify 部署）|
> | Plugin（純文字，如 jurislm-tools）| GitHub Actions `version-check.yml`（JSON / 版本驗證）| GitHub Actions `release.yml` | — |
>
> Code review：人工 `/code-review` + bot（CodeRabbit / Copilot）。**自動 Claude PR 審查已從標準移除（2026-06-02）**，不再設 `claude-code-review.yml` / `claude.yml` 或 Drone `claude-review` pipeline。Copilot 自訂指示模板見 `references/code-review-setup.md`。

---

## Drone 基本結構與觸發語意

- **每個檢查 = 一個獨立 pipeline**（YAML document，用 `---` 分隔）= Drone UI 一個 top-level stage。
- **各 pipeline 隔離**：自行 `clone` + `bun install`（Drone **不支援**跨 pipeline 共用 workspace；temp volume 僅 pipeline 內 step 間有效）。
- **GitHub PR 只顯示「1 個」aggregated check**（`drone/pr` 或 `drone/push`）——Drone 原生不送 per-pipeline status，符合預期。
- **觸發用 `trigger.event` + `trigger.ref`（git ref glob）** 對齊「PR 任意分支 + push 限 main」：

  | 事件 | ref | 是否 build |
  |------|-----|-----------|
  | push main | `refs/heads/main` | ✅ |
  | PR（任意分支）| `refs/pull/*/head` | ✅ |
  | push develop / feature | `refs/heads/develop` … | ❌ 不 build |

- **`event` 仍保留**（`push` + `pull_request`）以排除 tag / cron / promote。
- **YAML anchor 無法跨 document（`---`）**，故 `trigger` / `install` step / 守衛在各 pipeline **重複撰寫**（無法共用 anchor）。

---

## 核心原則：避免重複觸發（Drone 版）

GitHub Actions 時代的雷是「`push: develop` 與 `pull_request` 重疊 → CI 跑兩次」。Drone 用 **`trigger.ref` 只列 `refs/heads/main` + `refs/pull/*/head`** 從根本避免：

- 中間分支（`develop`、`feature`）**只**由 `refs/pull/*/head`（PR）觸發。
- **不要**把 `refs/heads/develop` 放進 `trigger.ref` —— 否則 push develop + PR 會雙 build 並行競爭 runner。
- `push main` 仍 build，作為 post-merge safety net（force-push / rebase merge / release-please commit 等繞過 PR 的情況）。

> ⚠️ 對應教訓：原 GitHub Actions Issue #82（duplicate runs）。Drone 的 `trigger.ref` 設計即為此而生。

---

## 標準模板 A：Coolify Web App（flat repo — memory-dessert / lawyer / stock）

4 個 pipeline：`lint-typecheck`、`test`、`release-please`、`deploy`。`deploy` 是取代 Coolify auto-deploy 的關鍵（見下方「CD 與避免重複部署」）。

```yaml
---
kind: pipeline
type: docker
name: lint-typecheck
platform: { os: linux, arch: amd64 }
trigger:
  event: [push, pull_request]
  ref: [refs/heads/main, refs/pull/*/head]
steps:
  - name: install
    image: oven/bun:1.3.14
    commands:
      # 守衛：release-please 純版號 commit 不含程式碼變更 → 跳過（見 CD 章節）。
      # ⚠️ 守衛必須在「每個」step 重複：install 用 exit 0（成功）跳過後，Drone 仍會
      #    啟動 depends_on 的後續 step，故各 step 都需自帶守衛才能真正跳過實際工作。
      - |
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "release-please version bump — skip (no app code change)"; exit 0
        fi
      - bun install --frozen-lockfile
    resources: { limits: { cpu: 2000, memory: 3221225472 } }
  - name: lint-typecheck
    image: oven/bun:1.3.14
    depends_on: [install]
    commands:
      - |
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "release-please version bump — skip"; exit 0
        fi
      - bun run lint
      - bun run typecheck
    resources: { limits: { cpu: 2000, memory: 3221225472 } }

---
kind: pipeline
type: docker
name: test
platform: { os: linux, arch: amd64 }
trigger:
  event: [push, pull_request]
  ref: [refs/heads/main, refs/pull/*/head]
steps:
  - name: install
    image: oven/bun:1.3.14
    commands:
      - |
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "release-please version bump — skip"; exit 0
        fi
      - bun install --frozen-lockfile
    resources: { limits: { cpu: 2000, memory: 3221225472 } }
  - name: test
    image: oven/bun:1.3.14
    depends_on: [install]
    commands:
      - |
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "release-please version bump — skip"; exit 0
        fi
      - bun run test
    resources: { limits: { cpu: 2000, memory: 3221225472 } }

---
# release-please：只在 push main 跑（含 release commit 本身）。RELEASE_PLEASE_TOKEN 為 Drone repo-scope secret。
kind: pipeline
type: docker
name: release-please
platform: { os: linux, arch: amd64 }
trigger:
  event: [push]
  ref: [refs/heads/main]
steps:
  - name: release-please
    image: node:20-alpine
    environment:
      RELEASE_PLEASE_TOKEN: { from_secret: RELEASE_PLEASE_TOKEN }
    commands:
      - npx release-please release-pr --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
      - npx release-please github-release --repo-url=https://github.com/jurislm/<REPO> --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --token=$RELEASE_PLEASE_TOKEN
    resources: { limits: { cpu: 2000, memory: 3221225472 } }

---
# deploy：取代 Coolify auto-deploy（auto-deploy 須關閉）。push main 觸發 Coolify deploy API，跳過 release commit。
kind: pipeline
type: docker
name: deploy
platform: { os: linux, arch: amd64 }
clone: { disable: true }   # 只讀 DRONE_COMMIT_MESSAGE env，不需 repo 檔案
trigger:
  event: [push]
  ref: [refs/heads/main]
depends_on: [lint-typecheck, test]   # 兩者綠燈才部署，不部署壞掉的程式碼
steps:
  - name: deploy
    image: curlimages/curl:8.11.0
    environment:
      COOLIFY_DEPLOY_TOKEN: { from_secret: COOLIFY_DEPLOY_TOKEN }
    commands:
      - |
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "release-please version bump — skip deploy (app code unchanged)"; exit 0
        fi
        echo "Triggering Coolify deploy…"
        curl -fsS "https://coolify.jurislm.com/api/v1/deploy?uuid=<APP_UUID>&force=false" \
          -H "Authorization: Bearer $COOLIFY_DEPLOY_TOKEN"
    resources: { limits: { cpu: 1000, memory: 268435456 } }
```

> 取代 `<REPO>` / `<APP_UUID>` 為實際值（App UUID 見該 repo `CLAUDE.md` 的 Coolify 區）。Next.js / 純 Node app 模板相同；Next.js 的 build 在 Coolify 端的 Dockerfile 進行，CI 不需獨立 build job（typecheck 已涵蓋型別）。

---

## 標準模板 B：Monorepo（entire — Turborepo）

> **不是 copy-paste 模板**——以 `entire/.drone.yml` 為準鏡像（其結構因 monorepo 而高度客製）。下列為其實際結構與須注意的差異點（截至撰寫時為 7 個 pipeline）：

- pipeline 按檢查項拆分：`lint-typecheck`、`cli`、`app`、`module`、`package`、`build`、`release`。觸發語意同模板 A（`trigger.event` + `trigger.ref`）。
- **`services:` 只用於「真的會跑 DB query」的 pipeline**（如 `cli` 跑 `db migrate`）：pipeline-level 起 `postgres:16`，step 內 `DATABASE_URL` 指向該 service。其餘 pipeline（如 `package`）只需 placeholder env 滿足 `@<scope>/config` 的 import-time Zod 驗證（如 `ANTHROPIC_API_KEY: sk-ant-placeholder-for-ci`）→ **用 localhost placeholder URL，不需 `services:` 區塊**。
- **`oven/bun` image 無 `psql`** → 只有需要的 pipeline（`cli`）才 `apt-get update -qq && apt-get install -y -qq postgresql-client` + `db migrate`。
- 測試委派 Turborepo：各 pipeline 用不同 filter，如 `bun run turbo run test --filter=entire-cli` / `--filter="@modules/*"` / `--filter=!entire-cli --filter=!entire-ops …`（排除式）。
- **`build` pipeline 直跑 `cd apps/web && bun run build`（非 turbo）**——對齊 GA build job、避免 turbo strict env stripping。
- **`release` pipeline 與模板 A 不同**：用 `bunx`（非 `npx`）、`trigger.branch: [main]`（非 `trigger.ref`）。⚠️ 標準應為兩步——`release-pr`（維護版本 PR）+ `github-release`（從已合併的 release PR cut tag）；只有 `release-pr` 不會自動建立 tag/release，建立 monorepo release pipeline 時兩步都要有。

> Monorepo 多 app 部署較複雜（每個 app 一個 Coolify UUID），deploy-gating 須為每個 app 各設一個 deploy step / pipeline。

---

## 標準模板 C：npm 套件 / MCP server（coolify-mcp / hetzner-mcp / langfuse-mcp / judicial-mcp）

- **CI**（lint / typecheck / test）：Drone `.drone.yml`，同模板 A 的觸發語意。
- **無 `deploy` pipeline**：發布到 **npm**，不部署到 Coolify → **無重複部署問題、不需 deploy-gating**（npm publish 只在 release 時發生一次，本質無「每次 push 都部署」的問題）。
- **release-please + npm publish**：Drone `release` pipeline（模板 A 的 release-please 兩步 + 一個 npm publish step，用 `NPM_TOKEN` secret）。骨架：

```yaml
# release pipeline（push main only）：release-pr → github-release → npm publish
# publish step 僅在「真的有新版被 cut」時才發布；NPM_TOKEN 為 Drone repo-scope secret。
  - name: npm-publish
    image: oven/bun:1.3.14
    depends_on: [release-please]
    environment:
      NPM_TOKEN: { from_secret: NPM_TOKEN }
    commands:
      - |
        # 只在 release commit（github-release 剛 cut）時發布；非 release commit 跳過
        if echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'; then
          echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
          bun install --frozen-lockfile && bun run build && bun publish --access public
        else
          echo "not a release commit — skip npm publish"
        fi
```

> ⚠️ 上為骨架；build 指令與 publish flags 因套件而異，依該套件實際 build/publish 流程調整。

---

## 標準模板 D：Plugin repo（jurislm-tools / jurislm-plugins）

- 純文字 plugin，不需 lint / typecheck / test，只需 JSON 驗證 + release-please。
- **plugin 類型在 GitHub Actions 執行**：JSON / 版本驗證用 `version-check.yml`，release-please 用 `release.yml`。
- `release-please` 用 `release-type: simple` + `extra-files` 同步 `plugin.json` / `marketplace.json` 版本號（見 SKILL.md「Release 設定」）。
- 若選擇用 Drone 跑 JSON 驗證（取代 GHA `version-check.yml`），validate pipeline 範本：

```yaml
---
kind: pipeline
type: docker
name: validate
platform: { os: linux, arch: amd64 }
trigger:
  event: [push, pull_request]
  ref: [refs/heads/main, refs/pull/*/head]
steps:
  - name: validate-json
    image: alpine:3.20
    commands:
      - apk add --no-cache jq
      - jq . .claude-plugin/marketplace.json
      - find plugins -name plugin.json -exec jq . {} \;
# + release-please pipeline（同模板 A，push main only）
```

- **部分 plugin（如 `jurislm-plugins`）有 `sync-plugins.yml`**（GHA）：發版後把 plugin 定義同步到 PostgreSQL DB（dev + prod）。觸發為**手動 `workflow_dispatch`**——因 `GITHUB_TOKEN` 建立的 release 不會自動觸發其他 workflow（GitHub 安全限制）。設定需 DB 連線 secret。

> plugin 類型的 `release.yml` / `version-check.yml` / `sync-plugins.yml` 是其正常的 release / 驗證 / 同步機制，不應移除。

---

## CD 與避免重複部署（Coolify-deployed repo 必讀）

**問題**：Coolify auto-deploy 對**每一個** push 到 main 都部署，包含 release-please 的純版號 commit（`chore(main): release X.Y.Z`）。所以每次發版，**相同應用程式碼會被部署兩次**：feature 合併一次、release PR 合併再一次。

**解法**：把部署觸發從 Coolify webhook 移到 Drone 的 `deploy` pipeline（可讀 `$DRONE_COMMIT_MESSAGE` 判斷），並**關閉 Coolify auto-deploy**。

### 設定步驟

1. **驗證 Coolify deploy API**（先確認 endpoint + token 可觸發，避免關 auto-deploy 後接線錯誤導致 prod 靜默停止部署）：
   ```bash
   curl -fsS "https://coolify.jurislm.com/api/v1/deploy?uuid=<APP_UUID>&force=false" \
     -H "Authorization: Bearer $COOLIFY_ACCESS_TOKEN"   # 回 HTTP 200 + deployment_uuid 即可用
   ```
2. **加 Drone repo-scope secret `COOLIFY_DEPLOY_TOKEN`**（Drone Web UI Settings → Secrets，或 Drone API；設 `pull_request: false` 不暴露給 PR build）。
3. **`.drone.yml` 加 `deploy` pipeline**（模板 A）+ 在 `lint-typecheck` / `test` 各步加同樣守衛。
4. **驗證 Drone → Coolify 接線可用**（保留 auto-deploy 當安全網，合併一次觀察 Drone deploy pipeline 成功觸發 Coolify）。
5. **確認 OK 後關閉 Coolify auto-deploy**（`is_auto_deploy_enabled = false`）。⚠️ Coolify GET application API **不回傳**此欄位，無法讀取驗證 → 用「合併後是否只有一次部署」行為驗證。

### 守衛邏輯（為何這樣寫）

```sh
echo "$DRONE_COMMIT_MESSAGE" | head -1 | grep -qE '^chore(\(.+\))?: release [0-9]'
```

- **`head -1`**：`DRONE_COMMIT_MESSAGE` 含 subject + body；`grep` 的 `^` 會匹配**任一行** → 只取 subject，避免 squash body 某行誤匹配而誤跳過部署。
- **`release [0-9]`**：要求版號數字，排除 `chore: release notes …` 之類人為 commit 誤判。
- squash 合併 release PR 後 subject 為 `chore(main): release 1.2.0 (#NN)` → 命中 → 跳過；feature / fix / 一般 chore → 不命中 → 部署。

### 結果

| 動作 | 部署次數 |
|------|---------|
| feature PR 合併進 main | **1 次**（Drone deploy pipeline）|
| release PR 合併進 main | **0 次**（守衛跳過，僅 release-please 建 tag）|

⚠️ 若 `lint-typecheck` / `test` 在 main 失敗 → `depends_on` 使 deploy 被跳過、prod 維持上次成功部署（正確行為）；修好重推或在 Coolify UI 手動部署。

---

## Drone Secrets（repo-scope）

| Secret | 用途 | 設定 |
|--------|------|------|
| `RELEASE_PLEASE_TOKEN` | release-please 寫 GitHub release PR / tag | **classic PAT** scopes `repo` + `workflow`（fine-grained PAT 為 per-endpoint 權限模型，不同），90 天到期須輪替 |
| `COOLIFY_DEPLOY_TOKEN` | `deploy` pipeline 觸發 Coolify deploy API | `pull_request: false`（不暴露給 PR build）|
| `NPM_TOKEN` | npm 套件 repo 的 publish step | 僅 npm 套件 repo 需要 |

> Drone secret 加法（API）：`POST $DRONE_SERVER/api/repos/<owner>/<repo>/secrets`，body `{name, data, pull_request:false}`，header `Authorization: Bearer $DRONE_TOKEN`。

---

## 部署收尾：release PR + webhook 驗證（必讀踩坑）

合併 feature PR 進 main 後：

1. Drone build 觸發 → deploy pipeline 部署一次 + release-please **自動開 `chore(main): release X.Y.Z` PR**。
2. **這個 release PR 也要合併**，否則版本與 tag 永遠不會 cut。
3. 合併 release PR → release commit → **deploy 被守衛跳過**（不重複部署）、release-please `github-release` 建 tag + release。

⚠️ **合併任何 PR 進 main 後，必須確認 CI 真的被觸發**（不可假設）：GitHub 偶爾漏發 `push` webhook（2026-06-01 踩坑：memory-dessert #31 release PR 合併後 GitHub 只發 `pull_request`、沒發 `push` → Drone 沒 build → `github-release` 沒跑 → `v1.2.0` 卡住沒 cut）。

驗證：
```bash
# 該次 push 是否送達 Drone（看 deliveries 是否有對應時間的 push 事件）
gh api repos/jurislm/<repo>/hooks/<hook_id>/deliveries --jq '.[] | "\(.delivered_at) \(.event) \(.status_code)"' | head
# Drone builds 是否有對應 commit 的 push build
curl -fsS "$DRONE_SERVER/api/repos/jurislm/<repo>/builds?per_page=5" -H "Authorization: Bearer $DRONE_TOKEN" \
  | jq -r '.[] | "#\(.number) \(.after[0:7]) \(.event) \(.status)"'
```

漏發補救（冪等，安全）：
```bash
# 手動補 cut release（透過 API 偵測已合併的 release PR，不依賴本地 checkout）
npx --yes release-please github-release --repo-url=https://github.com/jurislm/<repo> \
  --config-file=release-please-config.json --manifest-file=.release-please-manifest.json \
  --token=$JURISLM_DRONE_RELEASE_PLEASE_TOKEN
```

> `drone build restart <最近的 push build>` 可補觸發 build；但 `drone build create` 為 `custom` event、不匹配 `event: push` trigger，故無效。

---

## Audit 既存 Repo

```bash
# 逐 repo 解碼 .drone.yml 看 pipeline 與 trigger（已過濾 archived repo）
for repo in $(gh repo list jurislm --limit 50 \
    --json name,isArchived -q '.[] | select(.isArchived == false) | .name'); do
  echo "=== $repo ==="
  gh api "repos/jurislm/$repo/contents/.drone.yml" --jq '.content' 2>/dev/null \
    | tr -d '\n' | base64 -d 2>/dev/null | grep -E '^name:|^  ref:|refs/heads' | head -15 \
    || echo "(no .drone.yml)"
done
```

單一平台檢查：每個 repo 的 CI / release 只應有其類型對應的一套機制（見開頭表格）。若同時存在 Drone `.drone.yml` 與功能重疊的舊 GHA `ci.yml` / `release.yml`，移除其一避免雙跑。注意 plugin 類型的 `release.yml` / `version-check.yml` 是其正常機制不要誤刪。Code Review 的 `claude-code-review.yml` / `claude.yml`（及 Drone `claude-review` pipeline）**已從標準移除（2026-06-02）**，audit 既有 repo 時應一併清除。

---

## 規範回填協議（持續學習迴路）

當任一 repo 的 `.drone.yml` 或部署流程發現新陷阱：

1. 在來源 repo 修復（PR 含 root cause 分析）。
2. **同步**回填到此模板（`references/ci-workflow-templates.md`）+ SKILL.md 相關章節。
3. 在 `jurislm-tools` 開 issue 追蹤其他 repo 是否需同步。

**禁止**：只修單一 repo 不回填模板 → 下一個 repo 仍會踩同個雷。

---

## 參考

- 來源 repo：`jurislm/memory-dessert`（`.drone.yml` — flat Coolify web app 含 deploy-gating 的正規範例）、`jurislm/entire`（monorepo 變體）。
- 自架 Drone 基礎設施：`entire/infra/ci-jurislm/`（docker-compose: drone-server + drone-runner-docker + drone-backup）。
- 歷史教訓：GitHub Actions 時代的 duplicate-runs Issue #82（Drone `trigger.ref` 已從設計上避免）。
