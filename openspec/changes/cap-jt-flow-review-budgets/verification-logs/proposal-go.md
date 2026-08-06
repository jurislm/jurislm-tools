# Proposal GO record

- **Approval status**: GO
- **Change identifier**: `cap-jt-flow-review-budgets`
- **Proposal path**: `openspec/changes/cap-jt-flow-review-budgets/proposal.md`
- **Issue identifier**: [jurislm/jurislm-tools#187](https://github.com/jurislm/jurislm-tools/issues/187)
- **Target repository**: `jurislm/jurislm-tools`
- **Approved scope**: Cap local `superpowers:requesting-code-review` at 3 total
  runs per PR/change (initial + up to 2 fix-driven reruns, no 4th run); add
  Codex as a third external reviewer capped at one review per PR/change,
  contingent on the account-level 審查觸發條件 = 開啟 PR precondition, with no
  active trigger action and no CodeRabbit-style pre-authorization/disclosure
  gate; CodeRabbit's and Copilot's existing rules unchanged. Full detail in
  `docs/superpowers/specs/2026-08-06-jt-flow-review-budget-caps-design.md`
  and this change's `proposal.md`/`design.md`/`specs/`/`tasks.md`.
- **Proposal GO evidence**: User message "go" in this session, immediately
  following an assistant message that presented the proposal/design/specs/
  tasks summary and explicitly asked "review 一下...沒問題就請 GO". The
  proposal itself, and the design doc it is based on, went through multiple
  rounds of explicit user confirmation before this point (local-review cap
  value, Codex trigger/budget/authorization model, each re-derived from
  verified evidence — see design.md's Decisions section).
- **CodeRabbit consent status**: Not obtained for this proposal. This
  conversation was not routed through an explicit invocation of the
  `jt-flow-one` Skill, and the proposal summary presented for GO did not
  include the CodeRabbit App/CLI data-scope disclosure text required by this
  repository's authorization contract for general-intent-routed runs. Per
  that contract, CodeRabbit use for this change's eventual PR review must be
  treated as a missing-required-permission pause — disclosure and consent
  must be obtained explicitly when the review step is reached, not assumed
  from this GO.
