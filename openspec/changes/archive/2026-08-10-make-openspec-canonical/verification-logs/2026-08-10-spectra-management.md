# Spectra management migration

- Scope: `make-openspec-canonical`, `update-repo-standards-flat-ci-templates`,
  `convert-jt-flow-commands-to-skills`, and `rename-jt-flow-single-skill`.
- `.spectra.yaml` now enables the Spectra TDD, audit, parallel-task, Claude
  command, and worktree settings.
- `spectra update --force --no-color` generated the repository's `/spectra-*`
  command and Skill entry points, and the repository guidance now declares
  them canonical for proposal work.
- In an isolated clone of this completed branch, `spectra list --json`
  returned `{"changes":[]}` and `spectra validate --all --strict --json`
  returned `[]`; the four proposal directories are present under the dated
  OpenSpec archive.
- The original archive commits are preserved as-is. This migration does not
  retroactively claim that their earlier archive commands were Spectra
  commands; from this commit onward, proposal creation, implementation,
  verification, archiving, and change-scoped commits use Spectra.
