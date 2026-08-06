# JT Flow Review Budget Caps Design

Closes #187

## Goal

Bound every reviewer `jt-flow-one` uses — local and external — with an explicit
numeric budget, and add Codex as a third external reviewer channel alongside
CodeRabbit and Copilot. The prior policy (established by
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

Codex — the ChatGPT/OpenAI GitHub code-review App (`@codex review` mentions,
or an "automatic reviews" setting; distinct from the self-hosted
`openai/codex-action` GitHub Action, which is out of scope) — is added as a
third external reviewer, capped at one review per PR or change. It follows
the Copilot trigger pattern: purely automatic, no manual `@codex review`
request, and no verification that "automatic reviews" is enabled or disabled
— research found no repository-committed config file that controls this
setting for the App integration (unlike `.coderabbit.yaml` for CodeRabbit),
only an account/organization-level toggle in Codex settings.

Codex reuses CodeRabbit's pre-authorization contract: explicitly invoking or
naming `jt-flow-one` counts as pre-authorization to use Codex for PR review;
routing from general intent alone requires disclosing Codex's data scope in
the proposal summary and obtaining consent at the same proposal GO.

**Known limitation**: whether Codex's automatic review re-triggers on every
push (like the `synchronize` trigger in the unrelated `openai/codex-action`
GitHub Actions example) or only once at PR creation (like Copilot) is not
confirmed by official documentation. This is accepted as a known limitation
rather than blocked on: the "at most one" budget governs whether the workflow
actively requests or waits for another Codex review, not whether it evaluates
content that arrives. If Codex fires again due to platform behavior outside
the workflow's control, findings still go through the pre-existing rule that
applies to all reviewer feedback — `superpowers:receiving-code-review`
evaluates every finding, from any source, before it is accepted or rejected.
No new rule is needed for this case; the workflow does not ignore uninvited
findings, and it does not treat an uninvited review as license to actively
request or wait for another one.

## File Impact

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — replace the local-review
  batch paragraph with the 3-run cap; extend the CodeRabbit pre-authorization
  section (or add a parallel Codex subsection) to cover Codex; update the
  Queue execution contract's "one Superpowers review per code batch" wording;
  add Codex handling next to the Copilot paragraph in the PR/review step.
- `plugins/jt-flow/README.md` — mirror the same paragraphs.
- `CLAUDE.md` (repository root) — mirror the same paragraphs in the review
  checklist / policy guidance sections.
- `openspec/specs/jt-flow-review-orchestration/spec.md` — rewrite the "Local
  review is portable and change-batch scoped" requirement to state the 3-run
  cap instead of unlimited batches; extend "External reviewers have one
  effective review budget" to include Codex.
- `scripts/jt-flow-review-policy.test.mjs` — replace the batch-based
  assertions with 3-run-cap assertions; add Codex assertions parallel to the
  existing Copilot assertions.

## Non-goals

- Changing CodeRabbit's or Copilot's existing trigger or authorization rules.
- Integrating `openai/codex-action` (the self-hosted GitHub Actions variant).
- Building any mechanism to verify or force Codex's "automatic reviews"
  setting from within the repository — documented as a known limitation
  instead.

## Risk Accepted

Dropping the uncapped local-review batching in favor of a 3-run ceiling means
a finding fix that introduces a new bug on run 4+ will not be caught by
another local review — only by tests, CI, or PR review. This trade-off is
intentional and user-confirmed.
