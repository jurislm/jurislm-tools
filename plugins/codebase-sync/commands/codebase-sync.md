---
name: codebase-sync
description: >
  Explore codebase and update README.md and CLAUDE.md, removing stale content.
  Use when: "更新 README", "同步文件", "CLAUDE.md 過時了", "update my docs",
  "sync documentation", "探索 codebase 並更新文件", "remove stale docs".
argument-hint: "(no arguments — operates on current directory)"
---

Apply the `codebase-sync` skill to perform a deep audit and update documentation.

> 此 skill 操作當前目錄，無需傳入參數。

## MANDATORY: 先審計，後動筆

**禁止跳步驟。禁止「看起來沒問題就不改」。每個步驟都必須執行並輸出結果。**

執行順序：
1. 跑 skill 的所有自動化偵測指令（Step 0）
2. 輸出完整 Audit Report（不得跳過）
3. 依 Audit Report 更新 README.md
4. 依 Audit Report 更新 CLAUDE.md
5. 驗證每個被引用的路徑/指令真的存在

**即使文件看起來沒什麼問題，也必須完整執行並輸出 Audit Report。**
