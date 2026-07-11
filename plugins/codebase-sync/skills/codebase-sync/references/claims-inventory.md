# Claims Inventory — 宣稱分類 → 權威來源對照表

`codebase-sync` 的核心方法論：把 README.md / CLAUDE.md 的內容當成一組**可被證偽的宣稱（claims）**，不是「掃目錄看有沒有」，而是把每條可驗證宣稱抽出來，各自綁定該讀哪個權威來源去對照。

依下表分類逐條核對。每一類都要問：「文件這樣寫，我該去讀哪個檔案 / 跑哪個指令才能確認它還成立？」

| 宣稱類型 | 文件裡長怎樣（範例句型） | 權威來源（實際要 Read / grep 的指令） |
|---|---|---|
| CLI 指令 | 「執行 `sync judicial --category` 可以…」 | `grep -rE '\.command\(|addCommand\(' <cli 進入點>`，逐條比對文件寫的指令是否真的有註冊 |
| 流程/自動化 | 「pre-commit 會跑 lint + typecheck + test」 | `Read .husky/pre-commit`、CI yaml（如 `.github/workflows/*.yml` 或 `.drone.yml`）、`Dockerfile`，逐句對照文件描述的步驟 |
| 模組/目錄狀態 | 「X 模組已刪除」「Y 是 stub」「Z 已重建」「W 未啟用」 | `git ls-files modules/X`（確認是否還有檔案）+ `Read` 該目錄的進入檔，判定內容是否符合文件說的狀態 |
| 架構/資料流 | 「向量資料存在 pgvector」「訊息透過 X service 轉發」 | grep 相關 service 名稱 / feature flag + `Read` migration 檔 + `Read openspec/changes/` 底下相關 proposal |
| 結構計數 | 「目前有 24 個 modules / 16 個 packages」 | `git ls-files '*/package.json'`，過濾掉空殼目錄（沒有實際程式碼的 package.json）後數量比對，不要用 `find` 數目錄（會把空目錄也算進去） |
| scripts / env / 版本 | `bun run build`、`DATABASE_URL`、版本號 `5.x` | 沿用 `SKILL.md` Step 0 既有的 script/env 差異比對邏輯；版本號只報告現況，不做修改 |

## 使用方式

1. 在 `SKILL.md` Step 1.5，逐句讀 README.md / CLAUDE.md，把每個符合上表任一類的句子記錄下來，標註「屬於哪一類」與「要跑什麼取證指令」。
2. 把這份清單餵進 Step 2 Audit Report 的 Section 5 表格——每條宣稱一列，實際執行對應的取證指令，填入輸出，標記一致與否。
3. 若文件完全沒有可歸類的宣稱句（極少見，通常代表文件過度精簡），Section 5 要說明「無可驗證宣稱」的原因，而不是留空。

## 常見誤判

- **只看關鍵字比對就結案**：例如文件說「已移除 X 指令」，只 grep 檔名還在就回報「OK 沒問題」——檔案還在不代表指令還在，必須看該檔案裡的指令註冊碼。
- **狀態性描述當存在性檢查做**：見 `SKILL.md` 常見錯誤表——目錄存在 ≠ 宣稱成立。
- **只驗證「文件有寫的」，沒驗證「文件沒寫但代碼有的」**：Section 4（文件未記載的新增功能/目錄）要單獨處理，不算在 Claims Inventory 裡。
