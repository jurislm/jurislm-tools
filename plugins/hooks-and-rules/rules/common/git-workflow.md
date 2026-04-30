# Git Workflow

## Commit Message Format
```
<type>(<scope>): <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.

## Type Selection Guide

**Key question: "Is this a new capability or a bug fix for the user?"**

| Type | Use for | Version bump |
|------|---------|-------------|
| `feat` | New feature, new skill, new rule, behavior change | minor |
| `fix` | Correcting wrong information, fixing broken behavior | patch |
| `docs` | Formatting only, punctuation, no content change | none |
| `refactor` | Restructuring without behavior change | none |
| `test` | Adding or updating tests | none |
| `chore` | Dependency updates, config tweaks, housekeeping | none |
| `perf` | Performance improvements | none |
| `ci` | CI/CD workflow changes | none |

### Plugin / Text-only Repos

For plugin repos (e.g. jurislm-tools, jurislm-plugins), the product IS the skill content, not code.

- Adding a new skill → `feat:`
- Updating skill content (new rules, new examples, new sections) → `feat:`
- Correcting wrong information in a skill → `fix:`
- Formatting/punctuation only, no content change → `docs:` or `chore:`

**Common mistake**: Using `docs:` for skill content updates — Release Please ignores `docs:` commits and will never publish a new version for those changes.

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).
