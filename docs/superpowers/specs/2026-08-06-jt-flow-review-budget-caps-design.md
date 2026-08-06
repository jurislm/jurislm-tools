# JT Flow Review Budget Caps Design

Closes #187

## Goal

Give the local Superpowers review an explicit numeric ceiling instead of an
unbounded batch model, and add Codex as a third external reviewer channel
alongside CodeRabbit and Copilot — bounded where a budget is meaningful and
enforceable, unbounded where it is not. The prior policy (established by
`2026-07-25-jt-flow-review-orchestration`) left the local Superpowers review
uncapped: any accepted finding that changed code started a new batch eligible
for another review, with no ceiling on how many batches could occur.

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
triggered by `@codex review` mentions or an "automatic reviews" setting;
distinct from the self-hosted `openai/codex-action` GitHub Action, which is
out of scope) — is added as a third external reviewer with **no numeric
budget**. This is deliberately unlike CodeRabbit and Copilot.

Evidence gathered before finalizing this section:

- The `chatgpt-codex-connector` GitHub App is already installed org-wide on
  `jurislm` (`repository_selection: all`), the same installation model as
  `coderabbitai`. Authorization for Codex to read repository content already
  exists at the platform level, independent of `jt-flow-one`.
- This repository's own PR history shows Codex re-reviewing multiple times
  within a single PR (5 reviews across one PR, each landing roughly 3 minutes
  after a push), confirming automatic reviews re-trigger on every push rather
  than firing once at PR creation like Copilot. Official docs only document
  the "opened" trigger and do not mention this behavior.

Consequences for the policy:

- **No trigger action and no budget**: `jt-flow-one` never sends `@codex
  review` and never checks or waits on Codex. Because the platform re-fires
  automatically and unpredictably, an "at most N" ceiling cannot be enforced
  or meaningfully claimed, so none is written.
- **No pre-authorization or disclosure section**: unlike CodeRabbit, `jt-flow-
  one` takes no action that causes Codex to read or receive repository data —
  the org-level installation and its automatic-review setting made that
  decision before this workflow runs. The CodeRabbit disclosure/consent gate
  exists specifically because the workflow actively requests that review;
  since Codex is never actively requested, that gate does not apply, the same
  way it never applied to Copilot.
- **Findings are still evaluated, never ignored**: whenever Codex posts a
  review, its findings go through the existing rule that already covers all
  reviewer feedback — `superpowers:receiving-code-review` evaluates every
  finding, from any source, before it is accepted or rejected. No new rule is
  needed for this; "no budget" means the workflow does not track or limit
  occurrences, not that it disregards content that arrives.

## File Impact

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — replace the local-review
  batch paragraph with the 3-run cap; update the Queue execution contract's
  "one Superpowers review per code batch" wording; add a new Codex paragraph
  next to the Copilot paragraph in the PR/review step, stating no trigger
  action, no budget, and standard `receiving-code-review` handling of
  whatever Codex posts. Do not extend the CodeRabbit pre-authorization
  section to Codex.
- `plugins/jt-flow/README.md` — mirror the same paragraphs.
- `CLAUDE.md` (repository root) — mirror the same paragraphs in the review
  checklist / policy guidance sections.
- `openspec/specs/jt-flow-review-orchestration/spec.md` — rewrite the "Local
  review is portable and change-batch scoped" requirement to state the 3-run
  cap instead of unlimited batches; add a requirement (or scenario) stating
  Codex has no review budget and is handled as ordinary reviewer feedback,
  distinct from the "External reviewers have one effective review budget"
  requirement that continues to govern only CodeRabbit and Copilot.
- `scripts/jt-flow-review-policy.test.mjs` — replace the batch-based
  assertions with 3-run-cap assertions; add assertions that the Codex
  paragraph states no budget/no trigger action, rather than mirroring the
  Copilot "at most one" assertions.

## Non-goals

- Changing CodeRabbit's or Copilot's existing trigger or authorization rules.
- Integrating `openai/codex-action` (the self-hosted GitHub Actions variant).
- Building any mechanism to count, cap, or force Codex's automatic-review
  triggers from within the repository — confirmed unbounded by observed
  behavior, so no such mechanism is attempted.

## Risk Accepted

Dropping the uncapped local-review batching in favor of a 3-run ceiling means
a finding fix that introduces a new bug on run 4+ will not be caught by
another local review — only by tests, CI, or PR review. This trade-off is
intentional and user-confirmed.
