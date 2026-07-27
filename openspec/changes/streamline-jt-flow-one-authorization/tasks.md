## 1. Protect the authorization contract

- [x] 1.1 Add a focused failing policy test in
  `scripts/jt-flow-authorization-policy.test.mjs` for explicit invocation,
  proposal GO, automatic post-GO continuation, bounded exceptions, and queue
  delegation.

## 2. Update the JT Flow Skills

- [x] 2.1 Add the positive authorization and bounded-exception contracts to
  `plugins/jt-flow/skills/jt-flow-one/SKILL.md`.
- [x] 2.2 Align delegated-item continuation in
  `plugins/jt-flow/skills/jt-flow-all/SKILL.md`.
- [x] 2.3 Synchronize `plugins/jt-flow/README.md` and `CLAUDE.md` with the
  normal-path checkpoint contract.
- [x] 2.4 Persist proposal GO evidence in
  `openspec/changes/<change>/verification-logs/proposal-go.md` and pass its
  matching fields through `plugins/jt-flow/skills/jt-flow-all/SKILL.md`.

## 3. Verify

- [x] 3.1 Pass the focused policy test and `npm run validate`.
- [x] 3.2 Pass `claude plugin validate .` and strict OpenSpec validation.
- [x] 3.3 Record verification evidence under
  `openspec/changes/streamline-jt-flow-one-authorization/verification-logs/`.
