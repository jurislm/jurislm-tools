# PR Review Feedback Disposition

## Codex review

- `jt-flow` still allowed GitHub Issue context while the root contract prohibited
  it. Fixed by making current `jt-flow-one` and `jt-flow-all` Spectra-only and
  adding authorization and queue deltas.
- Adoption targets could not resolve the source-only review contract. Fixed by
  packaging `review-orchestration-template.md` and making target `CLAUDE.md`
  canonical.
- A new target could not meet the active-change prerequisite. Fixed by requiring
  `spectra init` before tracking when initialization is absent.

## CodeRabbit review

- `jt-flow-all` ownership was ambiguous. Fixed by stating that it coordinates
  the queue only; delegated `jt-flow-one` owns and invokes local review.
- Object-level secret preflight was not adopted. The approved change adds no
  credential path or secret-scanning contract, and no repository scanner command
  is configured. Adding that universal workflow would exceed this documentation
  correction's approved scope.
- MD029 suppression was not adopted. The repository command uses
  `markdownlint-cli@0.49.1`; `npm run validate` passes with the existing
  intentional global checklist numbering. The reported warning came from a
  different CodeRabbit `markdownlint-cli2` environment.

## Verification

- `npm run validate` passed with 169 tests.
- `claude plugin validate .`, strict Spectra validation, Spectra analysis, and
  `git diff --check` passed after the accepted correction.
