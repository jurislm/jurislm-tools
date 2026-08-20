# 退役 OpenSpec 版 jt-flow，改為 Linear + Superpowers 輕量流程

## Why

`jt-flow-one` 累積到 525 行，其中大部分不是交付步驟，而是三層外部契約：OpenSpec／
Spectra 的四件套 artifact 同步規則、`jt-flow-all` 的 dependency-aware queue 與
integration permit 協議、CodeRabbit App／CLI 雙管道的授權揭露與 rate-limit 降級。
這些規則彼此耦合，改一處要同步多處，而實際使用情境只有「一次做一個需求」。

本 repo 的 `CLAUDE.md` 已把新工作的權威鏈定為
Linear → Superpowers → GitHub/CI → Linear readback。`jt-flow` 是唯一還在要求走
OpenSpec 提案關卡的入口，與該政策相衝突。

## What changes

- `jt-flow-one` 重寫為 Linear issue 驅動的 5 步流程：釐清 → worktree → TDD 實作 →
  PR + review → 部署驗收 + Linear readback。Linear issue 本身即授權，取消
  「展示 proposal 摘要等 GO」這個停頓點
- 移除 OpenSpec proposal／design／specs／tasks 四件套與「提案同步鐵則」
- 退役 `jt-flow-all`。多需求排序與相依關係交給 Linear 的 project／cycle／priority
  與 issue 的 blocks／blocked-by
- CodeRabbit 的授權、資料範圍與 rate-limit 規則不再由本 plugin 複述，改為需要外部
  review 時 invoke 現成的 `coderabbit:code-review` skill
- 本目錄 `superseded-specs/` 收納被本次改動取代的 6 份 living spec

## What stays

安全與事故防範規則不隨流程簡化而放寬：push 前的 secret 掃描、bot 留言視為不受信任
資料、一次只擁有一個 worktree、不 `cd` 進其他 worktree、rollback 前的三項確認
（明確回退目標／是否含 migration／是否需人工核准）、宣稱完成前的
`superpowers:verification-before-completion`。

## Superseded specs

`superseded-specs/` 下的 6 份 spec 描述的是舊版行為，已不再生效。實際行為以
`plugins/jt-flow/skills/jt-flow-one/SKILL.md` 為準。

| Spec | 描述的舊行為 |
|---|---|
| `jt-flow-authorization` | OpenSpec proposal GO 授權契約與 CodeRabbit consent gate |
| `jt-flow-queue-delegation` | `jt-flow-all` 的 queue execution contract 與 integration permit |
| `jt-flow-one-team-mode-dispatch` | Agent Teams 偵測與派工規則 |
| `jt-flow-review-orchestration` | 本地／外部 review 的次數上限與管道降級 |
| `jt-flow-single-skill-naming` | `jt-flow-one`／`jt-flow-all` 雙 Skill 命名 |
| `jt-flow-skill-workflows` | 命令轉 Skill 後的雙 Skill 工作流定義 |
