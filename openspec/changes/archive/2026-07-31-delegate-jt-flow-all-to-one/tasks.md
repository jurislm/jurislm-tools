## 1. Delegate single-request delivery

- [x] 1.1 Replace the duplicated Phase 2–9 lifecycle in `plugins/jt-flow/skills/jt-flow-all/SKILL.md` with an ordered direct-delegation loop to `jt-flow-one`.
- [x] 1.2 Preserve queue inventory, prioritization, queue-order GO, one-at-a-time progress, and per-item pause behavior in `plugins/jt-flow/skills/jt-flow-all/SKILL.md`.
- [x] 1.3 Preserve explicit queue-invocation CodeRabbit authorization through `plugins/jt-flow/skills/jt-flow-all/SKILL.md` and `plugins/jt-flow/skills/jt-flow-one/SKILL.md` without inferring consent from internal delegation.
- [x] 1.4 Require an approved tracking issue and `Tracks:#<n>` relationship before queueing an active change that lacks an issue identifier.

## 2. Validate workflow ownership

- [x] 2.1 Run `npm ci`, `npm run validate`, `claude plugin validate .`, Markdown linting, and `openspec validate delegate-jt-flow-all-to-one --strict`.
- [x] 2.2 Verify `jt-flow-all` contains no duplicated single-request lifecycle phases and directly delegates each confirmed queue item to `jt-flow-one`.
