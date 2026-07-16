---
name: openspec-deliver
description: >
  端到端落地一個新需求：需求分析 → 建立/沿用 GitHub issue → 建立/沿用
  OpenSpec 提案 → 依提案 TDD 實作（發現更好做法即同步提案）→ PR → code
  review → merge → 監看部署 → 驗收 → 歸檔。範圍鎖定 jurislm/entire
  （GitHub Flow：無 develop 分支，feature 直接對 main 開 PR）。
  Use when: "完整落地這個需求", "走完整個 OpenSpec 流程", "從頭到尾做完
  這個功能", "deliver this feature end to end", "run the full openspec
  delivery flow".
argument-hint: "[需求描述]"
---

## Arguments

$ARGUMENTS

視為本次要落地的需求描述（自然語言即可，不需先格式化）。以下流程即依此需求
從頭執行到 main 驗收通過並歸檔。

## 流程

完整落地一個新需求：需求分析 → 建立／沿用追蹤 issue → 建立／沿用 OpenSpec
提案 → 依提案實作（發現更好做法即同步提案）直到驗收通過並上線 main
（GitHub Flow：無 develop 分支，feature 直接對 main 開 PR）。

【提案同步鐵則｜貫穿全流程】方案／範圍／任務拆分需要變更時（沿用既有提案
發現差異、開發中找到更好做法），一律：① 同步對應 artifact（proposal／
design／specs delta／tasks，不只改一份，記錄新方案與 why）→ ②
`openspec validate --strict` → ③ 影響已完成 phase 就回頭確認驗收是否仍
成立、需要時補測試 → ④ 獨立 commit 說明變更原因 → 才繼續下一步。不可先
動 code 事後補 spec。純實作細節優化同步完可自行繼續；動了架構或範圍 →
停下等使用者 GO。

0. 需求分析（不建檔案）
   - superpowers:using-superpowers 確認適用技能 → superpowers:brainstorming
     釐清意圖／範圍／非目標（只問影響架構或長期路徑的問題，其餘自行拍板）
   - 盤點現況（不可憑假設斷言）：grep/Read 相關 codebase、
     openspec/changes/（含 archive）有無相關提案、memory 相關 feedback
   - 產出需求摘要：目標／範圍／不做什麼／驗收標準草案

1. 建立／沿用追蹤用 GitHub issue
   - 先查有無相關既有 issue：`gh issue list --state all --search
     "<關鍵詞>"`（含已關閉）
   - 有 → 沿用該 issue：`gh issue comment` 補充本次範圍，需要時
     `gh issue edit` 同步標題／labels；無 → `gh issue create` 新建
     （含背景／範圍／驗收標準），補 labels + assignee
   - 記下 issue number，後續 proposal／PR／commit 皆引用 `Closes #<n>`

2. 建立／沿用 OpenSpec 提案
   - 先查有無相關既有提案：`ls openspec/changes/`（active）+
     `openspec/changes/archive/`，grep 各 proposal.md 比對需求關鍵詞
   - 命中 active → 沿用，用 opsx:continue 或直接編輯既有 4 artifacts
     （依提案同步鐵則）；命中 archive → 汲取前作教訓，仍建新 change，
     proposal.md 註明「延續／取代 archive/<date>-<name>」；都沒有 →
     依命名格式取名（先核對現有最大處理順序尾綴），用 opsx:ff（或
     opsx:new → opsx:continue）產出全新 4 artifacts
   - proposal.md 含 `Closes #<issue-num>`；撰寫前完成 9 維度環境盤點
     （entire/CLAUDE.md 模式 83），寫進 verification-logs/；跑
     `openspec validate --strict`
   - **停下，展示 proposal／design／tasks 摘要，等使用者 GO——未經
     確認不得進入 worktree 與實作**

3. 建立 feature worktree（拿到 GO 後）
   superpowers:using-git-worktrees（或 `git worktree add -b <change-name>
   .claude/worktrees/<change-name> main`），直接基於 main 建立；
   worktree／分支／提案名稱三者一致（不含尾綴）

4. 逐 phase 執行 tasks.md：opsx:apply 讀 task →
   superpowers:test-driven-development 驅動（Red 含 edge case → Green →
   Refactor）
   - Red 未如預期失敗／測試莫名紅／非預期行為 → 先
     superpowers:systematic-debugging 查根因，不直接改
   - 發現需要重構／整合既有模組、或有更好做法 → 依【提案同步鐵則】處理，
     再繼續寫 code
   - phase 完成 → 本地行為性驗收（真的呼叫程式碼；PR 後即 CI+review+prod，
     無雲端 staging 再擋一次）→ opsx:verify 對照 spec/tasks →
     superpowers:verification-before-completion 看到實際輸出才宣稱完成
     → 小步 commit
   - 不在此階段歸檔

5. 全部 phase 完成、經 verification-before-completion 確認有證據 →
   PR：<change-name> → main（PR body 含 `Closes #<issue-num>`）
   - superpowers:requesting-code-review 自查 → 執行 /code-review 產出
     finding；掛 Monitor 盯 CI/CD 到終態，同時主動抓 bot 留言
     （CodeRabbit/Copilot），不等提醒
   - CI 紅或 review 抓到 bug → 先 systematic-debugging 查根因
   - 收到意見（含 bot）→ superpowers:receiving-code-review 逐項核實：
     CRITICAL/HIGH/MEDIUM 修正並驗證；LOW 優先採納，不採納須寫具體
     理由；全部 review thread 逐一 resolve
   - CI 綠燈 + mergeable CLEAN → superpowers:finishing-a-development-branch
     合併（觸發部署 pipeline；issue 隨 `Closes #<n>` 自動關閉）

6. Merge 後：Monitor 盯部署到終態，確認 health check 通過（含 commit
   比對）；失敗先 systematic-debugging 找根因，必要時手動重新部署上一個
   成功 commit；宣稱 prod 驗收通過前用 verification-before-completion
   跑實際請求／截圖／log 佐證

7. main 驗收無誤後，opsx:archive 歸檔整個 <change-name>；確認關聯 issue
   已隨 PR 自動關閉（未關閉則 `gh issue close`）
