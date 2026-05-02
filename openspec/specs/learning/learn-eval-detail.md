# Learn-Eval Plugin Detail

## Purpose

描述 `learn-eval` plugin 的設計內容，從 session 中萃取可重複利用的 pattern，進行品質閘評估，決定儲存路徑（Global vs Project），並在確認後寫入 skill 檔案。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `/learn-eval` command | `plugins/learn-eval/commands/learn-eval.md` | 唯一產物（118 行），無 skill 亦無 agent |

## 執行流程

```
分析 session
  ↓ 識別可萃取的 pattern 類型
    - Error Resolution Patterns（根因 + 修法 + 可重複性）
    - Debugging Techniques（非顯而易見的步驟組合）
    - Workarounds（套件怪癖、API 限制、版本特定修法）
    - Project-Specific Patterns（慣例、架構決策）
  ↓ 判斷儲存路徑
    - Global（~/.claude/skills/learned/）：跨 2+ 專案有用的通用 pattern
    - Project（.claude/skills/learned/）：此專案特定的知識
    - 不確定時選 Global（Global → Project 比反向容易）
  ↓ 草擬 skill 文件
  ↓ 品質閘（checklist + holistic verdict）
  ↓ 使用者確認
  ↓ 寫入 skill 文件
```

## 品質閘機制

### Checklist（必須全部執行）

- [ ] Grep `~/.claude/skills/` 與相關 project `.claude/skills/` 確認無內容重疊
- [ ] 檢查 MEMORY.md（global + project）確認無重疊
- [ ] 考慮是否 append 到現有 skill 即可（不需建新檔）
- [ ] 確認這是可重複利用的 pattern，而非一次性修法

### Holistic Verdict（四選一）

| Verdict | 意義 | 後續動作 |
|---------|------|---------|
| Save | 唯一、具體、範圍適當 | 使用者確認後寫入 |
| Improve then Save | 有價值但需要修正 | 列出改進點 → 修訂 → 重新評估（一次） |
| Absorb into [X] | 應 append 到現有 skill | 顯示目標 skill + diff → 使用者確認後 append |
| Drop | 瑣碎、重複、過於抽象 | 說明理由後停止（不需確認） |

## Skill 文件格式

```markdown
---
name: pattern-name
description: "Under 130 characters"
user-invocable: false
origin: auto-extracted
---

# [Descriptive Pattern Name]

**Extracted:** [Date]
**Context:** [Brief description of when this applies]

## Problem
## Solution
## When to Use
```

## 設計決策：不使用數字評分

原版本使用 5 維度數字評分（Specificity / Actionability / Scope Fit / Non-redundancy / Coverage，各 1-5 分）。現版本改用 checklist + holistic verdict，理由：Opus 4.6+ 有足夠的情境判斷能力，強制量化評分會丟失細節，整體判斷比數字加總更準確；explicit checklist 確保關鍵檢查不被跳過。

## 不萃取的情況

- 瑣碎修正（typos、簡單語法錯誤）
- 一次性問題（特定 API 故障、個別部署事件）
- 過於抽象的一般原則（沒有具體程式碼範例或命令）

## 觸發條件

使用者執行 `/learn-eval`（無需參數）時啟動。無 auto-activate。
