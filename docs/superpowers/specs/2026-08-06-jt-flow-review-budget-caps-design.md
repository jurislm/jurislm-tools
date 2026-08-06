# JT Flow Review Budget Caps Design

Closes #187

## Goal

Give the local Superpowers review an explicit numeric ceiling instead of an
unbounded batch model, and add Codex as a third external reviewer channel
alongside CodeRabbit and Copilot, each capped at one review. The prior policy
(established by `2026-07-25-jt-flow-review-orchestration`) left the local
Superpowers review uncapped: any accepted finding that changed code started a
new batch eligible for another review, with no ceiling on how many batches
could occur.

## Review Policy

### Local Superpowers review

`superpowers:requesting-code-review` may run at most **3 times** for the
entire PR or change, not per batch without limit. The first run happens once
the implementation is ready for review; each of up to two further runs is
triggered only by an accepted finding that changed code. After the 3rd run,
no further local review occurs even if new findings appear — later
verification relies on tests, CI, and PR review instead. A review is not
repeated when no code changed since the last one, regardless of how many of
the 3 runs remain.

`superpowers:receiving-code-review` remains the finding-evaluation protocol
for every finding, local or external, and does not count as a review.

### CodeRabbit review

Unchanged from `jt-flow-review-orchestration`: at most one effective review
across the GitHub App and CLI channels combined, per PR or change. Auto-review
stays disabled; the App is requested explicitly once, and the CLI is used at
most once as a fallback only after the App's sole request reaches a terminal
outcome without producing a real review.

### GitHub Copilot review

Unchanged: at most one review per PR or change, auto-triggered by GitHub, no
manual re-request, quota exhaustion may be skipped.

### Codex review (new)

Codex — the ChatGPT/OpenAI GitHub code-review App (`chatgpt-codex-connector`,
triggered by `@codex review` mentions or an automatic-review setting;
distinct from the self-hosted `openai/codex-action` GitHub Action, which is
out of scope) — is added as a third external reviewer capped at **one review
per PR or change**, the same ceiling as CodeRabbit and Copilot, contingent on
an account-level setting confirmed below.

Evidence gathered before finalizing this section:

- The `chatgpt-codex-connector` GitHub App is already installed org-wide on
  `jurislm` (`repository_selection: all`), the same installation model as
  `coderabbitai`. Authorization for Codex to read repository content already
  exists at the platform level, independent of `jt-flow-one`.
- Codex code review settings (`chatgpt.com/codex/cloud/settings/code-review`,
  inspected 2026-08-06) expose a **審查觸發條件 / review trigger condition**
  control with three mutually exclusive options: 開啟 PR (review once, when
  the PR opens), 每次推播 (review again on every push), and 智慧型觸發器
  試驗性 (experimental, Codex decides). The account default and the
  `jurislm/jurislm-tools` repository override (currently "依個人設定" /
  inherits the account default) are both set to 開啟 PR — once per PR, the
  same cadence as Copilot.
- This contradicts earlier observed history: this repository's PR #171 shows
  Codex reviewing 5 times in one PR, each roughly 3 minutes after a push,
  which matches 每次推播 behavior, not 開啟 PR. Whether the setting was
  different on 2026-07-27 (and has since been changed) or the platform
  occasionally deviates from the configured trigger is unresolved and cannot
  be verified retroactively.

Consequences for the policy:

- **One-time environment precondition, not a repo-committed check**: before
  relying on the one-review budget, confirm the 審查觸發條件 for the target
  repository (or its inherited account default) reads 開啟 PR, not 每次推播
  or 智慧型觸發器. This lives in Codex account/org settings, not a file in
  this repository, so `jt-flow-one` cannot verify it programmatically the way
  `scripts/jt-flow-review-policy.test.mjs` checks `.coderabbit.yaml` — it is
  a manual check analogous to confirming the CodeRabbit CLI is installed.
- **No trigger action**: `jt-flow-one` never sends `@codex review` and never
  actively requests or waits for a Codex review; whatever the platform posts
  automatically is what it gets.
- **No pre-authorization or disclosure section**: unlike CodeRabbit, `jt-flow-
  one` takes no action that causes Codex to read or receive repository data —
  the org-level installation and its automatic-review setting made that
  decision before this workflow runs. The CodeRabbit disclosure/consent gate
  exists specifically because the workflow actively requests that review;
  since Codex is never actively requested, that gate does not apply, the same
  way it never applied to Copilot. This holds regardless of the trigger
  setting or the budget question above.
- **Findings are still evaluated, never ignored**: whenever Codex posts a
  review — the expected single one, or an unexpected extra one given the
  unresolved PR #171 discrepancy — its findings go through the existing rule
  that already covers all reviewer feedback: `superpowers:receiving-code-
  review` evaluates every finding, from any source, before it is accepted or
  rejected. This is the safety net for the residual risk that the configured
  cadence does not hold in practice.

## File Impact

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — replace the local-review
  batch paragraph with the 3-run cap; update the Queue execution contract's
  "one Superpowers review per code batch" wording; add a new Codex paragraph
  next to the Copilot paragraph in the PR/review step, stating the one-review
  cap, the 審查觸發條件 = 開啟 PR precondition check, no active trigger
  action, and standard `receiving-code-review` handling of whatever Codex
  posts (including an unexpected extra review). Do not extend the CodeRabbit
  pre-authorization/disclosure section to Codex.
- `plugins/jt-flow/README.md` — mirror the same paragraphs.
- `CLAUDE.md` (repository root) — mirror the same paragraphs in the review
  checklist / policy guidance sections.
- `openspec/specs/jt-flow-review-orchestration/spec.md` (the living spec) is
  NOT edited during implementation — per this repository's own OpenSpec
  convention (the file's git history shows it was previously touched only at
  the prior change's archive commit, never during that change's
  implementation), it stays at deployed behavior until this change is
  archived. The 3-run cap and the Codex requirement extension are carried
  instead by the change's own delta spec at
  `openspec/changes/<change-name>/specs/jt-flow-review-orchestration/spec.md`,
  with a scenario for the 審查觸發條件 precondition check and a scenario for
  handling an extra review that arrives despite that precondition; the delta
  gets folded into the living spec when the change is archived
  (`opsx:archive`/`opsx:sync`).
- `scripts/jt-flow-review-policy.test.mjs` — replace the batch-based
  assertions with 3-run-cap assertions; add Codex assertions parallel to the
  existing Copilot ones, plus an assertion for the precondition-check wording.

## Non-goals

- Changing CodeRabbit's or Copilot's existing trigger or authorization rules.
- Integrating `openai/codex-action` (the self-hosted GitHub Actions variant).
- Building any repository-committed mechanism to verify or force the Codex
  審查觸發條件 setting — it lives in account/org settings outside this
  repository, so the check stays a documented manual precondition.

## Risk Accepted

Dropping the uncapped local-review batching in favor of a 3-run ceiling means
a finding fix that introduces a new bug on run 4+ will not be caught by
another local review — only by tests, CI, or PR review. This trade-off is
intentional and user-confirmed.
