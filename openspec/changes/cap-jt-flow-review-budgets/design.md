## Context

`jt-flow-one`'s review orchestration (`openspec/specs/jt-flow-review-orchestration/spec.md`,
established by `2026-07-25-jt-flow-review-orchestration`) currently leaves the
local `superpowers:requesting-code-review` mechanism uncapped: each accepted
finding that changes code starts a new "batch" eligible for another review,
with no ceiling on how many batches can occur. CodeRabbit and Copilot are
already capped at one effective review per PR/change. Codex
(`chatgpt-codex-connector`) is already installed org-wide on `jurislm`
(`repository_selection: all`, confirmed via `gh api orgs/jurislm/installations`)
and already reviews PRs in this repository automatically, but `jt-flow-one`
has no policy for it at all.

Full research and rationale for every decision below is recorded in
`docs/superpowers/specs/2026-08-06-jt-flow-review-budget-caps-design.md`,
produced during brainstorming with the user before this proposal existed.

## Goals / Non-Goals

**Goals:**
- Replace the unbounded local-review batch model with a hard 3-run ceiling.
- Add Codex as a third external reviewer with a review budget consistent with
  CodeRabbit and Copilot, without inventing controls the platform doesn't
  expose to this repository.

**Non-Goals:**
- Changing CodeRabbit's or Copilot's existing trigger, budget, or
  authorization rules.
- Integrating `openai/codex-action` (the separate, self-hosted GitHub Actions
  variant of Codex review) — only the ChatGPT/OpenAI GitHub App integration
  is in scope.
- Building a repository-committed mechanism (a config file `jt-flow-one` can
  read, analogous to `.coderabbit.yaml`) to verify or force Codex's account-
  level review-trigger setting.

## Decisions

**Local review: 3-run ceiling, not unlimited batches.** The user initially
asked for "unlimited reruns" to be capped, considered 3, then 1, then settled
on 3 after weighing that dropping local-review safety entirely (1 run total)
removes the ability to catch a bug a fix itself introduces, while unlimited
reruns has no terminating condition if a reviewer keeps finding new issues.
3 total runs (1 initial + 2 fix-driven reruns) keeps the batch-triggered
rerun model but bounds it, matching the existing "no code change → no rerun"
termination rule.

**Codex budget: one review, gated on a confirmed account setting, not
unlimited and not authorization-gated like CodeRabbit.** Three candidate
designs were evaluated in order:
1. *Mirror CodeRabbit fully* (explicit trigger + pre-authorization/disclosure
   contract) — rejected because Codex's trigger is not something `jt-flow-one`
   ever invokes; there is no action to gate with consent.
2. *Mirror Copilot fully, no budget claim* — the working assumption after
   this repository's PR #171 showed Codex posting 5 reviews in one PR, each
   ~3 minutes after a push, which looked like unbounded automatic re-review.
3. *One review, contingent on a confirmed account setting* (chosen) — after
   logging into `chatgpt.com/codex/cloud/settings/code-review`, the "審查
   觸發條件" (review trigger condition) control was found to be a genuine
   three-way choice (開啟 PR / 每次推播 / 智慧型觸發器), and both the account
   default and the `jurislm/jurislm-tools` override currently read 開啟 PR —
   review once, at PR open, the same cadence as Copilot. PR #171's behavior
   contradicts this and could not be explained retroactively (the setting may
   have differed on 2026-07-27, or the platform occasionally deviates).
   Given the setting genuinely exists and currently reads once-only, claiming
   a one-review budget is more accurate than claiming none — with the
   existing `receiving-code-review` rule as the safety net if the setting
   does not hold in practice.

**No CodeRabbit-style authorization gate for Codex.** The CodeRabbit
disclosure/consent contract exists because `jt-flow-one` actively requests
that review (an agent decision to transmit data). Codex is purely automatic
and org-installed before the workflow runs — the same reasoning that already
exempts Copilot from that gate applies unchanged to Codex, independent of the
budget decision above.

**Precondition is documented, not enforced.** Unlike `.coderabbit.yaml`,
Codex's trigger-condition setting is account/org-level ChatGPT UI state with
no repository-committed artifact to check. `scripts/jt-flow-review-policy.test.mjs`
can only assert that the policy text states the precondition; it cannot
assert the live setting value.

## Risks / Trade-offs

- **Local 3-run ceiling** → a finding fix that introduces a new bug on the
  4th round is not caught by another local review. Mitigation: tests, CI, and
  PR review remain as the downstream safety net; this trade-off is
  user-confirmed and intentional.
- **Codex one-review claim may not hold** → PR #171's unexplained 5-review
  history means the account setting could silently drift or the platform
  could deviate from it. Mitigation: the workflow never actively triggers or
  waits for Codex, and any extra review it posts is still evaluated via
  `receiving-code-review` rather than ignored — the budget statement affects
  what the workflow expects and documents, not what it can technically force.
- **No enforcement mechanism for the Codex precondition** → a future session
  could rely on this policy without the account setting actually being
  开启 PR. Mitigation: the precondition is called out explicitly in the
  living spec and SKILL.md text so it is visible, even though it cannot be
  automated.

## Migration Plan

Documentation-only change (SKILL.md, README.md, root CLAUDE.md, living spec,
and test assertions in `scripts/jt-flow-review-policy.test.mjs`); no runtime
code, data, or release-managed version changes. No rollback complexity beyond
reverting the merged commit.

## Open Questions

None outstanding — all decisions above were resolved with the user before
this proposal was written.
