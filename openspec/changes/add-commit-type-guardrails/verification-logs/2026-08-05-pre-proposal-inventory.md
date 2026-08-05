# 2026-08-05 提案前環境盤點

目標 repository：`jurislm/jurislm-tools`（remote `origin`，fetch/push URL 一致，viewerPermission=ADMIN）
關聯 issue：#181

所有斷言均由當日實際指令輸出取證，非記憶或推測。

## 1. 觸發事件（根因鏈，逐項查證）

release 1.33.2 的 CHANGELOG 與 GitHub Release notes 記為「🎨 Styles — 統一 model: sonnet
前端 metadata 不加引號」，實際內容是 jt-flow 兩個 Skill 新增 72 行行為規則。

| 環節 | 實查結果 | 指令 |
| --- | --- | --- |
| PR 合併前 commit 數 | 2 顆：`feat(jt-flow): 阻塞時走封閉迴圈…` + `style(jt-flow): 統一 model: sonnet…` | `gh api repos/jurislm/jurislm-tools/pulls/179/commits` |
| PR 標題 | `feat(jt-flow): 阻塞時走封閉迴圈，不停在問題回報`（**本身正確**） | `gh pr view 179 --json title` |
| 落在 main 的 squash commit | `25e6bc2` subject 為 `style(jt-flow): …` | `git log origin/main -3` |
| repo squash 標題設定 | `squash_merge_commit_title=COMMIT_OR_PR_TITLE`（多顆 commit → 用 PR 標題） | `gh api repos/jurislm/jurislm-tools` |

結論：GitHub 預設行為本應採用正確的 PR 標題，是合併時主動傳入 `--subject` 覆寫所致，
**非預設抓錯**。此結論推翻了初次診斷（初次未查證即斷言「預設抓了最後一顆 commit」）。

## 2. 成文規範與工具設定不一致

| 來源 | 允許的 commit type | 取證 |
| --- | --- | --- |
| `CLAUDE.md` L86-90 | `feat` / `fix` / `docs` / `chore`（4 種） | `git show origin/main:CLAUDE.md` |
| `release-please-config.json` `changelog-sections` | `feat` / `fix` / `perf` / `docs` / `refactor` / `style` / `test` / `chore`（8 種） | `git show origin/main:release-please-config.json` |

工具設定比成文規範寬鬆一倍，規範外的 `style:` 因此被照單全收並產生誤導性段落。

Conventional Commits v1.0.0-beta.4 規範（2026-08-05 由 conventionalcommits.org 取得原文）：
第 2 條「新功能 **MUST** 使用 `feat`」；第 10 條允許 `feat`/`fix` 以外的自訂 type，故
CLAUDE.md 收斂為 4 種**合法**；FAQ 明文「基於 squash 的工作流程，maintainer 可在合併時
清理 commit message」，故合併當下決定標題是規範預期做法。

## 3. main 上實際 commit type 分布（近 200 顆）

`feat` 48 / `chore` 41 / `fix` 38 / `docs` 23（規範內，共 150）；
`ci` 3 / `refactor` 2 / `style` 1（規範外，共 6）。

`style` 那顆即本次事件。`ci` 與 `refactor` 屬歷史既有用法，本提案需明確決定是否納入允許清單。

## 4. CI/CD 現況

`.drone.yml` 兩條 pipeline：

- `validate`：trigger `push` + `pull_request`，ref `refs/heads/main` + `refs/pull/*/head`；
  steps 僅 `npm ci` + `npm run validate`
- `release`：trigger `push` main；release-please `github-release` + `release-pr`

`npm run validate` = `test` + `check:plugins` + `check:versions` + `lint:md`
（`package.json` scripts 實查）。**無任何一項檢查 commit 或 PR 標題**。

Drone server image：`drone/drone:2`（來源 `entire` repo `infra/ci-jurislm/docker-compose.yml`）。

### 4.1 `DRONE_PULL_REQUEST_TITLE` 可用性——已實證，非推定

初稿曾把此變數列為「跑了才知道」的未實證項。已於提案階段完成驗證，兩段證據構成完整鏈：

**(a) 本實例的 server 端確實存有 PR 標題**——查 PR #179 對應的 build 21：

```
curl -s -H "Authorization: Bearer $DRONE_TOKEN" \
  "$DRONE_SERVER/api/repos/jurislm/jurislm-tools/builds/21"
```

```
event = 'pull_request'
title = 'feat(jt-flow): 阻塞時走封閉迴圈，不停在問題回報'
ref   = 'refs/pull/179/head'
```

⚠️ 該 API 回應含未跳脫控制字元的 commit message，`jq` 會拋
`Invalid string: control characters`；須用 `python3 -c "json.loads(s, strict=False)"` 解析。

**(b) runner 確實把它注入環境變數**——`drone/runner-go` `environ/environ.go` L186-189：

```go
if build.Event == drone.EventPullRequest {
    env["DRONE_PULL_REQUEST"] = re.FindString(build.Ref)
    env["DRONE_PULL_REQUEST_TITLE"] = build.Title
}
```

推論結果（非猜測）：

- 兩個變數**同時**只在 `event == pull_request` 時注入，故 `DRONE_PULL_REQUEST` 是否為空
  即可可靠判別是否為 PR build。
- `DRONE_PULL_REQUEST_TITLE` 的值就是 build 物件的 `title`，已證實為 PR 標題原文。
- push build 不會有這兩個變數，檢查器據此 skip 屬預期路徑，非異常。

## 5. Branch protection 現況與 required status check 可行性

```
gh api repos/jurislm/jurislm-tools/branches/main/protection  → 404 Branch not protected
gh api repos/jurislm/jurislm-tools/rulesets                  → []
```

`main` **沒有任何 branch protection，也沒有 ruleset**。因此若只新增 CI 檢查，
結果僅是「不合規時紅燈可見」，**無法阻止合併**。

### 5.1 ⚠️ 一次錯誤引用的更正

初稿曾主張「加 required status check 會與 release-please 的 release PR 打架」，
並引用 archive change `2026-07-27-fix-release-pr-unstable-gate` 為據。
**該 archive change 不存在**——`openspec/changes/archive/` 實際只有 8 個目錄，
`grep -rli unstable openspec/` 僅命中本次自撰文件。誤判來源是 worktree 分支名
`codex/fix-release-pr-unstable-gate`，被當成已歸檔提案。

真實來源是 issue #142（CLOSED）與 PR #143，其原文為：

> Release PR #139 在 `mergeable=true`、CodeRabbit success、無未解 review thread
> 且 **main 無 branch protection** 時，仍回傳 `mergeStateStatus=UNSTABLE`，
> 被 jt-flow 的 `CLEAN` gate 卡住。

即 UNSTABLE **發生於沒有 branch protection 的情況**，與 required status check 無關；
修法也只是調整 jt-flow 的 gate 判斷，未觸及 repository 設定。原主張沒有證據支持，
已撤回。

### 5.2 required status check 的實測可行性

| 項目 | 實查值 | 指令 |
| --- | --- | --- |
| PR 上的 check context | `continuous-integration/drone/pr` | `gh pr checks 179` |
| push main 上的 check context | `continuous-integration/drone/push` | `gh api repos/.../commits/main/status` |
| release PR (#180) 的 drone/pr 結果 | **pass** | `gh pr checks 180` |
| CodeRabbit check | `CodeRabbit`（#179 顯示 auto review 已停用而 skip） | `gh pr checks 179` |

release PR 同樣會產生並通過 `continuous-integration/drone/pr`，故將該 context 設為
required 不會卡住發版流程。CodeRabbit 為外部服務且有限流風險，**不納入** required
contexts。

## 6. 既有測試與可沿用資產

`scripts/` 現有：`validate-drone-config.mjs`、`validate-drone-yml.sh`、
`drone-ci-policy.test.mjs`、`validate-plugin-repository.mjs`（+ 對應 test）、
`check-version-sync.mjs`、三個 jt-flow policy test。

`npm test` = `node --test scripts/*.test.mjs`。新增檢查器應沿用同一模式
（`scripts/<name>.mjs` + `scripts/<name>.test.mjs`），不引入新測試框架。

## 7. 並行提案與 archive

active changes：`convert-jt-flow-commands-to-skills`、`rename-jt-flow-single-skill`
——兩者皆為 jt-flow Skill 改名／型態轉換，與 commit type 護欄範圍**明確不符**，不沿用。

archive 中無 commit type／CHANGELOG 正確性的前作
（grep `commit type|conventional commit|changelog|squash` 僅命中三份 verification-log 的
附帶提及，非專門提案）。

既有 issue 搜尋（`commit`/`changelog`/`release-please`/`conventional`/`squash`/`PR title`）
無範圍相符者；#142 為 release PR 的 UNSTABLE 狀態，屬不同問題。

## 8. 既有 feedback

memory `feedback_commit_discipline` 已記載 squash 標題是 release-please 唯一輸入、
`chore:` 導致完全不發版的踩坑；本次事件（規範外 type 導致「發了版但級別與描述都錯」）
已於 2026-08-05 併入同一檔案。

## 9. openspec capability 對應

`openspec/specs/` 現有 15 個 capability，其中 `ci-platform` 為本提案 delta spec 的歸屬。
