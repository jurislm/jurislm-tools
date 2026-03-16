# Lessons Learned Plugin

跨專案開發經驗模式庫，具備動態學習與成長機制。從實際踩坑中提煉的關鍵教訓與改進方案，支援信心度追蹤、品質閘門、模式演化。

## 功能

- **70 個經驗模式**，按 12 個主題分類（持續成長）
- **Confidence Scoring** — 每個模式帶有信心度（0.3-0.9），隨驗證次數演化
- **動態學習** — `learn` + `learn-eval` skills 從 session 中捕獲新模式
- **健康報告** — `instinct-status` skill 偵測陳舊模式與晉升候選
- **模式演化** — `evolve` skill 合併、晉升、棄用模式

## 安裝

```
/plugin install jurislm-claude-plugins-lessons-learned@jurislm-plugins
```

## Skills（5 個）

| Skill | 觸發方式 | 說明 |
|-------|----------|------|
| **lessons-learned** | 遇到 bug、測試失敗、部署問題時自動觸發 | 70 個經驗模式知識庫 |
| **learn** | 「記錄這個」「學到了」「save this pattern」 | 從 session 捕獲新模式 |
| **learn-eval** | 「品質評估」「evaluate pattern」 | 新模式品質閘門（Save / Improve / Absorb / Drop） |
| **instinct-status** | 「模式狀態」「pattern health」 | 健康報告（信心度分佈、陳舊度、晉升建議） |
| **evolve** | 「演化」「合併模式」「promote pattern」 | 模式合併、scope 晉升、棄用 |

## 學習成長流程

```
Session 中發現問題
       ↓
  learn（捕獲模式）
       ↓
  learn-eval（品質閘門）
       ↓
  ┌─ Save → 新增到 SKILL.md + registry
  ├─ Improve → 改善後再 Save
  ├─ Absorb → 合併到既有模式
  └─ Drop → 捨棄
       ↓
  instinct-status（定期健康檢查）
       ↓
  evolve（合併 / 晉升 / 棄用）
```

## Confidence Scoring

| 分數 | 意義 | 行為 |
|------|------|------|
| 0.3 | 初步觀察 | 僅供參考 |
| 0.5 | 首次驗證 | 中度可用 |
| 0.7 | 多次驗證 | 強烈建議 |
| 0.9 | 核心行為 | 自動套用 |

**演化規則**：
- 新專案驗證 → +0.1
- 同專案再次引用 → +0.05
- 被明確糾正 → -0.1
- 超過 6 個月未引用 → -0.05（staleness decay）

## Scope 管理

- **project** — 僅特定專案適用（預設）
- **global** — 跨專案通用
- **晉升條件** — 2+ 個專案驗證 + confidence >= 0.7 → 自動從 project 晉升為 global

## 分類

| 類別 | 涵蓋主題 |
|------|----------|
| A. 診斷與除錯 | 環境 vs 代碼、過度工程化、系統性診斷、Typecheck 失敗 |
| B. 測試 | Vitest、Playwright、E2E mock、assertion 陷阱、$transaction mock |
| C. 基礎設施與部署 | MCP、Coolify、Hetzner、Release Please、Migration 安全 |
| D. 安全與錯誤處理 | Production 錯誤隱藏、Token 估算、SSE 解析、Regex lastIndex |
| D2. 業務邏輯 | JurisLM 核心業務、Legal Plugin 設計、分類系統、Prompt Injection |
| E. 架構與重構 | Config-driven mapping、Token budget、Per-tool timeout |
| F. Git 工作流 | Merge + review 分離、PR Review 驗證 |
| G. 工具與工作流 | OpenSpec、Task tool subagent_type |
| H. 雲端遷移與環境配置 | dotenv 路徑、Worktree env 同步、Payload CMS Migration |
| I. 前端工具鏈與框架 | Tailwind CSS v4、pg_class.reltuples、Bun.serve idleTimeout |
| J. Turborepo Docker 部署 | turbo prune、Coolify ARG 注入、COPY node_modules |
| K. 資料匯入與 Migration | checksum 陷阱、CSV 解析防禦、日期合法性 vs 格式驗證 |

## 授權

MIT
