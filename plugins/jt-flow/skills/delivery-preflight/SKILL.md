---
name: delivery-preflight
description: >
  由 `engineering-delivery` 調用：單次查證本次交付的環境前提（版本控制、GitHub
  託管、remote 解析、案件管理管道），回傳 internal result。
---

## 回答的問題

這次交付的環境前提齊了嗎？

## 副作用

無。本 Skill 只做唯讀查證。

## 查證規則

**單次查證，不重試。**每一項都在同一次執行內查完，再一起回傳結果。

| 前提 | 不成立時 |
|---|---|
| 版本控制可執行，且當前目錄是其工作樹 | `halted / access_config` |
| repo 使用 git（而非其他 VCS） | `not_applicable` |
| 目標 repo 託管於 GitHub | `not_applicable` |
| 可用的 GitHub 事實來源至少一種（例如 `gh`、GitHub MCP、整合功能） | `halted / access_config` |
| remote 解析唯一，且 fetch／push 目標一致 | `halted / ambiguity` |
| 案件管理讀取管道可用 | 不停下：向使用者索取 issue 內容後回 `ok`，並記入 `notes`（案件記錄仍需寫回，寫入失敗時另依 `references/case-record.md` 的失敗規則處理） |

**版本控制是前提，不是工具選項**：不可用時停下，不尋找替代品。取得 GitHub 事實的
管道則是可替換工具，換一個能取得同一事實的即可。

**外部審查管道不在此查證**——那由 `external-review-gate` 在需要時查，提早查會讓還沒
寫任何程式碼的案件就被擋下。

## 回傳

`ok` 時的 `payload`：

| 欄位 | 說明 |
|---|---|
| `remote` | 實際的 remote 名稱，不假設叫 `origin` |
| `ownerRepo` | `<owner>/<repo>` |
| `defaultBranch` | 預設分支名，不假設叫 `main` |

`halted` 時附 `blocked`（`kind`／`what`／`needed`）與 `recoverableByCode: false`。
