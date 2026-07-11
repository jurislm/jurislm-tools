# Regression Examples — Claims-Driven 驗證該挖多深

以下 3 個案例皆實際發生於 `jurislm/entire`，是舊版「存在性掃描」設計會漏掉、但 claims-driven 逐條取證能抓到的真實漂移。每個案例照「文件宣稱 → 天真掃描結果 → claims-driven 驗證步驟 → 正確結論」的順序寫，作為「這才叫深度」的參考範例。

## 案例 1：CLI 指令移除

**文件宣稱**：README 教使用者執行 `sync judicial --category <type>` 來同步司法資料。

**天真存在性掃描的結果（會漏掉）**：`find . -name "sync.ts"` 或 `grep -r "sync.ts" .` 會找到 CLI 進入點檔案 `sync.ts` 仍然存在 → 誤判為「OK，指令還在」。

**Claims-driven 驗證步驟**：
```bash
grep -rE '\.command\(|addCommand\(' <cli 進入點目錄>
```
讀取輸出，逐條比對 `judicial` 相關的 subcommand 是否真的還有 `--category` 這個選項被註冊。

**正確結論**：`sync.ts` 檔案雖然還在，但 `--category` 這個 subcommand 已經從指令註冊碼移除，改成用 `job trigger`、`embed judicial`、`chunk judicial` 這幾個獨立指令取代。README 若不更新，使用者照著做會得到「unknown option」錯誤。

---

## 案例 2：流程步驟變更

**文件宣稱**：README / CLAUDE.md 寫「pre-commit 會跑 lint + typecheck + test」。

**天真存在性掃描的結果（會漏掉）**：`test -f .husky/pre-commit && echo OK` 只確認檔案存在，不會讀內容 → 誤判為「OK，pre-commit 設定沒問題」。

**Claims-driven 驗證步驟**：
```bash
cat .husky/pre-commit
```
（用 Read 工具讀取，逐句核對每個實際執行的指令。）

**正確結論**：實際 `.husky/pre-commit` 執行的是 lint-staged + `turbo lint` + `turbo typecheck` + `openspec validate`，**沒有跑 test**。文件寫「跑 test」是錯的，會誤導開發者以為 pre-commit 會擋掉測試失敗的 commit。

---

## 案例 3：模組狀態矛盾

**文件宣稱**：CLAUDE.md 寫「`notifications` 模組已刪除」。

**天真存在性掃描的結果（會漏掉）**：`ls modules/notifications 2>/dev/null || echo MISSING` 若目錄不存在會回報 MISSING（看似「文件寫得對，目錄真的不在」）；但若目錄事後被重建，這個檢查會回報「目錄存在」→ 很容易被誤判成「文件過時但無傷大雅」而不深究內容。

**Claims-driven 驗證步驟**：
```bash
git ls-files modules/notifications
```
確認目錄底下實際有哪些檔案，然後用 Read 工具讀取進入檔（例如 `modules/notifications/src/index.ts`）確認目前的實作內容。

**正確結論**：`notifications` 模組不僅沒刪除，還已經**重建成新架構**（`NotificationService` + Resend adapter）。CLAUDE.md 說「已刪除」是嚴重過時的狀態性描述——目錄存在這件事本身就該觸發「讀內容確認」，而不是因為「反正文件說已刪除，目錄還在也可能只是殘留」就略過。

---

## 這三個案例的共通教訓

1. **檔案/目錄存在性檢查只能證明「東西沒被整個刪掉」，證明不了「內容還符合文件描述」。**
2. **任何涉及「指令、流程、狀態」的宣稱，都要讀到會實際執行/被讀取的那一層（指令註冊碼、hook 全文、模組進入檔），不能停在「這個路徑存在」就結案。**
3. **git-log 視窗抓不到「舊漂移」**——案例 1、2、3 的變更時間點不確定是否落在最近 30-50 筆 commit 內；claims-driven 驗證必須獨立於 commit 視窗，逐條把 Claims Inventory 跑完。
