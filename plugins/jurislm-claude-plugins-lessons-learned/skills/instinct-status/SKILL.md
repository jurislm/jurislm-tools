---
name: instinct-status
description: Activate when the user says "pattern status", "instinct status", "模式健康", "模式狀態", "pattern health", "/instinct-status", or asks about the health of the lessons learned knowledge base. Generates a health report of all patterns including staleness detection and confidence distribution.
version: 1.0.0
---

# Instinct Status — 模式健康報告

產出經驗模式庫的健康報告，包含信心度分佈、陳舊度檢測、scope 統計。

---

## 報告流程

### Step 1：讀取 pattern-registry.md

從 `skills/lessons-learned/references/pattern-registry.md` 讀取所有模式元資料。

### Step 2：產出健康報告

按以下格式輸出：

```
## 📊 模式健康報告 — [日期]

### 總覽
- 總模式數：[N]
- Active：[N] | Review：[N] | Deprecated：[N]
- Global scope：[N] | Project scope：[N]
- 平均 confidence：[0.XX]

### 信心度分佈
- 🟢 高信心（0.8-0.9）：[N] 個模式
- 🟡 中信心（0.6-0.7）：[N] 個模式
- 🔴 低信心（0.3-0.5）：[N] 個模式

### ⚠️ 需要關注

#### 陳舊模式（超過 6 個月未驗證）
| id | name | last_verified | confidence | 建議 |
|----|------|---------------|------------|------|
| [列出所有超過 6 個月未驗證的模式] |

#### 低信心模式（confidence < 0.5）
| id | name | confidence | verified_count | 建議 |
|----|------|------------|----------------|------|
| [列出所有 confidence < 0.5 的模式] |

#### Project scope 候選晉升（可能適合升為 global）
| id | name | source_projects | confidence | 條件缺什麼 |
|----|------|-----------------|------------|------------|
| [列出 project scope 但 confidence >= 0.7 的模式] |

### 分類統計
| 分類 | 模式數 | 平均 confidence | 最近更新 |
|------|--------|----------------|----------|
| A. 診斷與除錯 | [N] | [0.XX] | [YYYY-MM] |
| B. 測試 | [N] | [0.XX] | [YYYY-MM] |
| ... |

### 建議操作
1. [具體建議，如「模式 27 為 project scope 但已在 2 個專案驗證，建議晉升 global」]
2. [具體建議，如「模式 42 超過 6 個月未驗證，建議審查是否仍適用」]
```

### Step 3：Staleness Decay 執行

如果發現陳舊模式（超過 6 個月未驗證）：

1. 提議對這些模式執行 staleness decay（confidence -0.05）
2. 如果 decay 後 confidence < 0.3，建議標記為 `deprecated`
3. **不自動執行** — 列出變更供用戶確認

### Step 4：更新建議

根據報告結果，給出 1-3 個具體建議：

| 情境 | 建議 |
|------|------|
| 某分類模式數過多（>15） | 建議執行 `/evolve` 合併相似模式 |
| 有 project scope 模式已多專案驗證 | 建議晉升為 global |
| 有模式 confidence 持續下降 | 建議審查或 deprecate |
| 整體平均 confidence < 0.6 | 建議執行整體驗證 review |

## 注意事項

- 本 skill 只讀不寫 — 所有變更都需要用戶確認後才執行
- 報告中的「建議」只是建議，最終決定權在用戶
- 陳舊度以 `last_verified` 欄位為準，不是 `created` 欄位
