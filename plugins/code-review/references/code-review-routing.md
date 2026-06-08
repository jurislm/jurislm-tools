# Code Review Routing Matrix

This file is the single source of truth for the `code-review` plugin's review
orchestration. The `/code-review` command is the pipeline controller. Agents do
the review work. Skills provide reusable workflow and domain guidance.

## Execution Contract

Run the review in this order:

1. Gather changed files and determine review mode.
2. Classify changed files into docs, config, tests, logic, and security.
3. Select specialist agents from the routing tables below.
4. Build code-graph impact map for the dispatch result.
5. Select supporting skills from the skill routing table below.
6. Run the core review pipeline.
7. Run selected specialist agents in parallel with the core review pipeline.
7. Run verification only when HIGH or CRITICAL findings exist.
8. Aggregate, validate, and publish or report.

## Core Pipeline Agents

Always use these agents unless the command explicitly enters the docs/config
fast path:

| Agent | Responsibility |
|---|---|
| `code-review:code-graph-analyzer` | Cross-file impact map and dependency context |
| `code-review:code-reviewer` | General review anchor, findings normalization |
| `code-review:security-reviewer` | Security-sensitive code paths and exploit checks |
| `code-review:comment-analyzer` | Comment accuracy, drift, and misleading docs |
| `code-review:pr-test-analyzer` | Test coverage and bug-prevention value |
| `code-review:silent-failure-hunter` | Swallowed errors and missing propagation |
| `code-review:type-design-analyzer` | Type boundaries and invariant design |
| `code-review:code-simplifier` | Over-complexity and unnecessary abstractions |
| `code-review:pr-walkthrough-writer` | Human-readable walkthrough artifact |
| `code-review:verification-reviewer` | Verification of HIGH and CRITICAL findings |

## Specialist Agent Routing

### Extension-Based Routing

| Signal | Agent |
|---|---|
| `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.cjs`, `*.vue`, `*.svelte` | `code-review:typescript-reviewer` |
| `*.py` | `code-review:python-reviewer` |
| `*.go` | `code-review:go-reviewer` |
| `*.rs` | `code-review:rust-reviewer` |
| `*.kt`, `*.kts` | `code-review:kotlin-reviewer` |
| `*.swift` | `code-review:swift-reviewer` |
| `*.java` | `code-review:java-reviewer` |
| `*.cs` | `code-review:csharp-reviewer` |
| `*.cpp`, `*.cc`, `*.cxx`, `*.c`, `*.h`, `*.hpp`, `*.hxx` | `code-review:cpp-reviewer` |
| `*.fs`, `*.fsx` | `code-review:fsharp-reviewer` |
| `*.dart` | `code-review:flutter-reviewer` |
| `*.sql` | `code-review:database-reviewer` |
| `*migrations/*`, `*migrate/*` | `code-review:database-reviewer` |

### Framework and Domain Routing

Framework and domain specialists supplement the language specialist. They do not
replace it.

| Signal | Agent |
|---|---|
| `from django`, `models.Model`, `manage.py`, `settings.py`, `urls.py` | `code-review:django-reviewer` |
| `from fastapi`, `APIRouter`, `@app.get`, `@router.` | `code-review:fastapi-reviewer` |
| `pubspec.yaml` plus changed Dart files, or `package:flutter` import | `code-review:flutter-reviewer` |
| `supabase`, `CREATE TABLE`, SQL migrations, schema changes | `code-review:database-reviewer` |
| Cisco IOS, JunOS, `interface`, `access-list`, `ip route`, `router`, `hostname` | `code-review:network-config-reviewer` |
| `PHI`, `HIPAA`, `HL7`, `FHIR`, `EMR`, `EHR`, `patient`, `clinical`, `diagnosis`, `ICD`, `SNOMED`, `drug`, `dose` | `code-review:healthcare-reviewer` |
| `torch`, `tensorflow`, `sklearn`, `model.fit`, `model.predict`, `feature_store`, `mlflow`, `wandb`, `ray` | `code-review:mle-reviewer` |

## Skill Routing

Skills are not standalone reviewers. They provide additional workflow and
reference context to the command or to selected agents.

| Signal | Skill | Use |
|---|---|---|
| Auth, secrets, file upload, API endpoint, payment, sensitive data, cloud IAM, secret manager, bucket policy, public ingress, CI/CD permissions | `code-review:security-review` | Load the security checklist. If cloud or infra signals are present, also read `plugins/code-review/skills/security-review/references/cloud-infrastructure-security.md`. |
| Secret leak triage, dependency exposure, config-only fast path with suspicious credentials, explicit security-only review | `code-review:security-scan` | Use the scan workflow to confirm whether a faster or deeper security sweep is required. |
| Flutter or Dart project signals | `code-review:flutter-dart-code-review` | Load Flutter and Dart-specific review guidance. |

## Dispatch Rules

Apply these rules consistently:

1. If no specialist signal matches, run only the core pipeline agents.
2. If a framework or domain signal matches, run both the framework/domain
   specialist and the language specialist when one exists.
3. When a skill is selected, pass its workflow guidance into the matching agent
   prompts instead of duplicating the checklist inside the command.
4. Use `code-review:verification-reviewer` only after Phase 3 and only when at
   least one HIGH or CRITICAL finding survives the first pass.
5. In docs/config fast path, skip the full pipeline unless a secret or
   credential signal is found.
