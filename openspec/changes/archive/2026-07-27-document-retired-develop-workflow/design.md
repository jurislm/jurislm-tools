## Context

The repository uses feature branches and pull requests targeting `main`.
`develop` had no CI or deployment binding and has now been retired after its
tip was preserved on an archive branch. The root README is user-facing, while
the root CLAUDE file is the project-specific agent contract. Both must describe
the same current branch model without turning the entry documents into a
historical migration log.

The initial approved scope covered `README.md` and `CLAUDE.md`. PR review found
that the active OpenSpec project context still injects the retired branch model,
so the proposed scope now includes only the branch-workflow lines in
`openspec/config.yaml`.

## Goals / Non-Goals

**Goals:**

- Make both entry documents explicitly state that feature branches target
  `main` and that the repository does not maintain `develop`.
- Make active OpenSpec instructions use the same branch model.
- Keep the README concise and the CLAUDE guidance operational.
- Verify document syntax, OpenSpec validity, and the external branch-state
  claim.

**Non-Goals:**

- Change plugin behavior, CI workflows, dependencies, versions, or releases.
- Document the archive branch as an active workflow surface.
- Correct unrelated plugin-count, plugin-type, or dependency context in
  `openspec/config.yaml`.
- Rewrite either entry document or duplicate every package script.

## Decisions

### Use a narrow current-state edit

Add one explicit `develop` sentence to the existing README development
paragraph and replace the stale CLAUDE sentence in its existing GitHub Flow
section.

This is preferred over a broad rewrite because the audit found the plugin list,
paths, versions, installation commands, and validation overview already match
the repository.

### Keep history out of the entry documents

The entry documents will state that `develop` is not maintained, but will not
name `archive/develop-retired-2026-07-27`. Git and the pre-proposal inventory
retain that history; contributor guidance should describe only the supported
workflow.

This is preferred over documenting the archive branch because doing so could
make the archived ref appear to be a supported integration branch.

### Validate local content and remote state independently

The final local validation set is `npm ci`, `npm run validate`,
`claude plugin validate .`, and
`openspec validate document-retired-develop-workflow --strict`. The branch claim
will be checked separately with a GitHub remote readback. A passing
documentation check alone does not prove the remote branch state.

### Correct the instruction source, not only its consumers

Replace the `develop` workflow in `openspec/config.yaml` with the verified
feature branch → pull request → `main` model. This is required because repo-local
OpenSpec Skills apply that context when generating future artifacts.

This is preferred over leaving the discrepancy in a verification log because a
recorded contradiction would still be injected into future work.

## Risks / Trade-offs

- **Risk: the archive branch is mistaken for an integration branch** →
  Do not mention it in README or CLAUDE; keep it only as recovery evidence.
- **Risk: broader audit findings expand a two-file change** → Record unrelated
  findings in the inventory and leave them unchanged.
- **Trade-off: package scripts remain summarized rather than individually
  documented** → Preserve the current readable entry documents because the
  umbrella validation command is accurate and sufficient.

## Migration Plan

1. Edit the two existing GitHub Flow passages.
2. Edit only the branch-workflow context in `openspec/config.yaml`.
3. Run the full local validation set.
4. Confirm the remote has no `develop` head.
5. If validation fails, revert the three narrow documentation/configuration
   edits; no runtime or data rollback is required.

## Open Questions

None.
