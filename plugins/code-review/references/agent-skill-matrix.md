# Code Review Agent and Skill Matrix

This matrix explains which agents and skills the `code-review` plugin should use
for each kind of change. Use it together with
`plugins/code-review/references/code-review-routing.md`.

## Core Principle

- `/code-review` owns orchestration.
- Agents own review judgments.
- Skills provide reusable workflow and reference context.
- Not every run should invoke every agent or every skill.
- Every agent and every skill must have a clear trigger.

## Core Agents

These are the non-specialist agents in the main review pipeline.

| Agent | Trigger | Notes |
|---|---|---|
| `code-review:code-graph-analyzer` | Any full review outside docs/config fast path | Builds cross-file impact context before parallel review |
| `code-review:code-reviewer` | Every full review | Anchor reviewer; normalizes overall quality findings |
| `code-review:security-reviewer` | Every full review, especially security-sensitive changes | Also consumes `code-review:security-review` when active |
| `code-review:comment-analyzer` | Every full review, or `--focus=comments` | Checks comment accuracy and drift |
| `code-review:pr-test-analyzer` | Every full review, or `--focus=tests` | Checks test adequacy and missing coverage |
| `code-review:silent-failure-hunter` | Every full review, or `--focus=errors` | Finds swallowed failures and missing propagation |
| `code-review:type-design-analyzer` | Every full review, or `--focus=types` | Checks type boundaries and invariants |
| `code-review:code-simplifier` | Every full review, or `--focus=simplify` | Flags unnecessary complexity |
| `code-review:pr-walkthrough-writer` | PR review without `--focus` | Produces walkthrough artifact |
| `code-review:verification-reviewer` | Only when HIGH or CRITICAL findings exist | Final verification gate |

## Specialist Agents

### Language Specialists

| Agent | Trigger |
|---|---|
| `code-review:typescript-reviewer` | Changed TS/JS/Vue/Svelte files |
| `code-review:python-reviewer` | Changed Python files |
| `code-review:go-reviewer` | Changed Go files |
| `code-review:rust-reviewer` | Changed Rust files |
| `code-review:kotlin-reviewer` | Changed Kotlin files |
| `code-review:swift-reviewer` | Changed Swift files |
| `code-review:java-reviewer` | Changed Java files |
| `code-review:csharp-reviewer` | Changed C# files |
| `code-review:cpp-reviewer` | Changed C/C++ files |
| `code-review:fsharp-reviewer` | Changed F# files |
| `code-review:flutter-reviewer` | Changed Dart files |
| `code-review:database-reviewer` | Changed SQL or migration files |

### Framework and Domain Specialists

| Agent | Trigger | Runs with |
|---|---|---|
| `code-review:django-reviewer` | Django signals in changed files | `python-reviewer` |
| `code-review:fastapi-reviewer` | FastAPI signals in changed files | `python-reviewer` |
| `code-review:database-reviewer` | Supabase/schema/migration signals | language specialist if any |
| `code-review:network-config-reviewer` | Network config syntax in changed files | no language specialist required |
| `code-review:healthcare-reviewer` | HIPAA/PHI/clinical signals | relevant language specialist if any |
| `code-review:mle-reviewer` | ML/MLOps signals | relevant language specialist if any |

## Skills

Skills are supporting contexts, not peer reviewers.

| Skill | Trigger | Typical consumer |
|---|---|---|
| `code-review:security-review` | Auth, secrets, external input, file uploads, API endpoints, payments, sensitive data, cloud IAM, CI/CD credentials, bucket policies, public ingress | `security-reviewer` plus affected specialists |
| `code-review:security-scan` | Explicit security-only mode, suspicious secret patterns, fast-path docs/config secret hits | command plus `security-reviewer` |
| `code-review:flutter-dart-code-review` | Flutter or Dart signals | `flutter-reviewer` |

## Reference Loading

| Reference | When to load | Through |
|---|---|---|
| `skills/security-review/references/cloud-infrastructure-security.md` | Cloud or infra signals such as IAM, service accounts, VPC, firewall, bucket policy, secrets manager, Terraform, CloudFormation, CI/CD credential flow, public ingress | `code-review:security-review` |

## Review Profiles

| Profile | Effect |
|---|---|
| `assertive` | Keep all severities including nitpicks |
| `chill` | Keep only CRITICAL and HIGH findings |

## Focus Modes

`--focus` filters the general agent pool, but specialist agents still run when
their triggers match. This prevents language coverage from disappearing just
because a focused review mode is used.

| Focus | General agents |
|---|---|
| `comments` | `code-reviewer`, `comment-analyzer` |
| `tests` | `code-reviewer`, `pr-test-analyzer` |
| `errors` | `code-reviewer`, `silent-failure-hunter` |
| `types` | `code-reviewer`, `type-design-analyzer` |
| `code` | `code-reviewer`, `security-reviewer` |
| `simplify` | `code-reviewer`, `code-simplifier` |

## Maintenance Rule

When adding a new agent or skill:

1. Add its trigger to `code-review-routing.md`.
2. Add its human-readable purpose to this matrix.
3. Decide whether it is a core agent, specialist agent, or supporting skill.
4. Avoid duplicating orchestration logic inside the agent prompt.
