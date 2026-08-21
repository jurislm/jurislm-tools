---
name: acceptance-readback
description: >
  由 `engineering-delivery` 調用：監看部署或合併後 CI 到終態，取得驗收證據，並在
  失敗時判定根因是否可由改碼解除。
---

## 回答的問題

怎麼確認真的上線或通過了？證據怎麼算數？

## 副作用

可能觸發重新部署。需要人工核准時回 `halted/authorization`，不自行執行。

## 驗收對象

| 目標 repo | 驗收對象 |
|---|---|
| 有部署管道 | 監看部署到終態，確認 health check 通過（含 commit 比對） |
| 沒有部署管道（library、外掛市集、文件 repo） | 合併後預設分支的 CI 終態，且該 CI run 的 head SHA **必須等於本次的合併 commit** |

沒有部署管道時不要去找一個不存在的部署來監看。

⚠️ **只看「預設分支的 CI 是綠的」不算驗收。**重查期間預設分支可能已經有別人的新 commit，
那次綠燈證明的是別人的改動。比對 head SHA 與本次合併 commit，並把該 ref 寫進
`evidence[]`——沒有 ref 的證據等於沒有證據。

## 失敗時的分工

先用 `superpowers:systematic-debugging` 判定**根因類別**，再據以回傳，一律附
`recoverableByCode`：

| 根因 | 終態 | `recoverableByCode` |
|---|---|---|
| 程式碼缺陷 | `halted` | `true` |
| 需人工核准 | `halted/authorization` | `false` |
| 回退目標不明或涉 migration | `halted/risk` | `false` |

coordinator 依這個布林值決定是否回 N4，**不讀 `blocked.what` 的文字**。

## 回退前的三項確認

1. 要退回的 commit 明確可辨識——上一個 health check 通過的 tag 或 sha，不憑印象猜。
2. 本次改動是否含 migration——含的話單純退 app 層可能造成 schema 不相容，要另行評估。
3. 是否需要人工核准。

三者有一不明 → `halted/risk`。都確認過才走該 repo 部署平台的手動重新部署。

## 宣稱通過之前

用 `superpowers:verification-before-completion` 跑實際請求、截圖或 log 佐證，看到實際
輸出才回 `ok`，`payload` 附 `evidence[]`。

⚠️ **證據進 `evidence[]` 之前先遮罩。**實際請求與 log 會夾帶 credential、token、cookie
與 shell 環境值，而 `evidence[]` 會被寫進 Linear 留言——那是一個比 repo 更多人看得到的
地方。遮罩後才寫入；無法確認某段輸出是否含密鑰時，記 ref 與摘要，不貼原文。
