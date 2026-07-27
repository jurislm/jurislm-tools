## Why

The repository now uses GitHub Flow exclusively and no longer maintains a
`develop` branch, but its entry documentation does not state that consistently.
Synchronizing the two entry documents prevents contributors and agents from
reintroducing the retired branch model. Closes #164.

## What Changes

- Update `README.md` to state that feature branches open pull requests directly
  to `main` and that the repository does not maintain `develop`.
- Update `CLAUDE.md` to remove the stale allowance for a remote `develop`
  branch and make the same current-state workflow explicit.
- Validate the documentation and read back the remote branch state.

## Capabilities

### New Capabilities

- `github-flow-entry-documentation`: Requires the repository entry documents to
  describe the verified feature branch → pull request → `main` workflow without
  presenting `develop` as active or retained.

### Modified Capabilities

None.

## Impact

This is a documentation-only repository workflow clarification affecting
`README.md` and `CLAUDE.md`. It changes no marketplace plugin, runtime behavior,
dependency, release-managed version, CI workflow, or deployment system.

## Non-goals

- Do not change plugin implementation or plugin-specific documentation.
- Do not modify `openspec/config.yaml` or clean unrelated historical artifacts.
- Do not remove or rewrite the archived branch that preserves the retired
  `develop` history.
