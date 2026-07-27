## 1. Entry document synchronization

- [x] 1.1 Update `README.md` GitHub Flow guidance to state that feature
  branches target `main` and the repository does not maintain `develop`.
- [x] 1.2 Update `CLAUDE.md` GitHub Flow guidance to remove the stale allowance
  for a remote `develop` branch and state the same supported workflow.
- [x] 1.3 Inspect the `README.md` and `CLAUDE.md` diff against the approved
  two-file scope and the `github-flow-entry-documentation` scenarios.

## 2. Validation and evidence

- [x] 2.1 Run `npm ci` against the committed `package-lock.json`.
- [x] 2.2 Run `npm run validate` to check tests, marketplace integrity, version
  synchronization, and Markdown lint for `README.md` and `CLAUDE.md`.
- [x] 2.3 Run `claude plugin validate .` to validate the marketplace using the
  native Claude validator.
- [x] 2.4 Run
  `openspec validate document-retired-develop-workflow --strict`.
- [x] 2.5 Query the `origin` remote and GitHub pull requests to confirm there is
  no active `develop` branch or develop-based pull request.
- [x] 2.6 Record the final validation evidence under
  `openspec/changes/document-retired-develop-workflow/verification-logs/`.

## 3. Active OpenSpec context

- [x] 3.1 Update only the branch-workflow lines in `openspec/config.yaml` to
  describe feature branch → pull request → `main` without `develop`.
- [x] 3.2 Inspect fresh OpenSpec instructions to confirm their returned project
  context no longer directs work through `develop`.
