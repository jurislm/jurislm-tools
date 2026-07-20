# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository 概覽

`jurislm-tools` 是一個 **Claude Code Plugin Marketplace**（GitHub repo：`jurislm/jurislm-tools`），純 YAML/JSON/Markdown，無編譯步驟、無執行期程式碼。它打包了 JurisLM 內部使用的 MCP servers、skills、commands，讓其他 repo 的 Claude Code session 可以 `/plugin install` 安裝使用。

## 常用命令

```bash
# 驗證 JSON 格式
cat .claude-plugin/marketplace.json | jq .
cat .release-please-manifest.json | jq .

# 檢查 marketplace.json / plugin.json 版本號是否與 release-please 同步
node scripts/check-version-sync.mjs
```

沒有 build / test / typecheck 這類命令——repo 內無程式邏輯可執行。`package.json` 的 `lint:md` script（`markdownlint plugins/code-review/**/*.md`）指向已不存在的路徑，目前執行會失敗；不要以為它能驗證 plugin 的 Markdown。

### Codex App Local Environment

- 路徑：`.codex/environments/environment.toml`
- `setup` 為刻意 no-op：此 repo 不需要 worktree bootstrap
- `actions`（Codex app 頂部捷徑）：`Validate Marketplace JSON`、`Validate Release Manifest`、`Check Version Sync`
- `Check Version Sync` 動態讀取 `release-please-config.json` 的 `extra-files` 逐一比對
- 前置需求：上述 actions 依賴 `jq`

## 架構：Marketplace → Plugins

```
.claude-plugin/marketplace.json     # Marketplace 定義入口（name, owner, plugins[]）
plugins/<plugin-name>/
├── .claude-plugin/plugin.json      # Plugin 元資料（name, version, description）
├── .mcp.json                       # MCP server 設定（僅 Hybrid plugin）
├── skills/<name>/SKILL.md          # Skill（trigger phrases 觸發，或手動呼叫）
├── commands/<name>.md              # Slash command（/<name>），非必備
└── README.md
```

Skills 與 commands 目錄下的檔案由 Claude Code **自動發現**，不需要在 `plugin.json` 中逐一宣告。`plugin.json` 只管理 plugin 元資料與 `.mcp.json`。

### 目前 9 個 Plugins

| Plugin | 類型 | MCP / 產物 | Command？ |
|--------|------|-----------|-----------|
| coolify | Hybrid | Coolify MCP（`npx @jurislm/coolify-mcp@latest`，43 工具）+ skill | 無——純 skill 觸發 |
| hetzner | Hybrid | Hetzner MCP（`npx @jurislm/hetzner-mcp@latest`，42 工具）+ skill | 無 |
| langfuse | Hybrid | Langfuse MCP（`npx @jurislm/langfuse-mcp@latest`，50 工具）+ skill | 無 |
| higgsfield | Hybrid | Higgsfield 官方 remote MCP（`https://mcp.higgsfield.ai/mcp`，OAuth，72 工具）+ 7 個 CLI-based skills | 無 |
| repo-standards | Skill | JurisLM repo 標準審查 skill（含多份 `references/*.md` 模板） | `/repo-standards` |
| podcast-to-blog | Skill | Apple Podcasts → 部落格文章（Whisper 轉錄） | `/podcast-to-blog` |
| codebase-sync | Skill | Claims-driven 文件同步（審計並更新 README.md / CLAUDE.md） | `/codebase-sync` |
| learn-eval | Skill | 從 session 萃取可重複利用 pattern，含品質閘 + dedup | `/learn-eval` |
| jt-flow | Skill | 端到端落地需求的個人工作流，整合 OpenSpec + superpowers（單一需求與多 issue 佇列兩個 Skills） | 無——由 `jt-flow`、`jt-flow-all` Skills 觸發 |

**注意 `coolify`、`hetzner`、`langfuse`、`higgsfield` 沒有 slash command**——純靠 SKILL.md 的 trigger phrases 自動觸發，README.md 中若出現 `/jt:coolify` 之類的指令是舊版單一 `jt` plugin 時代的殘留，實際安裝後不存在該指令。

MCP server 環境變數一律寫在 `~/.zshenv`（非 `~/.zshrc`，因為 MCP server 是非互動式子進程，不會 source `~/.zshrc`）：

| Plugin | 必要環境變數 |
|--------|------------|
| coolify | `COOLIFY_ACCESS_TOKEN`、`COOLIFY_BASE_URL` |
| hetzner | `HETZNER_API_TOKEN`（不是 `HCLOUD_TOKEN`） |
| langfuse | `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_HOST`（JurisLM 用 `https://us.cloud.langfuse.com`） |
| higgsfield | 無——OAuth remote MCP，透過瀏覽器登入，不需本機 env var |

### 已被移除的 Plugins（2026-06-24，v1.27.0「精簡 marketplace」）

`hooks-and-rules`、`entire`、`plan`、`pr-review`、`tdd`、`tdd-workflow` 六個 plugin 已整批刪除（commit `ac3d0f6`）。如果在其他文件（`openspec/specs/`、`.github/copilot-instructions.md`、舊 PR 描述）看到這些名字，代表該文件尚未跟上此次精簡——**以 `.claude-plugin/marketplace.json` 與 `plugins/` 目錄實際內容為準，不要相信派生文件**。

## 版本管理

**禁止手動修改任何 plugin 或 marketplace 的版本號** — 由 Release Please 自動處理（`feat:` → minor bump，`fix:` → patch bump，`docs:`/`chore:` 不觸發版本升級）。目前版本：`1.30.0`（見 `.release-please-manifest.json`）。

`release-please-config.json` 的 `extra-files` 會在每次 release 時同步更新以下 10 個檔案的版本欄位：

- 9 個 `plugins/<name>/.claude-plugin/plugin.json` 的 `$.version`
- `.claude-plugin/marketplace.json` 的 `$.plugins[0].version`（**陣列索引**，非 filter jsonpath）

**重要**：`marketplace.json` 目前 `plugins` 陣列第一個元素是 `coolify`。release-please 用索引 `[0]` 更新版本，若調整陣列順序、在 `coolify` 前插入新 plugin，會導致版本號寫到錯誤的 entry。新增 plugin 一律附加在陣列尾端，不要插到最前面。（其餘 8 個 plugin 在 `marketplace.json` 內完全不帶 `version` 欄位——只有 index 0 的 entry 需要，其餘由各自 `plugin.json` 提供版本資訊。）

**commit type 規則**（純文字 / plugin repo）：
- 新增 skill、更新 skill 內容（新規則、新範例）→ `feat:`
- 修正錯誤資訊 → `fix:`
- 純格式整理 → `docs:` 或 `chore:`

Plugin 類型（純文字）的 release-please 跑在 GitHub Actions（`.github/workflows/release.yml`），版本一致性檢查跑在 `.github/workflows/version-check.yml`（PR 改到 `marketplace.json` 或 manifest 時觸發，比對兩者版本是否一致）——**不是** Drone CI（Drone 只用於有程式碼要跑 build/test 的 repo）。

## OpenSpec 系統（獨立於 marketplace plugins）

`openspec/` 與 `.claude/skills/openspec-*/` + `.claude/commands/opsx/*` 構成本 repo 內建的規格驅動開發流程，**不是** marketplace plugin，不會出現在 `/plugin list`：

```
openspec/
├── config.yaml          # schema: spec-driven（context 欄位目前為空）
├── specs/                # 已完成並存活的 spec 文件
└── changes/              # 進行中的 change artifacts（archive/ 存放已封存項目，目前皆為空）
```

Artifact 依序產出：`proposal → design → specs → tasks`（`/opsx new`、`/opsx continue`、`/opsx ff`、`/opsx apply`、`/opsx verify`、`/opsx archive`、`/opsx bulk-archive`、`/opsx explore`、`/opsx sync`、`/opsx onboard`）。

⚠️ **`openspec/specs/` 內容已過時**：最後一次整批填充於 2026-05-02，描述的是精簡前的 12-plugin 架構（含已刪除的 `hooks-and-rules`/`plan`/`tdd`/`tdd-workflow`/`pr-review`/`entire`），尚未反映 2026-06-24 的精簡、之後新增的 `learn-eval`、`higgsfield`，以及舊版工作流於 issue #133 改名為 `jt-flow`。修改 plugin 架構時，`openspec/specs/_overview/marketplace-architecture.md` 等文件需要一併更新，但目前不能拿它當作現況依據。

`jt-flow` plugin 的兩個 Skills 內部呼叫 `superpowers:*` 系列 skill（`using-superpowers`、`brainstorming`、`test-driven-development`、`using-git-worktrees`、`systematic-debugging`、`verification-before-completion`、`requesting-code-review`、`receiving-code-review`、`finishing-a-development-branch`）——這是**外部依賴**，`superpowers` 本身不在此 repo 內，要讓 `jt-flow` 與 `jt-flow-all` 完整運作需另外安裝該 skill 集。

## Git 分支規範

```
develop → PR → main
```

- **主目錄（repo root）固定停留在 `main` 分支**——GitHub 預設分支，也是本地 plugin marketplace 掛載來源，不做 feature commits
- 日常開發在獨立 worktree `.claude/worktrees/develop`
- 其餘 feature branch 需要隔離時，建立獨立 worktree 於 `.claude/worktrees/<branch>`
- 開始前必做：`git worktree list` + `git branch --show-current`，確認主目錄在 `main`
- **嚴禁直接 push 到 main**

## 安裝與更新流程

### 首次安裝（本地目錄掛載）

```bash
/plugin marketplace add /Users/terrychen/Documents/Github/jurislm/jurislm-tools
/plugin install jurislm-tools@coolify
/plugin install jurislm-tools@hetzner
/plugin install jurislm-tools@langfuse
/plugin install jurislm-tools@higgsfield
/plugin install jurislm-tools@repo-standards
/plugin install jurislm-tools@podcast-to-blog
/plugin install jurislm-tools@codebase-sync
/plugin install jurislm-tools@learn-eval
/plugin install jurislm-tools@jt-flow
/reload-plugins
```

遠端安裝（非本地掛載）：`/plugin marketplace add https://github.com/jurislm/jurislm-tools.git`，再逐一 `/plugin install jurislm-tools@<name>`。

### 本地更新（已掛載本地目錄）

```text
.claude/worktrees/develop 修改 → commit + push → PR develop→main → merge
→ git pull origin main（在主目錄根目錄執行，主目錄本就在 main 分支）→ /reload-plugins
```

`git pull` 是必要步驟：plugin 從主目錄本地讀取，merge 只更新遠端，主目錄仍需 pull 才會同步。不需要 `/plugin marketplace update` 或重新安裝。

### 確認掛載來源

```bash
cat ~/.claude/plugins/known_marketplaces.json | jq '.["jurislm-tools"].source'
# "directory" = 本地掛載，"github" = 遠端
```

## GitHub 操作提醒

- 建立 GitHub issue 或 PR 時，記得設定 `assignees` 與 `labels`

## 注意事項

- **版本號禁止手動修改**：交由 Release Please 管理
- **`coolify` 必須是 `marketplace.json` plugins 陣列第一個元素**（見上方版本管理章節）
- **環境變數必須在 `~/.zshenv`**：MCP Server 是非互動式子進程，不 source `~/.zshrc`
- **description 語言**：使用繁體中文
- **工具數需手動同步**：plugin 表格的工具數跨 repo 引用，修改任一 MCP repo 後需更新本檔案與對應 `plugin.json` / `marketplace.json` description。目前 `marketplace.json` 內 `hetzner` 的 description 仍寫「17 個 MCP 工具」，與 `plugins/hetzner/.claude-plugin/plugin.json`（42 個）不一致——修改 hetzner 相關內容時應一併修正。
  - Coolify：`grep -c "server.tool" ../coolify-mcp/src/lib/mcp-server.ts`
  - Hetzner：`grep -c '"hetzner_' ../hetzner-mcp/src/tools/*.ts`
  - Langfuse：`grep -c "server.tool" ../langfuse-mcp/src/index.ts`
- **`README.md` / `.github/copilot-instructions.md` 已過時**：兩者仍描述精簡前、單一 `jt` plugin 的舊架構（`plugins/jurislm-tools/`、`/jt:*` 指令），與目前 9-plugin 拆分後的實際結構不符。以本檔案與 `.claude-plugin/marketplace.json` 為準；有餘力時可一併更新。
