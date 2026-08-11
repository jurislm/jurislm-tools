## ADDED Requirements

> 新增需求

### Requirement: repo-standards 發布指引避免不可發布的版本升級

`repo-standards` 必須為使用 Release Please 且設定 `release-type: simple` 的 plugin 儲存庫，提供並說明 Drone `release-pr` 發布資格閘門。閘門必須在無條件執行的 `github-release` 之後、`release-pr` 之前執行；讀取已發布的 manifest 版本與 Drone 儲存庫／分支 metadata；透過 GitHub 比較該發布 tag 與 target branch；只有完整的未發布範圍含有有效的 `feat` 或 `fix` subject 時，才可呼叫 Release Please。範本必須將只有 `docs`、只有 `chore` 或空範圍視為成功跳過；當範圍、metadata、token 或提交 subject 無法驗證時，必須失敗而不是建立 release PR。範本不得記錄發布憑證，也不得指示維護者手動修改由 Release Please 管理的版本。

#### Scenario: plugin 儲存庫採用發布範本並進行文件維護

- **當** 採用此範本的 plugin 儲存庫，在已發布 manifest tag 之後只合併有效的 `docs` 與 `chore` 提交時
- **那麼** 其 `release-pr` 階段會完成而不呼叫 Release Please
- **並且** 其 plugin 與 marketplace 版本檔案維持不變

#### Scenario: plugin 儲存庫採用發布範本並有可發布變更

- **當** 採用此範本的 plugin 儲存庫，其完整未發布範圍含有有效的 `feat` 或 `fix` subject 時
- **那麼** 其 `release-pr` 階段會在 `github-release` 之後呼叫 Release Please
- **並且** 產生的 release PR 會使用該儲存庫設定的 manifest 與 extra-file 版本更新

#### Scenario: 範本無法建立安全的發布範圍

- **當** 範本無法驗證 Compare request、定位 manifest 版本、解析儲存庫 metadata，或驗證每個提交 subject 時
- **那麼** `release-pr` 階段會在任何版本升級命令前失敗
- **並且** 失敗訊息不會包含 token 值
