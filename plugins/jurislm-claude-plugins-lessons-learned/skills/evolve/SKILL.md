---
name: evolve
description: Activate when the user says "evolve patterns", "consolidate patterns", "合併模式", "演化", "promote pattern", "/evolve", or when instinct-status reports suggest consolidation or promotion. Clusters related patterns, promotes project→global, merges duplicates, and deprecates stale patterns.
version: 1.0.0
---

# Evolve — 模式演化與合併

分析現有模式庫，執行合併、晉升、棄用操作，讓經驗模式持續精煉。

---

## 演化操作

### 操作 1：合併相似模式（Cluster）

當同一分類中有多個高度相關的模式時：

**觸發條件**：
- 同分類超過 15 個模式
- 2+ 個模式處理同一個工具/框架的不同面向
- instinct-status 報告建議合併

**執行流程**：
1. 列出候選合併組（顯示哪些模式可以合併）
2. 用戶確認合併方案
3. 建立合併後的新模式（保留所有代碼範例）
4. 新模式 confidence = max(被合併模式的 confidence)
5. 新模式 verified_count = sum(被合併模式的 verified_count)
6. 新模式 source_projects = union(被合併模式的 source_projects)
7. 移除舊模式，更新 SKILL.md 和 pattern-registry.md

**範例**：
```
合併建議：
模式 60（Prisma $transaction 原子性）
+ 模式 62（$transaction mock 模式）
→ 新模式「Prisma $transaction 完整指南」
  包含：原子性保護 + mock 模式 + race condition 防護
```

### 操作 2：Scope 晉升（Promote）

將 project scope 模式晉升為 global scope。

**觸發條件**：
- 模式在 2+ 個不同專案中被驗證
- confidence >= 0.7
- 不含專案特定的業務邏輯

**執行流程**：
1. 從 pattern-registry.md 找出候選模式
2. 逐一確認：是否真的跨專案通用？
3. 更新 scope 為 `global`
4. 泛化描述（移除專案名稱，保留通用技術描述）

**範例**：
```
晉升建議：
模式 27「Playwright E2E 陷阱」
  目前 scope: project（僅 jurislm）
  條件：confidence 0.6, 1 個專案
  判定：❌ 不符合晉升條件（需 2+ 專案、confidence >= 0.7）
```

### 操作 3：棄用（Deprecate）

標記不再適用的模式。

**觸發條件**：
- confidence 降到 0.3 以下
- 相關技術已過時（如特定版本 bug 已修復）
- 被更完整的新模式取代

**執行流程**：
1. 列出候選棄用模式和原因
2. 用戶確認
3. 在 pattern-registry.md 中設 `status: deprecated`
4. 在 SKILL.md 中該模式標題加上 ~~刪除線~~ 和棄用說明
5. **不刪除**模式內容（保留歷史參考）

### 操作 4：Confidence 更新（Verify）

批量更新模式的信心度。

**觸發條件**：
- 用戶完成一個專案/sprint，確認哪些模式被用到
- 定期審查（建議每季一次）

**執行流程**：
1. 列出所有模式，用戶勾選「這次用到了」
2. 被勾選的模式：verified_count +1、last_verified 更新、confidence +0.05
3. 如果在新專案中驗證：confidence +0.1、加入 source_projects
4. 更新 pattern-registry.md

---

## 演化報告格式

執行完畢後產出報告：

```
## 🔄 演化報告 — [日期]

### 執行摘要
- 合併：[N] 組（[M] 個模式 → [K] 個新模式）
- 晉升：[N] 個模式（project → global）
- 棄用：[N] 個模式
- 信心度更新：[N] 個模式

### 變更明細
[逐項列出每個變更]

### 模式庫更新後統計
- 總模式數：[N]（原 [M]）
- 平均 confidence：[0.XX]（原 [0.XX]）
- Global scope：[N]（原 [M]）
```

## 注意事項

- **所有操作需用戶確認** — 不自動執行任何破壞性變更
- **合併時保留代碼範例** — 合併後的模式必須包含所有原模式的代碼範例
- **棄用不刪除** — deprecated 模式保留在 SKILL.md 中作為歷史參考
- **一次一個操作** — 不要同時執行合併 + 棄用，避免混亂
- **更新完後跑一次 instinct-status** — 確認報告正確
