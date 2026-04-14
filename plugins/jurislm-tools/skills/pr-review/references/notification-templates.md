# PR Review 通知模板

## CI 等待超時

### 情境 A：CI 已觸發但長時間未完成

> Monitor 啟動時 checks 存在，但超過 `MAX_WAIT_MINUTES` 仍 in_progress。

```
⚠️ PR #<PR> 的 CI 已持續超過 <MAX_WAIT_MINUTES> 分鐘未完成，可能為 Runner 故障或 workflow 超時，已停止等待。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions Runner 是否正常運行
- CI workflow 是否有超時或設定問題
- 若 CI 確實需要更長時間，可用 timeout 參數調高等待上限後重新觸發

確認後請手動重跑 CI 或調整後重新觸發。
```

### 情境 B：push 後 CI 未觸發

> 步驟一 `gh pr checks` 確認有 check 項目（`CI_RAN = true`），但 Monitor 啟動後 **90 秒**內未收到任何輸出。

```
⚠️ PR #<PR> 在 push 後，CI 長時間未重新觸發，可能為 workflow trigger 設定問題。

請 @<PR_AUTHOR> 手動檢查：
- GitHub Actions trigger 設定是否正確（on.push, on.pull_request）
- 是否有 branch filter 導致 workflow 未觸發

確認後請手動重跑 CI 或調整 trigger 設定後重新推送。
```

---

## 超過輪次停止

```
⚠️ PR #<PR> 已達最大修正輪次（<MAX_ROUNDS> 輪）仍未獲得核准，已停止自動處理。

請 @<PR_AUTHOR> 手動檢查以下項目：
- Bot feedback 是否仍有 needs changes（是否有需要人工判斷的建議）
- CI 是否持續失敗（原因為何）
- 是否涉及設計決策需要人工介入

確認後請手動合併或調整後重新觸發。
```
