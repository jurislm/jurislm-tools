---
name: learn
description: Activate when the user says "learn this", "record this pattern", "save this lesson", "記錄這個經驗", "學到了", or when a debugging session reveals a reusable insight. Also activate on "/learn". Captures new patterns from the current session and prepares them for evaluation.
version: 1.0.0
---

# Learn — 從 Session 中捕獲新模式

從當前工作 session 中萃取可重用的經驗模式，準備送入 `learn-eval` 品質閘門。

---

## 觸發時機

- 用戶明確說「記錄這個」「學到了」「save this pattern」
- 除錯過程發現非顯而易見的根因
- 發現 library/framework 的隱藏行為
- 解決了一個花費大量時間的問題
- 發現跨專案可重用的解法

## 捕獲流程

### Step 1：辨識模式類型

判斷當前發現屬於哪一類：

| 類型 | 說明 | 範例 |
|------|------|------|
| **Error Resolution** | 根因 + 修正 + 適用場景 | Regex lastIndex 污染 |
| **Debugging Technique** | 非顯而易見的除錯步驟 | 系統性診斷流程 |
| **Workaround** | Library/API 的已知限制與解法 | Bun.serve idleTimeout |
| **Architecture Pattern** | 設計決策與取捨 | Config-driven mapping |
| **Security Pattern** | 安全相關的最佳實踐 | Reorder API ID 驗證 |

### Step 2：萃取結構

按以下格式萃取模式：

```markdown
### 模式 [下一個編號]：[簡短名稱]

**問題**：[遇到什麼問題？一句話描述症狀]

**根因**：[為什麼會發生？]

**正確做法**：[解法，含代碼範例（如果適用）]

**教訓**：
1. [關鍵洞見 1]
2. [關鍵洞見 2]
3. [關鍵洞見 3]

> 來源：[專案名稱] [功能/PR] — [簡短描述]（[日期]）
```

### Step 3：初步元資料

為新模式設定初始元資料：

```
id: [下一個可用編號]
category: [A-K 中最合適的分類]
scope: project（預設，除非明顯跨專案通用）
confidence: 0.5（初始值 — 首次觀察）
verified_count: 1
last_verified: [今天日期 YYYY-MM]
source_projects: [當前專案]
status: active
```

### Step 4：引導用戶進入 learn-eval

完成萃取後，提示用戶：

> 已捕獲新模式「[名稱]」。建議執行 learn-eval 進行品質評估後再正式納入。
> 如需立即納入，請確認並我會直接更新 SKILL.md 和 pattern-registry.md。

## 注意事項

- **一次只捕獲一個模式** — 原子性，避免混合不同主題
- **不重複** — 先搜尋 `pattern-registry.md` 確認沒有已存在的相似模式
- **來源必填** — 必須記錄來源專案和日期
- **代碼範例** — Error Resolution 和 Workaround 類型必須包含代碼範例
- **語言** — 使用繁體中文描述
