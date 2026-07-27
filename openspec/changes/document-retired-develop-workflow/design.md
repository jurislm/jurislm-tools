## Context

The repository uses feature branches and pull requests targeting `main`.
`develop` had no CI or deployment binding and has now been retired after its
tip was preserved on an archive branch. The root README is user-facing, while
the root CLAUDE file is the project-specific agent contract. Both must describe
the same current branch model without turning the entry documents into a
historical migration log.

The approved scope is documentation-only: `README.md` and `CLAUDE.md`.

## Goals / Non-Goals

**Goals:**

- Make both entry documents explicitly state that feature branches target
  `main` and that the repository does not maintain `develop`.
- Keep the README concise and the CLAUDE guidance operational.
- Verify both document syntax and the external branch-state claim.

**Non-Goals:**

- Change plugin behavior, CI workflows, dependencies, versions, or releases.
- Document the archive branch as an active workflow surface.
- Correct unrelated stale context in `openspec/config.yaml`.
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

Markdown and repository structure will be checked with `npm run validate` and
`claude plugin validate .`. The branch claim will be checked separately with a
GitHub remote readback. A passing documentation check alone does not prove the
remote branch state.

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
2. Validate Markdown, repository integrity, plugin metadata, and native plugin
   structure.
3. Confirm the remote has no `develop` head.
4. If validation fails, revert only the two documentation edits; no runtime or
   data rollback is required.

## Open Questions

None.

