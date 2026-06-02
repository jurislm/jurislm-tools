# Code Review 設定（Copilot 自訂指示）

> **2026-06-02**：自動 Claude PR 審查（`.github/workflows/claude-code-review.yml` / `claude.yml` / Drone `claude-review` pipeline）已從 repo-standards 移除。本檔僅保留 **GitHub Copilot 自訂指示**模板；code review 整體做法（人工 `/code-review` + bot）見 SKILL.md「Code Review 設定」。

## Copilot 自訂指示檔案

GitHub Copilot 支援三種層級的指示，**同時**提供給 Copilot（非互斥）：

| 檔案路徑 | 套用範圍 | 說明 |
|---------|---------|------|
| `.github/copilot-instructions.md` | 整個 repo | 全域指引，適用所有 Copilot 請求 |
| `.github/instructions/*.instructions.md` | 依 glob 路徑 | 需加 frontmatter `applyTo`，精準控制套用範圍 |
| `.github/prompts/*.prompt.md` | 手動觸發 | VS Code / Visual Studio / JetBrains 可用，以 `/promptname` 呼叫 |

**優先順序**：Personal > Repository > Organization（均會提供，Personal 最優先）

**環境支援矩陣**：

| 環境 | repo-wide | path-specific | prompt files |
|------|-----------|--------------|-------------|
| GitHub.com | ✅ | ✅ | ✅ |
| VS Code | ✅ | ✅ | ✅ |
| Visual Studio | ✅ | ❌ | ✅ |
| JetBrains | ✅ | ❌ | ❌ |

**路徑特定指示 frontmatter 欄位**：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `applyTo` | ✓ | Glob 語法，多個模式用逗號分隔（如 `"**/*.ts,**/*.tsx"`） |
| `excludeAgent` | ✗ | 防止指定 agent 使用此檔案：`"code-review"` 或 `"cloud-agent"` |

**路徑特定指示範例**（`.github/instructions/typescript.instructions.md`）：

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
excludeAgent: "code-review"
---

禁止使用 `any` 類型。使用 `unknown` + type guard 代替。
```

**格式規則**：
- 純 Markdown；路徑特定指示需加 frontmatter
- 無硬性字數限制，但保持精簡（直接下指令，避免模糊描述）
- `.github/copilot-instructions.md` 放 repo 通用規則；語言/框架專屬規則放 `.github/instructions/`

**Node.js/CommonJS Repo 標準模板**：

```markdown
# Copilot Instructions

## 語言與執行環境
- 此專案使用 Node.js（CommonJS，`require`/`module.exports`），不使用 TypeScript 或 ESM
- 不建議使用 `import`/`export` 語法

## 程式碼風格
- 預設使用 `const`；僅在需要重新賦值時使用 `let`，不使用 `var`
- 非同步函式統一使用 `async/await`，避免 `.then()` chain
- 下劃線前綴（`_param`）表示刻意不使用的參數，ESLint 允許此模式

## 測試
- 測試框架為 Jest，新功能必須附帶單元測試
- 不建議使用 Vitest 特有 API（如 `vi.fn()`），統一使用 `jest.fn()`

## Code Review 重點
- 標記任何 `eval()` 或 `new Function()` 使用為安全疑慮
- 用戶輸入直接拼接到字串中（潛在 injection）需標記
- `async` 函式缺少 try/catch 或 `.catch()` 需提醒（unhandled rejection 風險）

## 忽略範圍
- 不審查 `node_modules/`、`dist/`、`coverage/` 目錄下的檔案
- 不對自動生成的 mock 檔案提出風格建議
```

**Next.js Repo 標準模板**：

```markdown
# Copilot Instructions

## 語言與執行環境
- 此專案使用 Next.js（App Router）+ TypeScript
- 禁止使用 `any` 類型，測試檔案除外

## 程式碼風格
- React 元件使用 `const` arrow function，不使用 `function` 宣告
- 伺服器元件優先（Server Components first）；需要互動才使用 `'use client'`
- 所有非同步操作使用 `async/await`

## 測試
- 測試框架為 Vitest + Testing Library
- 不建議 Jest 特有 API，統一使用 `vi.fn()`、`vi.mock()`

## Code Review 重點
- 標記直接暴露在 Client Component 的敏感資料（API key、token）
- `useEffect` 缺少 dependency array 或 cleanup 需提醒
- SQL 字串拼接需標記（injection 風險）

## 忽略範圍
- 不審查 `.next/`、`out/`、`node_modules/` 目錄
- 不對 `next-env.d.ts` 提出修改建議
```

> **注意**：依照 repo 的實際技術棧調整模板，不需要完全照搬。核心原則是「具體且可操作」。
