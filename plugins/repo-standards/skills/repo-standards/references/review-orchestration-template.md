# PR review and merge contract

將本段寫入目標 repo 的 `CLAUDE.md`，並以該 repo 的 required checks、部署與 release
流程取代方括號內容。目標 repo 的 `CLAUDE.md` 是唯一操作契約。

## PR review

建立 PR 後，先 invoke `superpowers:requesting-code-review`。任何 finding 都以
`superpowers:receiving-code-review` 逐項核實：採納者修正並驗證；不採納者在原 review
thread 留下具體理由；完成後 resolve 每一個 review thread。修正後的 HEAD 由本地驗證、
CI 與 mergeability 覆核，不重啟外部 review。

使用 `jt-flow-one` 時，本地 review 由該 Skill invoke
`superpowers:requesting-code-review` 擁有；外部 review 交給 `coderabbit:code-review`
skill，不另起第二套審查機制。

CodeRabbit 的 `.coderabbit.yaml` 必須設定 `reviews.auto_review.enabled: false`。首次人工
request App 前，揭露 GitHub App 會依其安裝權限讀取 repo 與 PR 內容，CLI 可能使用
review guidelines、learnings 與 history；在該次交付的追蹤紀錄（Linear issue 留言，或
該 repo 選用的追蹤容器）記錄使用者明確 consent。
每個 PR 只 request App 一次。App 產出有效 review 後不執行 CLI；只有 App 進入終態且
未產出有效 review 時，CLI 才可執行一次 fallback。

Copilot 每個 PR 只有一次 review budget，並使用 repo 專屬
`.github/copilot-instructions.md`。Codex 是被動審查：不主動 request 或等待；平台自動
貼出的 finding 仍逐項核實。不要設定自動 Claude PR review pipeline。

## Merge gates

合併前必須同時滿足：[repo-required checks] 全綠、最新 HEAD 的
`mergeable=MERGEABLE` 與 `mergeStateStatus=CLEAN`、所有 review thread 已 resolve、
Copilot 與 CodeRabbit 沒有未處理 finding。CodeRabbit 的 App 與 CLI 都不可用時，才可
記錄原因後略過該 gate；Copilot 只有確認為 quota exhausted（非權限或設定錯誤）時才可
略過。合併後依 repo 的 release／deploy 契約監看其終態。
