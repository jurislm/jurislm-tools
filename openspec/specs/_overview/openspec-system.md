# OpenSpec System Overview

## Purpose

描述 `jurislm-tools` repo 內建的 OpenSpec workflow system：10 個 skill（`.claude/skills/openspec-*/`）與 10 個 command（`.claude/commands/opsx/`）所構成的規格驅動開發流程，以及 `openspec/` 目錄的結構與設計意圖。

## System Context

OpenSpec 是一個以 artifact 為中心的規格管理系統，強制開發者在動手寫程式之前，先透過一系列結構化文件（artifacts）釐清需求與設計。本 system 存在於 jurislm-tools repo 的 `.claude/` 目錄，不屬於任何 marketplace plugin，因此不會出現在 `/plugin list` 中。

## 目錄結構

```
openspec/
├── config.yaml          ← schema、project context 與 workflow rules
├── specs/               ← 已完成並存活的 spec 文件（本文件所在位置）
│   ├── _overview/
│   ├── ci-platform/
│   ├── content/
│   ├── development-dependency-security/
│   ├── docs-and-standards/
│   ├── github-flow-entry-documentation/
│   ├── infra/
│   ├── learning/
│   ├── observability/
│   └── plugin-packaging-integrity/
└── changes/             ← 進行中的 change artifacts
    └── archive/         ← 已完成並封存的 changes
```

## Artifact Workflow（spec-driven schema）

OpenSpec 預設採用 `spec-driven` schema，每個 change 依序產出以下 artifacts：

```
proposal → design → specs → tasks
```

| Artifact | 說明 |
|----------|------|
| proposal | 說明要做什麼、為什麼、Non-goals |
| design | 技術設計與架構決策 |
| specs | GIVEN/WHEN/THEN 格式的行為規格 |
| tasks | 拆解為可執行的實作步驟 |

每個 artifact 需前一個完成才可開始（dependency chain）。

## Slash Commands（opsx:*）

| Command | 用途 |
|---------|------|
| `/opsx new` | 建立新 change |
| `/opsx continue` | 繼續未完成的 change，產出下一個 artifact |
| `/opsx ff` | Fast-forward，一次產出所有 artifacts |
| `/opsx apply` | 從 tasks artifact 開始實作 |
| `/opsx verify` | 驗證實作是否符合 specs artifact |
| `/opsx archive` | 封存單一 change |
| `/opsx bulk-archive` | 批次封存多個 changes |
| `/opsx explore` | 進入探索模式（思考夥伴，不產出 artifact） |
| `/opsx sync` | 將 delta spec 從 change 同步回 `openspec/specs/` |
| `/opsx onboard` | 引導式 onboarding，完整走一次 workflow |

## Skills（.claude/skills/openspec-*/）

每個 command 背後有對應的 skill，skill 定義實際執行邏輯：

| Skill | 對應 Command |
|-------|------------|
| openspec-new-change | /opsx new |
| openspec-continue-change | /opsx continue |
| openspec-ff-change | /opsx ff |
| openspec-apply-change | /opsx apply |
| openspec-verify-change | /opsx verify |
| openspec-archive-change | /opsx archive |
| openspec-bulk-archive-change | /opsx bulk-archive |
| openspec-explore | /opsx explore |
| openspec-sync-specs | /opsx sync |
| openspec-onboard | /opsx onboard |

## config.yaml

`openspec/config.yaml` 宣告 `spec-driven` schema，並提供目前 marketplace、版本管理、branch workflow、spec 結構與 proposal/tasks 規則的 project context。它是 artifact 產製時的工作上下文，不是 marketplace plugin manifest。

```yaml
schema: spec-driven

context: |
  Tech stack: Claude Code Plugin Marketplace (YAML/Markdown only, no compilation step)
  Domain: jurislm-tools — 9-plugin marketplace for JurisLM development workflows
  Branch workflow: feature worktree → PR → main.
```

## 與 Marketplace Plugins 的關係

OpenSpec system 不是 marketplace plugin，但它管理的 specs 描述所有 marketplace plugins 的設計意圖。設計邊界：

- **OpenSpec 管什麼**：plugin 的 Purpose、Requirements、行為規格、實作任務
- **OpenSpec 不管什麼**：plugin 的實際執行邏輯（那些在 SKILL.md / command/*.md 中）

## 現況

- `openspec/specs/` 目錄於 2026-05-02 完成初始填充（本批次 spec 寫入）
- `openspec/changes/` 保存目前進行中的 change artifacts；完成並封存的 artifacts 位於 `openspec/changes/archive/`
- `openspec list` 與 `openspec status` 是 active change 狀態的即時來源；本文件只描述目錄與流程語意，不固定 active change 數量
