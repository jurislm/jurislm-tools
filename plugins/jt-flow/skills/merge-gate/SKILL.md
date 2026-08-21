---
name: merge-gate
description: >
  由 `engineering-delivery` 調用：判定這個 PR 可不可以合併。gate 清單以目標 repo 的
  CLAUDE.md 為準，未宣告時採本 Skill 的預設值。
---

## 回答的問題

這個 PR 可不可以合併？

## 副作用

無。本 Skill 只做判定；合併動作由 `engineering-delivery` 執行。

## gate 清單

**以目標 repo 的 `CLAUDE.md` 為準**——它若寫了 PR review 與 merge 契約（例如額外的
Copilot gate），那份為準。它沒寫時，本 Skill 的預設值是：

- `mergeable` 為 `MERGEABLE`。`UNKNOWN` 表示 GitHub 尚在背景計算，push 後很常見，
  **不是失敗**：依 `using-jt-workflow` 紀律 2 的來源優先序重查，預設**上限 3 次**；
  逾上限仍為 `UNKNOWN` → `halted/access_config`，`recoverableByCode: false`，
  `needed` 寫明「GitHub 未能算出 mergeable 狀態」。
- `mergeStateStatus` 為 `CLEAN` **或** `UNSTABLE`，不可為 `BLOCKED`／`DIRTY`／`BEHIND`。

  ⚠️ 別要求一定是 `CLEAN`——`UNSTABLE` 的定義就是「只有非必要的 check 沒過」，外部
  審查額度耗盡留下的正是這種；要求 `CLEAN` 會跟「額度耗盡不擋合併」互相矛盾，永遠
  過不了。`BLOCKED` 才是「required check 失敗或缺席」。用這兩個值判斷，不必去讀
  branch protection API——它對沒有 admin 權限的人回 403。
- 所有 review thread 已 resolve，外部 reviewer 沒有未處理的 finding。
- `external-review-gate` 已回 `ok` 或 `not_applicable`。

## 出口

`halted` 時必須附 `recoverableByCode`：

| 情況 | 終態 |
|---|---|
| 全部成立 | `ok`，`payload` 附 `mergeable`、`mergeStateStatus` |
| `BLOCKED`／`DIRTY`／`BEHIND`，或有未處理 finding | `halted`，`recoverableByCode: true` |
| `UNKNOWN` 逾重查上限 | `halted/access_config`，`recoverableByCode: false` |
| Release Please 版號 PR | `not_applicable` |

## Release Please 版號 PR

標題形如 `chore(<defaultBranch>): release X.Y.Z` 的 PR **不由本流程合併**。它應由目標
repo 自己 source-controlled 的 validator 處理；人工合併等於跳過那整套檢查。本 Skill
對它只回 `not_applicable`，由 coordinator 監看其終態後回報。目標 repo 沒有這種
validator 時同樣不自行合併：回報現況，交由使用者決定。這類 PR 不對應 Linear issue，
略過 identifier 與 readback 的要求。
