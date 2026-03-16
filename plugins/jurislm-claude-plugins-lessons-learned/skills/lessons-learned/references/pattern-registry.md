# Pattern Registry — 經驗模式元資料

> 此檔案記錄每個模式的結構化元資料，支援信心度追蹤、演化與健康管理。
> 由 `learn-eval` skill 新增條目，`evolve` skill 更新狀態。

## 元資料欄位說明

| 欄位 | 說明 |
|------|------|
| `id` | 模式編號（對應 SKILL.md 中的模式 N） |
| `name` | 模式名稱 |
| `category` | 所屬分類（A-K） |
| `scope` | `global`（跨專案通用）或 `project`（專案特定） |
| `confidence` | 信心度 0.3-0.9（0.3=初步觀察, 0.5=中度可用, 0.7=強烈建議, 0.9=核心行為） |
| `verified_count` | 被驗證/引用的次數 |
| `last_verified` | 最後一次驗證日期（YYYY-MM） |
| `source_projects` | 來源專案列表 |
| `status` | `active`（活躍）、`review`（需審查）、`deprecated`（已棄用） |
| `created` | 建立日期 |

## 信心度演化規則

- **+0.1**：模式在新專案中被驗證有效
- **+0.05**：模式在同專案中再次被引用
- **-0.1**：模式被明確糾正或發現不適用
- **-0.05**：超過 6 個月未被引用（staleness decay）
- **上限**：0.9（永遠保留人工審查空間）
- **下限**：0.3（低於此值應標記為 `deprecated`）

## Scope 晉升規則

- 預設 scope 為 `project`
- 當同一模式在 **2+ 個不同專案** 中被驗證，且 confidence ≥ 0.7 → 自動晉升為 `global`

---

## A. 診斷與除錯

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 1 | 環境 vs 代碼 | global | 0.9 | 15 | 2026-03 | jurislm, stock, lawyer, coolify | active |
| 2 | 過度工程化陷阱 | global | 0.8 | 8 | 2026-02 | jurislm | active |
| 3 | 系統性診斷 | global | 0.8 | 10 | 2026-03 | coolify, hetzner | active |
| 4 | 信任用戶反饋 | global | 0.9 | 12 | 2026-03 | jurislm, stock, lawyer | active |
| 12 | Typecheck 失敗處理流程 | global | 0.8 | 8 | 2026-03 | jurislm, stock, lawyer | active |
| 13 | ESLint 與官方文檔矛盾 | global | 0.7 | 4 | 2026-02 | stock | active |
| 19 | 類型重構測試同步 | global | 0.7 | 5 | 2026-02 | jurislm | active |
| 22 | PR Review 處理 | global | 0.8 | 7 | 2026-03 | stock, jurislm | active |

## B. 測試

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 8 | 表層 vs 本質驗證 | global | 0.9 | 10 | 2026-03 | jurislm, stock, lawyer | active |
| 14 | Vitest 陷阱 | global | 0.8 | 8 | 2026-03 | jurislm, stock | active |
| 15 | 完成聲明紀律 | global | 0.9 | 15 | 2026-03 | jurislm, stock, lawyer | active |
| 26 | Playwright + Vitest 共存 | global | 0.7 | 4 | 2026-02 | stock | active |
| 27 | Playwright E2E 陷阱 | project | 0.6 | 3 | 2026-02 | jurislm | active |
| 28 | globalIgnores 是逃避不是解法 | global | 0.8 | 6 | 2026-02 | stock | active |
| 29 | useSyncExternalStore snapshot 穩定性 | global | 0.7 | 3 | 2026-02 | stock | active |
| 30 | Mock 資料格式必須與 API 回傳型別一致 | global | 0.8 | 7 | 2026-03 | stock, jurislm | active |
| 31 | PR Review 修正必須逐項讀檔驗證 | global | 0.8 | 6 | 2026-03 | stock, jurislm | active |
| 32 | Playwright assertion 陷阱 | global | 0.7 | 4 | 2026-02 | stock | active |
| 33 | Merge + Review fixes 分開 commit | global | 0.7 | 4 | 2026-02 | stock | active |
| 60 | Prisma $transaction 原子性 | global | 0.7 | 3 | 2026-02 | stock | active |
| 61 | 重構實作後測試 mock 必須同步更新 | global | 0.8 | 5 | 2026-02 | stock, jurislm | active |
| 62 | $transaction mock 模式 | global | 0.7 | 3 | 2026-02 | stock | active |

## C. 基礎設施與部署

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 5 | MCP Server 重複配置 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| 6 | MCP 參數不匹配 | global | 0.7 | 4 | 2026-02 | coolify | active |
| 7 | 操作前檢查完整狀態 | global | 0.8 | 6 | 2026-03 | cloudflare, coolify | active |
| 16 | Coolify Service vs Application | global | 0.7 | 4 | 2026-02 | coolify | active |
| 17 | Hetzner Volume 與資料遷移 | project | 0.6 | 2 | 2026-02 | jurislm | active |
| 18 | 大量資料處理 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| 21 | Release Please | global | 0.8 | 6 | 2026-03 | stock, lawyer | active |
| 23 | Migration 安全 | global | 0.8 | 5 | 2026-02 | jurislm | active |
| 34 | Placeholder 環境變數觸發條件式功能 | global | 0.7 | 3 | 2026-02 | lawyer | active |
| 35 | Nixpacks Package Manager 偵測 | global | 0.7 | 3 | 2026-02 | lawyer | active |
| 36 | Build-time 與 Runtime 環境差異 | global | 0.7 | 3 | 2026-02 | lawyer | active |
| 58 | Cloudflare Free Plan WAF 限制 | global | 0.7 | 3 | 2026-02 | lawyer | active |

## D. 安全與錯誤處理

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| — | Finally block nested try-catch | global | 0.8 | 5 | 2026-02 | jurislm | active |
| — | Tool 執行 timeout 保護 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| — | Per-resource rate limiting | global | 0.7 | 3 | 2026-02 | jurislm | active |
| — | Sanitize 替換優於刪除 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 43 | Production 錯誤訊息隱藏策略 | global | 0.8 | 5 | 2026-02 | jurislm | active |
| 44 | API 錯誤分類處理 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| 45 | Regex global lastIndex 狀態污染 | global | 0.8 | 5 | 2026-03 | jurislm | active |
| 46 | Surrogate pair 安全截斷 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 63 | Reorder API ID 陣列完整性驗證 | global | 0.7 | 3 | 2026-02 | stock | active |
| 64 | .env.example 不可包含真實密碼 | global | 0.8 | 5 | 2026-03 | stock | active |

## D2. 業務邏輯

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| — | JurisLM 核心業務 | project | 0.7 | 4 | 2026-02 | jurislm | active |
| — | Legal Plugin 設計模式 | project | 0.6 | 3 | 2026-02 | jurislm | active |
| — | 分類系統 | project | 0.6 | 3 | 2026-02 | jurislm | active |
| — | Prompt Injection 防護 | global | 0.7 | 4 | 2026-02 | jurislm | active |

## E. 架構與重構

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| — | Config-driven mapping 優於 switch | global | 0.8 | 6 | 2026-03 | jurislm | active |
| — | Token budget 控制 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| 47 | CJK-aware Token 估算 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 48 | Per-tool timeout 差異化 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 49 | SSE 跨 chunk 解析 | global | 0.7 | 3 | 2026-02 | jurislm | active |

## F. Git 工作流

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 33 | Merge + Review fixes 分開 commit | global | 0.7 | 4 | 2026-02 | stock | active |
| — | PR Review 驗證流程 | global | 0.8 | 6 | 2026-03 | stock, jurislm | active |
| 57 | Merge + pre-commit hook 處理 | global | 0.8 | 5 | 2026-02 | jurislm | active |

## G. 工具與工作流

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| — | OpenSpec 結構化變更 | global | 0.7 | 4 | 2026-02 | stock, jurislm | active |
| — | Task tool subagent_type | global | 0.6 | 2 | 2026-02 | jurislm | active |

## H. 雲端遷移與環境配置

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 37 | dotenv 路徑計算錯誤 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 38 | Worktree 環境變數同步陷阱 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 39 | Ollama model tag 精確匹配 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 40 | OAuth redirect_uri 與 port 一致 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 41 | Getter 環境變數優先策略 | global | 0.7 | 4 | 2026-02 | jurislm | active |
| 42 | Docker 到雲端 DB 遷移清單 | project | 0.6 | 2 | 2026-02 | jurislm | active |
| 59 | Payload CMS Production Migration | global | 0.7 | 3 | 2026-02 | lawyer | active |

## I. 前端工具鏈與框架

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 50 | Tailwind CSS v4 @tailwindcss/vite | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 51 | pg_class.reltuples 快速行數估算 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 52 | Bun.serve idleTimeout | global | 0.7 | 3 | 2026-02 | jurislm | active |

## J. Turborepo Docker 部署

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 53 | turbo prune --docker 踩坑 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 54 | Coolify 注入 ARG 影響 Docker build | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 55 | Runner 階段不要 COPY node_modules | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 56 | Hono serveStatic 相對路徑與 WORKDIR | global | 0.7 | 3 | 2026-02 | jurislm | active |

## K. 資料匯入與 Migration

| id | name | scope | confidence | verified | last_verified | source_projects | status |
|----|------|-------|------------|----------|---------------|-----------------|--------|
| 65 | Migration 手動建表 checksum 陷阱 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 66 | 外部 CSV 資料解析防禦 | global | 0.7 | 3 | 2026-02 | jurislm | active |
| 67 | 日期合法性 vs 格式驗證 | global | 0.8 | 4 | 2026-02 | jurislm | active |
| 68 | 跨專案一致性 Staging 防護 | global | 0.7 | 3 | 2026-02 | jurislm, lawyer | active |
| 69 | Claude Code Action CI Permission Mode | global | 0.7 | 3 | 2026-03 | jurislm | active |
| 70 | Release Please v4 版本重置陷阱 | global | 0.7 | 3 | 2026-03 | jurislm | active |

---

## 統計摘要

| 指標 | 數值 |
|------|------|
| 總模式數 | 70 |
| Global scope | 63 |
| Project scope | 7 |
| Active | 70 |
| Review | 0 |
| Deprecated | 0 |
| 平均 confidence | 0.73 |
| 最高 confidence | 0.9（模式 1, 4, 8, 15） |
| 最低 confidence | 0.6（模式 27, D2 業務邏輯） |
| 上次整體審查 | 2026-03-16 |
