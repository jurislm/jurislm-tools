## 1. Entry document synchronization

- [ ] 1.1 Update `README.md` GitHub Flow guidance to state that feature
  branches target `main` and the repository does not maintain `develop`.
- [ ] 1.2 Update `CLAUDE.md` GitHub Flow guidance to remove the stale allowance
  for a remote `develop` branch and state the same supported workflow.
- [ ] 1.3 Inspect the `README.md` and `CLAUDE.md` diff against the approved
  two-file scope and the `github-flow-entry-documentation` scenarios.

## 2. Validation and evidence

- [ ] 2.1 Run `npm run validate` to check tests, marketplace integrity, version
  synchronization, and Markdown lint for `README.md` and `CLAUDE.md`.
- [ ] 2.2 Run `claude plugin validate .` to validate the marketplace using the
  native Claude validator.
- [ ] 2.3 Query the `origin` remote and GitHub pull requests to confirm there is
  no active `develop` branch or develop-based pull request.
- [ ] 2.4 Record the final validation evidence under
  `openspec/changes/document-retired-develop-workflow/verification-logs/`.
