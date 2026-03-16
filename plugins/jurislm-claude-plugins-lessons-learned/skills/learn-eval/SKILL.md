---
name: learn-eval
description: Activate when a new pattern has been captured by the learn skill and needs quality evaluation, or when the user says "evaluate pattern", "品質評估", "review this pattern", "/learn-eval". Quality gate that determines whether a captured pattern should be saved, improved, absorbed into existing, or dropped.
version: 1.0.0
---

# Learn-Eval — 模式品質閘門

評估新捕獲的模式品質，決定是否正式納入經驗模式庫。

---

## 評估流程

### Step 1：讀取待評估模式

確認模式已由 `learn` skill 萃取，包含完整結構：
- 問題描述
- 根因分析
- 正確做法（含代碼範例）
- 教訓
- 來源

### Step 2：品質檢查清單

逐項檢查：

| # | 檢查項 | 通過條件 |
|---|--------|----------|
| 1 | **唯一性** | `pattern-registry.md` 中無相似模式 |
| 2 | **可操作性** | 包含具體的「正確做法」，不只是抽象建議 |
| 3 | **可重現性** | 其他開發者遇到相同問題能套用此模式 |
| 4 | **根因深度** | 解釋了「為什麼」，不只是「怎麼做」 |
| 5 | **範圍適當** | 不過於寬泛（「寫好的代碼」）也不過於狹窄（「第 47 行加分號」） |
| 6 | **代碼範例** | Error Resolution / Workaround 類型必須有代碼 |

### Step 3：重複檢測

搜尋現有模式庫，找出可能的重複或重疊：

1. 讀取 `pattern-registry.md` 所有模式名稱和分類
2. 比對新模式的主題、關鍵字、適用場景
3. 如果找到重疊，判斷是「完全重複」還是「可合併」

### Step 4：Scope 判定

| 條件 | Scope |
|------|-------|
| 只在一個專案驗證過 | `project` |
| 在 2+ 個專案驗證過 | `global` |
| 涉及通用 library/framework（React, Prisma, Playwright 等） | `global` |
| 涉及專案特定業務邏輯 | `project` |
| 涉及安全最佳實踐 | `global` |

### Step 5：判定結果

四種結果之一：

#### Save — 直接儲存
- 條件：品質檢查全通過、無重複、scope 明確
- 動作：
  1. 在 SKILL.md 對應分類末尾新增模式
  2. 在 `pattern-registry.md` 對應分類表格新增條目
  3. 更新統計摘要

#### Improve then Save — 改善後儲存
- 條件：有價值但需要補充（缺代碼範例、根因不夠深、描述模糊）
- 動作：列出需改善項目 → 修改 → 重新評估 → Save

#### Absorb — 吸收到既有模式
- 條件：與現有模式主題重疊，但有新的洞見或案例
- 動作：
  1. 將新洞見合併到既有模式（新增案例或教訓項目）
  2. 更新 `pattern-registry.md` 中該模式的 `verified_count` + 1 和 `last_verified`
  3. 如果來自新專案，加入 `source_projects`

#### Drop — 捨棄
- 條件：過於瑣碎、太抽象、完全重複、或只是一次性問題
- 動作：告知用戶原因，不寫入任何檔案

### Step 6：執行儲存

如果判定為 Save 或 Absorb：

1. **更新 SKILL.md**：在對應分類（## A-K）的最後一個模式之後新增
2. **更新 pattern-registry.md**：在對應分類表格新增一行
3. **更新統計摘要**：總模式數 +1、重新計算平均 confidence
4. **回報**：

```
✅ 模式 [N]「[名稱]」已納入
   分類：[X]. [分類名]
   Scope：[global/project]
   Confidence：[0.5]
   來源：[專案]
```

## Confidence 初始值指南

| 條件 | 初始 Confidence |
|------|----------------|
| 首次觀察，單一專案 | 0.5 |
| 已在 2 個專案驗證 | 0.7 |
| 涉及已知的 library bug/limitation | 0.7 |
| 涉及安全漏洞 | 0.8 |
| 來自官方文檔的最佳實踐 | 0.8 |
