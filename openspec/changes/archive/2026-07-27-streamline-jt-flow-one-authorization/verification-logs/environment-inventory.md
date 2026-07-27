# Environment inventory

Date: 2026-07-27

## Repository and workflow

- Repository: `jurislm/jurislm-tools`
- Default branch: `main`
- Working branch: `codex/streamline-jt-flow-one-authorization`
- Remote: `origin`, with matching GitHub fetch and push targets
- OpenSpec: installed under `openspec/`
- Delivery model: feature worktree to PR to `main`; no application deployment
  pipeline

## Existing implementation

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` owns single-request delivery.
- `plugins/jt-flow/skills/jt-flow-all/SKILL.md` owns queue inventory and delegates
  each item to `jt-flow-one`.
- `scripts/jt-flow-review-policy.test.mjs` and
  `scripts/jt-flow-queue-execution.test.mjs` protect review and queue behavior.
- `openspec/specs/jt-flow-review-orchestration/spec.md` protects external review
  budgets and is not relaxed by this change.

## Concurrent and historical changes

- Active `delegate-jt-flow-all-to-one` makes `jt-flow-one` the sole lifecycle
  owner and preserves its approval gates. This change refines those gates but
  does not duplicate lifecycle procedures in `jt-flow-all`.
- Active naming and command-to-Skill changes do not alter authorization
  semantics.
- Archived `use-superpowers-code-review` established CodeRabbit disclosure,
  secret scanning, and one-review limits; those constraints remain unchanged.

## Validation surface

- Focused Node policy tests
- `npm run validate`
- `claude plugin validate .`
- `openspec validate streamline-jt-flow-one-authorization --strict`
