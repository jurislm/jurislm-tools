## 1. Entry document synchronization

- [x] 1.1 Update `README.md` GitHub Flow guidance to state that feature
  branches target `main` and the repository does not maintain `develop`.
- [x] 1.2 Update `CLAUDE.md` GitHub Flow guidance to remove the stale allowance
  for a remote `develop` branch and state the same supported workflow.
- [x] 1.3 Inspect the `README.md` and `CLAUDE.md` diff against the approved
  two-file scope and the `github-flow-entry-documentation` scenarios.

## 2. Validation and evidence

- [ ] 2.1 Run `npm ci` against the committed `package-lock.json`.
- [ ] 2.2 Run `npm run validate` to check tests, marketplace integrity, version
  synchronization, and Markdown lint for `README.md` and `CLAUDE.md`.
- [ ] 2.3 Run `claude plugin validate .` to validate the marketplace using the
  native Claude validator.
- [ ] 2.4 Run
  `openspec validate document-retired-develop-workflow --strict`.
- [ ] 2.5 Query the `origin` remote and GitHub pull requests to confirm there is
  no active `develop` branch or develop-based pull request.
- [ ] 2.6 Record the final validation evidence under
  `openspec/changes/document-retired-develop-workflow/verification-logs/`.

## 3. Active OpenSpec context

- [ ] 3.1 Update only the branch-workflow lines in `openspec/config.yaml` to
  describe feature branch → pull request → `main` without `develop`.
- [ ] 3.2 Inspect fresh OpenSpec instructions to confirm their returned project
  context no longer directs work through `develop`.
