## MODIFIED Requirements

> 修改需求

### Requirement: Drone owns Release Please

> 中文說明：Drone 負責 Release Please。

儲存庫必須只在 push 到 `main` 時，於名為 `release` 的 Drone pipeline 中執行 Release Please。該 pipeline 必須使用儲存庫的 config 與 manifest、明確指定 `main` 為 target，並透過 Drone secret indirection 提供儲存庫範圍的 secret。它必須先執行 `github-release`，再評估 `release-pr`。`release-pr` 步驟必須透過已驗證身分的 GitHub Compare API，比較 manifest 的已發布版本 tag 與目前的 `main` 分支；只有完整比較結果含有至少一個有效的 `feat` 或 `fix` subject 時，才可呼叫 Release Please。沒有提交，或只含有效 `docs`／`chore` subject 的比較結果，必須成功完成該步驟，但不得建立或更新 release PR。缺少 metadata、token 或 manifest 版本、Compare API 失敗、分頁結果不完整、回應格式錯誤，或 subject 無效時，`release-pr` 步驟必須失敗，且不得呼叫 Release Please。

#### Scenario: release PR 已合併

- **當** release pipeline 處理因此產生的 `main` push 時
- **那麼** `github-release` 會在 release-pr 資格檢查前建立尚未建立的 GitHub tag 與 release
- **並且** 已發布的 manifest 版本會使後續 Compare 範圍變空，除非之後又有新的可發布提交

#### Scenario: 存在尚未發布的文件與維護提交

- **當** 從已發布版本 tag 到 `main` 的完整 Compare 範圍含有一個以上的 `docs` 或 `chore` subject，且沒有 `feat` 或 `fix` subject 時
- **那麼** `release-pr` 步驟會成功結束而不呼叫 Release Please
- **並且** 不會有 release PR 更新 manifest 或 plugin 版本

#### Scenario: 存在尚未發布的 feat 或 fix 提交

- **當** 從已發布版本 tag 到 `main` 的完整 Compare 範圍含有有效的 `feat` 或 `fix` subject 時
- **那麼** `release-pr` 步驟會在 `github-release` 之後呼叫 Release Please
- **並且** Release Please 會使用儲存庫 config 與 manifest 建立或更新待處理的 release PR

#### Scenario: 無法取得權威發布範圍

- **當** 資格檢查無法讀取所有 Compare page，或無法驗證必要的發布 metadata 或提交 subject 時
- **那麼** `release-pr` 步驟會在呼叫 Release Please 前失敗
- **並且** pipeline 輸出會指出無法取得的判定輸入，但不得暴露 release token

#### Scenario: Pull request 程式碼不可信

- **當** Drone 評估 pull request 時
- **那麼** 不會執行任何 release 步驟
- **並且** validation pipeline 不會取得 release token
