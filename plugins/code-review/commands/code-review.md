---
description: Code review — auto-detects language/framework and dispatches the right specialist agents. Local diff or GitHub/Bitbucket PR (pass PR number/URL for PR mode).
argument-hint: [pr-number | pr-url | --from=<commit> | --focus=comments|tests|errors|types|code|simplify | --profile=chill|assertive | blank for local review]
---

# Code Review

> The single entry point for all code review. It auto-detects the language and framework of the changed files and dispatches the matching specialist reviewer agents — no need to pick a per-language command.
> PR review mode adapted from PRPs-agentic-eng by Wirasm. Part of the PRP workflow series.

**Input**: $ARGUMENTS

Before dispatching any specialist agents or loading any companion skills, read
`plugins/code-review/references/code-review-routing.md`. Treat that file as the
single source of truth for:

- core pipeline agents
- specialist agent routing
- skill routing
- fast-path versus full-path rules

---

## Mode Selection

| `$ARGUMENTS` | Mode |
|---|---|
| Blank | **Local Review Mode** — full parallel review of uncommitted changes (no publish) |
| `--from=<commit>` | **Incremental Local Review** — same as Local Mode but only files changed since `<commit>` (e.g. `--from=main`, `--from=HEAD~3`) |
| PR number / PR URL / `--pr` | **PR Review Mode** — full parallel multi-agent stack + verification + publish |

Both modes run the **same full pipeline** — code graph → parallel stack (8 general agents + auto-detected specialist agents) → verification pass → aggregate. The only difference:
- **Local Mode** reviews the working-tree diff and reports findings to the terminal. It does NOT publish.
- **PR Mode** fetches the PR, runs the identical review, and **publishes** the result to GitHub/Bitbucket (inline comments, review decision, walkthrough comment, PR-description summary).

**Profile flag** (both modes):
- `--profile=chill` → output only CRITICAL and HIGH. Skip MEDIUM, LOW, NITPICK. Best for fast-moving feature branches.
- `--profile=assertive` (default) → output all severity levels including NITPICK. Best for PRs targeting main/release.


**Platform detection** (PR mode):
- URL contains `bitbucket.org` → **Bitbucket PR Review**
- URL contains `github.com`, or number only with a GitHub `origin` → **GitHub PR Review**
- Number only → run `git remote get-url origin`; `bitbucket.org` → Bitbucket, otherwise GitHub

---

## Orchestration Contract

The command is the pipeline controller. Do not turn it into a monolithic
reviewer. Its responsibilities are:

1. Gather review inputs.
2. Classify changed files.
3. Select specialist agents from the routing matrix.
4. Build code-graph impact map.
5. Select supporting skills from the routing matrix.
6. Run the core review pipeline in the prescribed order.
7. Aggregate and publish or report the result.

Agents perform the review. Skills provide reusable workflow guidance and
reference material. Do not treat skills as standalone parallel reviewers.

---

## Language / Framework Auto-Dispatch

Both modes run this classification to decide which specialist agents and
supporting skills to add. Agents and skills are added **only when a matching
signal is detected** — zero matches means no extra routing.

### Step A — Map changed files to language agents (by extension)

```bash
# $CHANGED_FILES = newline-separated list of changed paths (set per mode below)
SPECIALIST_AGENTS=""
ACTIVE_SKILLS=""
add_agent() { case "$SPECIALIST_AGENTS" in *"$1"*) ;; *) SPECIALIST_AGENTS="${SPECIALIST_AGENTS:+$SPECIALIST_AGENTS }$1" ;; esac; }
add_skill() { case "$ACTIVE_SKILLS" in *"$1"*) ;; *) ACTIVE_SKILLS="${ACTIVE_SKILLS:+$ACTIVE_SKILLS }$1" ;; esac; }

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.vue|*.svelte) add_agent code-review:typescript-reviewer ;;
    *.py)            add_agent code-review:python-reviewer ;;
    *.go)            add_agent code-review:go-reviewer ;;
    *.rs)            add_agent code-review:rust-reviewer ;;
    *.kt|*.kts)      add_agent code-review:kotlin-reviewer ;;
    *.swift)         add_agent code-review:swift-reviewer ;;
    *.java)          add_agent code-review:java-reviewer ;;
    *.cs)            add_agent code-review:csharp-reviewer ;;
    *.cpp|*.cc|*.cxx|*.c|*.h|*.hpp|*.hxx) add_agent code-review:cpp-reviewer ;;
    *.fs|*.fsx)      add_agent code-review:fsharp-reviewer ;;
    *.dart)          add_agent code-review:flutter-reviewer ;;
    *.sql)           add_agent code-review:database-reviewer ;;
  esac
  # Migration files (framework-agnostic naming) → code-review:database-reviewer
  case "$file" in *migrations/*|*migrate/*) add_agent code-review:database-reviewer ;; esac
done <<< "$CHANGED_FILES"
```

### Step B — Framework detection (content-based, refines language agents)

After the extension pass, inspect file content to add framework specialists and
supporting skills. Only add when the signal is present in a changed file (grep
the diff or the file at head). Use
`plugins/code-review/references/code-review-routing.md` as the single source of
truth for the routing rules.

| Framework | Signal (in changed files) | Add agent |
|---|---|---|
| **Django** | `from django`, `models.Model`, `manage.py`, `settings.py`, `urls.py` | `code-review:django-reviewer` |
| **FastAPI** | `from fastapi`, `APIRouter`, `@app.get`/`@router.` | `code-review:fastapi-reviewer` |
| **Flutter** | `pubspec.yaml` present + any `.dart` file, or `package:flutter` import | `code-review:flutter-reviewer` |
| **Database / Supabase** | `.sql`, migration dirs, `CREATE TABLE`, `supabase` client usage | `code-review:database-reviewer` |

Two domains have **content-based dispatch** (no reliable extension — grep diff/file content for the signal):

| Domain | Signal | Add agent |
|---|---|---|
| **Network config** | `interface `, `access-list`, `ip route`, `router `, `hostname ` in `.cfg`/`.conf` files, or any Cisco IOS/JunOS syntax | `code-review:network-config-reviewer` |
| **Healthcare / HIPAA** | `PHI`, `HIPAA`, `HL7`, `FHIR`, `EMR`, `EHR`, `patient`, `clinical`, `diagnosis`, `ICD`, `SNOMED`, `drug`, `dose` in source files | `code-review:healthcare-reviewer` (Opus) |
| **ML / MLOps** | `torch`, `tensorflow`, `sklearn`, `model.fit`, `model.predict`, `feature_store`, `mlflow`, `wandb`, `ray` in source files | `code-review:mle-reviewer` |
> Framework agents **supplement**, not replace, the language agent (e.g. a Django change runs both `code-review:python-reviewer` and `code-review:django-reviewer`).

### Step C — Skill activation

Use the routing matrix to compute `$ACTIVE_SKILLS`:

- Add `code-review:security-review` for auth, secrets, file upload, payment,
  sensitive data, API, cloud IAM, or CI/CD credential signals.
- Add `code-review:security-scan` for explicit security-only review, suspicious
  credential exposure, or when the docs/config fast path finds possible secrets.
- Add `code-review:flutter-dart-code-review` when Flutter or Dart signals are present.

`$SPECIALIST_AGENTS` (deduplicated) is now the set of language/framework agents
to add to the review. `$ACTIVE_SKILLS` is the set of skill contexts to load and
pass to matching agents.

---

## Local Review Mode

Full parallel review of uncommitted changes — the same pipeline as PR mode, reported to the terminal instead of published.

### Phase 1 — GATHER

```bash
# Full local review (default — no --from flag)
TRACKED_FILES=$(git diff --name-only HEAD)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
CHANGED_FILES=$(printf "%s\n%s\n" "$TRACKED_FILES" "$UNTRACKED_FILES" | sed '/^$/d' | sort -u)

# Incremental review (--from=<commit> specified)
TRACKED_FILES=$(git diff --name-only <commit>)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
CHANGED_FILES=$(printf "%s\n%s\n" "$TRACKED_FILES" "$UNTRACKED_FILES" | sed '/^$/d' | sort -u)
```

Use the incremental form when `--from=<commit>` is specified. In later phases, use `git diff <commit>` (not `git diff <commit>..HEAD`) wherever a diff is needed — this includes uncommitted working-tree changes relative to `<commit>`. Untracked files are always included in `CHANGED_FILES`.

If `CHANGED_FILES` is empty, stop: "Nothing to review."

Set `CHANGED_FILES` from the combined output above. On Windows, strip carriage returns from the tracked diff before combining, e.g. `git diff --name-only HEAD | tr -d '\r'`. `CHANGED_FILES` persists as a variable through all subsequent phases — Phase 1.5 uses it for classification, Phase 2 for caller tracing, and Phase 3 agents use it to know which files to read.

### Phase 1.5 — CLASSIFY & DISPATCH

Run the same file classification as GitHub PR mode Phase 1.5 (populate `$LOGIC_FILES` / `$SECURITY_FILES`), then run **Language / Framework Auto-Dispatch** (above) to compute `$SPECIALIST_AGENTS`. Announce what was detected, e.g. `Detected: code-review:python-reviewer, code-review:django-reviewer`. The Fast Path (docs/config only → secret scan only) applies here too.

Build `IMPACT_MAP` immediately after dispatch by running `code-review:code-graph-analyzer` with cache key `local-<sha8>` (`git rev-parse --short=8 HEAD`) before context loading. Store the returned markdown as `IMPACT_MAP` for use by all Phase 3 agents.

If `code-review:code-graph-analyzer` times out or errors, keep `IMPACT_MAP` empty and continue.
Also compute `$ACTIVE_SKILLS` from the routing matrix and announce it, e.g.
`Loaded skills: code-review:security-review`. If cloud or infrastructure signals
are present, load
`plugins/code-review/skills/security-review/references/cloud-infrastructure-security.md`
through the `code-review:security-review` skill context.

### Phase 2 — CONTEXT

Run the local working-tree context workflow: read project rules and `.claude/review-paths.yaml`, trace callers, and run static analysis (capture as context). `IMPACT_MAP` was already prepared during Phase 1.5.
Before launching specialist agents, load the workflow guidance for every skill in
`$ACTIVE_SKILLS` and pass only the relevant parts to the matching reviewers.

### Phase 3 — REVIEW (parallel agents)

Run the **full parallel agent pool** exactly as GitHub PR mode Phase 3: the 8 general agents (`code-review:code-reviewer` anchor + `code-review:security-reviewer` + the six collaborators) **plus** every agent in `$SPECIALIST_AGENTS`. Each agent reads changed files **in full from the working tree** using the `Read` tool (not `gh api`) — the list of files to read is `$CHANGED_FILES` from Phase 1. `--focus` filtering applies identically to GitHub PR mode; `pr-walkthrough-writer` is skipped when `--focus` is set. The always-on `$SPECIALIST_AGENTS` run regardless of `--focus`.
When a skill in `$ACTIVE_SKILLS` matches a selected specialist or security-sensitive
code path, include the skill guidance in that agent's prompt instead of duplicating
the checklist inside this command.

### Phase 3.5 — VERIFICATION PASS

**If Phase 3 produced zero HIGH or CRITICAL findings, skip Phase 3.5 entirely and proceed to Phase 4.**

Otherwise, run `code-review:verification-reviewer` over all HIGH and CRITICAL findings, identical to GitHub PR mode Phase 3.5.

### Phase 4 — AGGREGATE & REPORT

Apply the same aggregation as PR mode Phase 4 (deduplicate, contradiction filter, **Confidence Rule**, **False-Positive Guard**, rank) and run the matching validation commands. Then output to the terminal grouped by severity (CRITICAL → HIGH → MEDIUM → LOW, plus NITPICK in assertive profile) — **no publish step**.

Block the commit if CRITICAL or HIGH issues are found. Never approve code with security vulnerabilities.

---

## GitHub PR Review Mode

Comprehensive GitHub PR review — full parallel agent stack, verification, walkthrough, and published review.

### Phase 1 — FETCH

Parse input to determine the PR:

| Input | Action |
|---|---|
| Number (e.g. `42`) | Use as PR number |
| URL (`github.com/.../pull/42`) | Extract PR number |
| Branch name | Find PR via `gh pr list --head <branch>` |

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,headRefOid,changedFiles,additions,deletions
gh pr diff <NUMBER>
```

If the PR is not found, stop with an error. Store PR metadata for later phases.

### Phase 1.5 — CLASSIFY & DISPATCH


**File classification** — route between Fast Path and Slow Path, and build the lists for dispatch:

```bash
CHANGED_FILES=$(gh pr diff <NUMBER> --name-only | tr -d '\r')
FAST_ONLY=true
LOGIC_FILES=""
SECURITY_FILES=""
while IFS= read -r file; do
  case "$file" in
    *.md|*.txt|*.rst|*.adoc|CHANGELOG*|LICENSE*|README*)
      echo "DOCS: $file" ;;
    *.json|*.yaml|*.yml|*.toml|*package-lock*|*.lock|*.sum)
      echo "CONFIG: $file" ;;
    *auth*|*crypto*|*token*|*password*|*session*|*jwt*|*oauth*|*secret*)
      echo "SECURITY: $file"; SECURITY_FILES="${SECURITY_FILES:+$SECURITY_FILES }$file"; FAST_ONLY=false ;;
    *test*|*spec*|*__tests__*|*.test.*|*.spec.*)
      echo "TEST: $file" ;;
    *.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.rs|*.kt|*.swift|*.java|*.cs|*.rb|*.php|\
*.cpp|*.cc|*.c|*.h|*.hpp|*.dart|*.scala|*.ex|*.exs|*.lua|*.vue|*.svelte)
      echo "LOGIC: $file"; LOGIC_FILES="${LOGIC_FILES:+$LOGIC_FILES }$file"; FAST_ONLY=false ;;
    *)
      echo "OTHER: $file" ;;
  esac
done <<< "$CHANGED_FILES"
```

`$LOGIC_FILES` and `$SECURITY_FILES` are now available for Phase 2.5.

**Language/framework dispatch** — run the **Language / Framework Auto-Dispatch** section (above) over `$CHANGED_FILES` to compute `$SPECIALIST_AGENTS`, then compute `$ACTIVE_SKILLS` from the routing matrix. Immediately build `IMPACT_MAP` by running `code-review:code-graph-analyzer` with cache key `pr-<number>-<first8charsOfHeadSha>` and store it for Phase 3 agents.

If `code-review:code-graph-analyzer` errors or times out, continue with an empty `IMPACT_MAP` and proceed.

These dispatched agents are added to the review pipeline in Phase 3.

**Fast Path** (only DOCS + CONFIG + OTHER — zero LOGIC/SECURITY files):
- Skip Phases 2, 2.5, 3, 3.5, 4
- Run **secret scan only** — the following credential-pattern greps against all changed files:

  ```bash
  REPO_FULL_NAME=$(gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"')
  HEAD_SHA=$(gh pr view <NUMBER> --json headRefOid --jq .headRefOid)
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    encoded_file=$(printf '%s' "$f" | jq -sRr @uri)
    file_content=$(gh api "repos/$REPO_FULL_NAME/contents/$encoded_file?ref=$HEAD_SHA" \
      --jq -r '.content // empty' 2>/dev/null | tr -d '\n' | base64 -d 2>/dev/null || true)
    [ -z "$file_content" ] && continue

    printf '%s\n' "$file_content" | grep -n -- "sk-[a-zA-Z0-9]\{20,\}" | head -20 || true
    printf '%s\n' "$file_content" | grep -n -- "ghp_[a-zA-Z0-9]\{36\}" | head -10 || true
    printf '%s\n' "$file_content" | grep -n -- "AKIA[0-9A-Z]\{16\}" | head -10 || true
    printf '%s\n' "$file_content" | grep -n -- "password\s*=\s*['\"][^'\"]\{8,\}['\"]" | head -10 || true
    printf '%s\n' "$file_content" | grep -n -- "api[_-]key\s*=\s*['\"][^'\"]\{8,\}['\"]" | head -10 || true
  done <<< "$CHANGED_FILES"
  ```

- Zero secrets/credentials → post `gh pr review --approve` with note "Docs/config changes — no logic review needed" (Phase 7), then Phase 8
- A secret/credential detected → exit Fast Path, run the full Slow Path from Phase 2 (no prior linter/typecheck results exist — run them normally in Phase 2)

**Slow Path** (any LOGIC or SECURITY file): proceed to Phase 2 normally.

### Phase 2 — CONTEXT

Build review context:

1. **Project rules** — Read `CLAUDE.md`, `.claude/docs/`, contributing guidelines. Load optional path rules if present:
   ```bash
   [ -f ".claude/review-paths.yaml" ] && cat ".claude/review-paths.yaml"
   ```
   This is an **optional, user-created** file (not bundled). If present, apply the most specific matching `pattern`'s `rules` per changed file; files in a `skip` list have those categories suppressed. Example schema:
   ```yaml
   paths:
     - pattern: "src/api/**"
       focus: security
       rules: ["All public endpoints must require authentication", "Rate limiting required on POST"]
     - pattern: "src/db/**"
       focus: performance
       rules: ["No queries without LIMIT", "No string concatenation in SQL"]
     - pattern: "**/*.test.ts"
       skip: [magic_numbers, function_length, console_log]
   ```
2. **Planning artifacts** — Check `.claude/prds/`, `.claude/plans/`, `.claude/reviews/`, and legacy `.claude/PRPs/{prds,plans,reports,reviews}/`.
3. **PR intent** — Parse the PR description for goals, linked issues, test plans. Fetch linked issues:
   ```bash
   gh pr view <NUMBER> --json body --jq '.body' | \
     perl -ne 'while (/(?:Fixes|Closes|Resolves|Related to)[^#]*#(\d+)/gi) { print "$1\n" }' | sort -u | \
     while read -r num; do gh issue view "$num" --json number,title,body 2>/dev/null; done
   ```
   Understanding intent reduces false positives.
4. **Changed files** — List and categorize (source, test, config, docs).
5. **Caller tracing** — For each modified exported symbol, find call sites:
   ```bash
   grep -r "SymbolName" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
     --include="*.py" --include="*.go" --include="*.rs" -n . | head -20
   ```
   Read the **3–5 most relevant callers**. Note any that assume return type, thrown errors, or side effects. Skip private/internal symbols.
6. **Static analysis — run before review, capture as context** — Execute fast linters + type checker now. Don't fail on findings; treat output as Phase 3 signals:

   **Node.js / TypeScript:**
   ```bash
   npx tsc --noEmit 2>&1 | head -60 || true
   npm run lint -- --format=compact 2>&1 | head -60 || true
   ```
   **Rust:** `cargo clippy 2>&1 | head -60 || true`
   **Go:** `go vet ./... 2>&1 | head -60 || true`
   **Python:** `ruff check . 2>&1 | head -60 || true`

   Any `file:line` flagged here → review with elevated priority in Phase 3.
7. **CI check status** — Surface known failures as context:
   ```bash
   gh pr checks <NUMBER> 2>/dev/null | head -30
   ```
   Note failing checks at the top of Phase 3 with `⚠️ CI failing: <check_name>` and elevate those code paths. Do not block on it.

### Phase 2.5 — IMPACT MAP READINESS

If `IMPACT_MAP` is still empty from Phase 1.5, run `code-review:code-graph-analyzer` now **sequentially** (wait for the result before Phase 3). This is the final chance to populate cross-file dependency context.

Pass to the agent:
- `$LOGIC_FILES` and `$SECURITY_FILES` from Phase 1.5 (excludes DOCS/CONFIG/TEST)
- Cache key: `pr-<number>-<first8charsOfHeadSha>` (PR mode); `local-<sha8>` for local diff mode (`git rev-parse --short=8 HEAD`)

The agent checks `.claude/code-graph/<cache_key>-impact-map.md` first — returns the cached map if the SHA matches; otherwise computes L2 import dependencies + L3 co-change risk and writes to `.claude/code-graph/`.

**Store the returned markdown as `IMPACT_MAP`.** When launching each parallel agent in Phase 3, prepend the following block to the agent's prompt before any per-agent instructions:

```text
[IMPACT MAP — use as additional context for cross-file risk; do not repeat verbatim in findings]
<IMPACT_MAP content>
[END IMPACT MAP]
```

All agents — both the 8 general agents and every agent in `$SPECIALIST_AGENTS` — receive the full impact map. Each agent is responsible for extracting the subset relevant to its scope. If `code-review:code-graph-analyzer` errors or times out, omit the block entirely and proceed — do not block the review.

### Phase 3 — REVIEW (parallel agents)

**Cross-reference static analysis first** — For any `file:line` already flagged by the Phase 2 linter/typecheck: treat as elevated-confidence (linter + review = double signal), include the linter rule in the finding, and skip re-flagging if the linter message is already precise.

Each agent reads changed files **in full** at the PR head revision:
```bash
gh pr diff <NUMBER> --name-only | while IFS= read -r file; do
  gh api "repos/{owner}/{repo}/contents/$file?ref=<head-branch>" --jq '.content' | base64 -d
done
```

**Agent pool** — `code-review:code-reviewer` is always the anchor. The full pool is:

**General agents (8):**
- `code-review:code-reviewer` — overall quality, security, maintainability (anchor)
- `code-review:security-reviewer` — OWASP Top 10; injection, SSRF, hardcoded secrets, unsafe crypto
- `code-review:comment-analyzer` — inline comment accuracy, completeness, rot risk
- `code-review:pr-test-analyzer` — test coverage, behavioral coverage, real-bug prevention
- `code-review:silent-failure-hunter` — swallowed errors, ignored promises, missing propagation
- `code-review:type-design-analyzer` — type encapsulation, invariant expression, enforcement
- `code-review:code-simplifier` — over-complex implementations, duplicate abstractions
- `code-review:pr-walkthrough-writer` — structured walkthrough + Mermaid diagram (skip when `--focus` is set); **store output as `WALKTHROUGH_OUTPUT`**

**Specialist agents (auto-dispatched):** every agent in `$SPECIALIST_AGENTS` (from Phase 1.5) runs alongside the general pool, scoped to its language/framework files.

**Supporting skills:** every skill in `$ACTIVE_SKILLS` is loaded as workflow
context for the matching agents. Example: `code-review:security-review` augments
`code-review:security-reviewer` and any specialist reviewing auth, secret, or
cloud-infra changes; `code-review:flutter-dart-code-review` augments
`code-review:flutter-reviewer`.

**`--focus` filtering** — `code-review:code-reviewer` always runs. The auto-dispatched `$SPECIALIST_AGENTS` always run (language coverage is independent of focus). When `--focus` is specified, validate it first:

```text
Valid --focus values: comments | tests | errors | types | code | simplify
Unknown value → stop: "Unknown --focus value '<value>'. Valid options: comments, tests, errors, types, code, simplify"
```

A valid `--focus` runs only the mapped general subset (plus the always-on specialists):

| `--focus` | General agents to run |
|---|---|
| _(none)_ | All 8 general agents |
| `comments` | `code-review:code-reviewer` + `code-review:comment-analyzer` |
| `tests` | `code-review:code-reviewer` + `code-review:pr-test-analyzer` |
| `errors` | `code-review:code-reviewer` + `code-review:silent-failure-hunter` |
| `types` | `code-review:code-reviewer` + `code-review:type-design-analyzer` |
| `code` | `code-review:code-reviewer` + `code-review:security-reviewer` |
| `simplify` | `code-review:code-reviewer` + `code-review:code-simplifier` |

Apply the 7-category **Review Checklist** (below) across all agents.

### Phase 3.5 — VERIFICATION PASS

Launch `code-review:verification-reviewer` with all HIGH and CRITICAL findings from Phase 3. Wait for its output. Carry forward:
- All **CONFIRMED** findings at their original or verified severity.
- **UNCERTAIN** findings demoted to MEDIUM (survive as MEDIUM — do not discard).
- All **CRITICAL** findings regardless of verdict — may be demoted to HIGH, never removed.

Discard only findings marked INVALID or FALSE POSITIVE (unless originally CRITICAL → demote to HIGH instead). If the PR diff already fixes the issue, mark it "FIXED IN THIS PR" and **always remove it regardless of original severity** — a finding that the PR itself resolves is not a blocker even if it was CRITICAL.

### Phase 4 — AGGREGATE & VALIDATE

> **Scope**: Phase 4 operates only on findings that survived Phase 3.5. INVALID and FALSE POSITIVE verdicts were already removed by `code-review:verification-reviewer`; UNCERTAIN findings were already demoted to MEDIUM. Phase 4 does not re-adjudicate individual verdicts — it deduplicates, resolves cross-agent conflicts, and validates the build.

**4a — Deduplicate**: Group findings by file + approximate line. Keep one instance per issue — prefer the instance from the agent with the most specific evidence (exact line + concrete failure scenario).

**4b — Contradiction filter**: If two agents flag the **same code for opposite reasons** (e.g. one flags a function as too complex, another as appropriately concise), require ≥ 2 agents in agreement to include the finding. This filter targets inter-agent disagreement about the same aspect of the same code — it does not re-open findings already verified by Phase 3.5. **Exception**: findings originally rated CRITICAL are always included regardless of agreement count.

**4c — Confidence filter**: Drop findings framed as "might", "possibly", "consider" unless CRITICAL. Only report ≥ 80% confidence.

**4d — False-positive guard**: magic numbers in test fixtures or well-named constants → skip; fire-and-forget in tests/logging → skip; style suggestions not agreed by ≥ 2 agents → downgrade to LOW or omit.

**4e — Rank**: CRITICAL → HIGH → MEDIUM → LOW.

**4f — Validate** (run only commands matching the detected project type; record pass/fail):

| Project (config file) | Commands |
|---|---|
| Node.js / TS (`package.json`) | `npm test`, `npm run build` |
| Rust (`Cargo.toml`) | `cargo test`, `cargo build` |
| Go (`go.mod`) | `go test ./...`, `go build ./...` |
| Python (`pyproject.toml`/`setup.py`) | `pytest` |

> lint + typecheck already ran in Phase 2 Step 6 — record those; only re-run test + build.

**4g — Count by severity** (store for Phase 6.5 and Phase 7):
```bash
CRITICAL_COUNT=<n>; HIGH_COUNT=<n>; MEDIUM_COUNT=<n>
LOW_COUNT=<n of LOW and NITPICK>
LOW_NITPICK_LIST=<formatted markdown list of all LOW and NITPICK findings>
```

### Phase 5 — DECIDE

| Condition | Decision |
|---|---|
| Zero CRITICAL/HIGH, validation passes | **APPROVE** |
| Only MEDIUM/LOW, validation passes | **APPROVE** with comments |
| Any HIGH or validation failure | **REQUEST CHANGES** |
| Any CRITICAL | **BLOCK** — must fix before merge |

Special cases:
- Draft PR (GitHub) → always **COMMENT**. (Bitbucket has no draft state — OPEN/MERGED/DECLINED/SUPERSEDED only.)
- Only docs/config → lighter review, focus on correctness.
- Explicit `--approve` / `--request-changes` flag → override decision (still report all findings).

### Phase 6 — REPORT ARTIFACT

Create `.claude/reviews/pr-<NUMBER>-review.md`:

```markdown
# PR Review: #<NUMBER> — <TITLE>

**Reviewed**: <date>
**Author**: <author>
**Branch**: <head> → <base>
**Decision**: APPROVE | REQUEST CHANGES | BLOCK
**Specialists dispatched**: <list of $SPECIALIST_AGENTS>

## Walkthrough

| File | Change | Summary |
|------|--------|---------|
| `<file>` | Added / Modified / Deleted | <one-sentence description> |

## Summary
<1-2 sentence overall assessment>

## Findings

### CRITICAL
<findings or "None">
### HIGH
<findings or "None">
### MEDIUM
<findings or "None">
### LOW
<findings or "None">

## Validation Results

| Check | Result |
|---|---|
| Type check | Pass / Fail / Skipped |
| Lint | Pass / Fail / Skipped |
| Tests | Pass / Fail / Skipped |
| Build | Pass / Fail / Skipped |

## Files Reviewed
<list with change type>
```

### Phase 6.5 — UPDATE PR DESCRIPTION

Auto-append a structured review summary. Idempotent — strips any previously generated block first:

```bash
CURRENT_BODY=$(gh pr view <NUMBER> --json body --jq '.body')

STRIPPED=$(echo "$CURRENT_BODY" | python3 -c "
import sys, re
body = sys.stdin.read()
body = re.sub(r'<!-- cr-summary:start -->.*?<!-- cr-summary:end -->', '', body, flags=re.DOTALL)
body = re.sub(r'<!-- cr-summary:start -->', '', body)
print(body.strip())
" 2>/dev/null) || STRIPPED="$CURRENT_BODY"

SUMMARY_BLOCK="<!-- cr-summary:start -->

---
## 📋 Code Review Summary

| Category | Files |
|---|---|
| Logic / Feature | <logic_files> |
| Tests | <test_files> |
| Config / Docs | <config_doc_files> |

**Reviewed**: $(date +%Y-%m-%d) · **Findings**: ${CRITICAL_COUNT} critical · ${HIGH_COUNT} high · ${MEDIUM_COUNT} medium
<!-- cr-summary:end -->"

printf '%s\n\n%s' "$STRIPPED" "$SUMMARY_BLOCK" | gh pr edit <NUMBER> --body-file - || true
```

> Skip for Bitbucket (REST API does not support this CLI workflow).

### Phase 7 — PUBLISH

**Step 7a — Walkthrough comment first** — the first thing developers see, posted before any findings.

Use `WALKTHROUGH_OUTPUT` from `code-review:pr-walkthrough-writer` if it ran; otherwise generate inline. Include a 1–5 **Review Effort** score:
- **1** Docs/config/formatting only · **2** Small fix, 1–3 files · **3** Medium feature/refactor, 4–10 files · **4** Complex refactor or >10 files · **5** Architecture/schema/auth/cross-cutting

Add a Mermaid sequence diagram only when ≤10 files changed AND at least one non-test logic file is present and a clear multi-layer flow exists; otherwise omit.

```bash
WALKTHROUGH_BODY="## 🔍 PR Walkthrough

**Review Effort**: <N>/5 — <label> (<brief reason>)

| File | Change | Summary |
|------|--------|---------|
| \`<file>\` | Added/Modified/Deleted | <one-sentence summary> |

<mermaid_block_if_generated>"
gh pr review <NUMBER> --comment --body "$WALKTHROUGH_BODY"
```

**Step 7b — Inline comments for CRITICAL/HIGH** (post individually, max 10; any CRITICAL/HIGH beyond the 10th are included in the `## ⚠️ Issues Requiring Attention` table in Step 7c alongside MEDIUM findings):

```text
**[{SEVERITY}] {issue_title}**

{concrete_failure_scenario}

**Why existing guards don't catch it:** {guard_gap}
```
If the fix replaces **exactly one line** with **exactly one line**, append a committable suggestion block (do not use suggestion blocks for multi-line removals or additions — use a diff block in the description instead):
````markdown
```suggestion
{fixed_line_content}
```

````

```bash
HEAD_SHA=$(gh pr view <NUMBER> --json headRefOid --jq .headRefOid)
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/comments" \
  -f body="$COMMENT_BODY" -f path="<file>" -F line=<line_number> \
  -f side="RIGHT" -f commit_id="$HEAD_SHA"
```

**Step 7c — Main review body** (MEDIUM table + overflow HIGH/CRITICAL + decision):

> **Profile gate**: `--profile=chill` → skip the MEDIUM section only; overflow HIGH/CRITICAL entries in the `## ⚠️ Issues Requiring Attention` table are always shown regardless of profile. Severity counts + decision (APPROVE/REQUEST CHANGES/BLOCK) are always shown.

```markdown
## 📊 Review Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL | {n} |
| 🟠 HIGH | {n} |
| 🟡 MEDIUM | {n} |
| 🔵 LOW | {n} |

## ⚠️ Issues Requiring Attention

| File:Line | Issue | Suggested Fix |
|---|---|---|
| `file:line` | description | fix |
```
Include MEDIUM findings (assertive only) + HIGH findings beyond the 10-inline limit.

```bash
# APPROVE — zero CRITICAL/HIGH, validation passes
gh pr review <NUMBER> --approve --body "$REVIEW_BODY"

# BLOCK — any CRITICAL (GitHub has no native BLOCK — use REQUEST CHANGES with a ⛔ header)
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  REVIEW_BODY="⛔ BLOCK — This PR must not be merged until all CRITICAL issues are resolved.

$REVIEW_BODY"
fi
gh pr review <NUMBER> --request-changes --body "$REVIEW_BODY"

# REQUEST CHANGES — any HIGH or validation failure (no CRITICAL)
gh pr review <NUMBER> --request-changes --body "$REVIEW_BODY"

# COMMENT — draft PR or informational
gh pr review <NUMBER> --comment --body "$REVIEW_BODY"
```

**Step 7d — Collapsible LOW/NITPICK** (skip entirely when `--profile=chill`):

```bash
gh pr review <NUMBER> --comment --body "<details>
<summary>🔵 Low Priority / Style Suggestions (${LOW_COUNT})</summary>

${LOW_NITPICK_LIST}

</details>"
```

### Phase 8 — OUTPUT

```text
PR #<NUMBER>: <TITLE>
Platform: GitHub
Decision: <APPROVE|REQUEST_CHANGES|BLOCK>
Specialists: <list of $SPECIALIST_AGENTS or "none">

Issues: <c> critical, <h> high, <m> medium, <l> low
Validation: <pass>/<total> checks passed

Artifacts:
  Review: .claude/reviews/pr-<NUMBER>-review.md
  GitHub: <PR URL>
```

---

## Bitbucket PR Review Mode

Comprehensive Bitbucket PR review via REST API v2.0. Same phase structure as GitHub mode (classify & dispatch, context, code graph, parallel agents, verification, aggregate, decide, publish) — only the API calls differ.

**Prerequisites**:
- `BB_USERNAME` — Bitbucket account name
- `BB_APP_PASSWORD` — Bitbucket **App Password** (not your account password)

App Password permissions: Repositories **Read** + Pull requests **Read + Write** (comment/approve/request-changes). Create at: Bitbucket → Settings → Personal settings → App passwords.

### Phase 1 — FETCH

| Input | Action |
|---|---|
| Number (`42`) | Parse workspace/slug from `git remote get-url origin` |
| URL (`bitbucket.org/{ws}/{slug}/pull-requests/42`) | Extract ws, slug, ID directly |

```bash
REMOTE=$(git remote get-url origin)
# HTTPS: https://bitbucket.org/workspace/repo.git  |  SSH: git@bitbucket.org:workspace/repo.git
PATH_PART=$(echo "$REMOTE" | sed 's|https://bitbucket.org/||' | sed 's|git@bitbucket.org:||' | sed 's|\.git$||')
WORKSPACE=$(echo "$PATH_PART" | cut -d/ -f1)
REPO_SLUG=$(echo "$PATH_PART" | cut -d/ -f2)

curl -s -u "$BB_USERNAME:$BB_APP_PASSWORD" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID" \
  | jq '{title, description, author: .author.display_name,
         source_branch: .source.branch.name, dest_branch: .destination.branch.name,
         head_commit: .source.commit.hash}'

curl -s -u "$BB_USERNAME:$BB_APP_PASSWORD" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/diff"
```

On HTTP 401: confirm you're using an App Password with the right scopes. Test: `curl -u "$BB_USERNAME:$BB_APP_PASSWORD" "https://api.bitbucket.org/2.0/user"`.

### Phase 1.5 — CLASSIFY & DISPATCH

Get changed files (paginate while `next` is non-null), then run the same file classification and **Language / Framework Auto-Dispatch** as GitHub mode to compute `$LOGIC_FILES`, `$SECURITY_FILES`, and `$SPECIALIST_AGENTS`:
```bash
curl -s -u "$BB_USERNAME:$BB_APP_PASSWORD" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{slug}/pullrequests/{id}/diffstat" \
  | jq '.values[] | {path: (.new.path // .old.path), status}'
# status: added | modified | removed | renamed; .new is null on removed → fallback to .old.path
```

### Phases 2 – 5 — CONTEXT, CODE GRAPH, REVIEW, VERIFICATION, AGGREGATE, DECIDE

Identical to GitHub mode. Read each changed file in full at the PR head commit:
```bash
curl -s -u "$BB_USERNAME:$BB_APP_PASSWORD" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{slug}/src/{head_commit}/{filepath}"
```
Run the full parallel agent pool (general + `$SPECIALIST_AGENTS`), `code-review:verification-reviewer` (Phase 3.5), and the same aggregate/validate/decide logic.

### Phase 6 — REPORT ARTIFACT

Create `.claude/reviews/pr-<ID>-review.md` using the same format as GitHub mode. (Skip Phase 6.5 — Bitbucket REST does not support the PR-description update workflow.)

### Phase 7 — PUBLISH

**Step 7a — Walkthrough comment first** — use `WALKTHROUGH_OUTPUT` from `code-review:pr-walkthrough-writer` (same as GitHub mode — the agent ran in Phase 3). If the agent output is unavailable, generate the walkthrough inline using the file table and effort score described in the GitHub Phase 7 Step 7a spec.

```bash
curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" -H "Content-Type: application/json" \
  -d "$(jq -nc --arg raw "$WALKTHROUGH_BODY" '{content:{raw:$raw}}')" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/comments"
```

**Step 7b — Inline comments for CRITICAL/HIGH** (max 10):
```bash
# Added/modified line → "to"; removed line → "from"
curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" -H "Content-Type: application/json" \
  -d "$(jq -nc --arg body "$COMMENT_BODY" --arg path "<file>" --argjson line <line> '{content:{raw:$body},inline:{path:$path,to:$line}}')" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/comments"
```

**Step 7c — Main review comment + decision:**
```bash
# Prepend ⛔ BLOCK header BEFORE posting the comment (so it appears in the comment body)
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  REVIEW_BODY="⛔ BLOCK — This PR must not be merged until all CRITICAL issues are resolved.

$REVIEW_BODY"
fi

# Post summary comment (all cases) — REVIEW_BODY is now final
curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" -H "Content-Type: application/json" \
  -d "$(jq -nc --arg raw "$REVIEW_BODY" '{content:{raw:$raw}}')" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/comments"

# Decision API — exactly one branch executes (mutually exclusive)
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" \
    "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/request-changes"
elif [ "$HIGH_COUNT" -gt 0 ] || [ "${VALIDATION_FAILED:-0}" -eq 1 ]; then
  curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" \
    "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/request-changes"
else
  curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" \
    "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/approve"
fi
```

**Step 7d — Low priority** (Bitbucket has no HTML folding — plain format):
```bash
curl -s -X POST -u "$BB_USERNAME:$BB_APP_PASSWORD" -H "Content-Type: application/json" \
  -d "$(jq -nc --arg raw "**Low Priority / Style Suggestions (${LOW_COUNT}):**\n\n${LOW_NITPICK_LIST}" '{content:{raw:$raw}}')" \
  "https://api.bitbucket.org/2.0/repositories/$WORKSPACE/$REPO_SLUG/pullrequests/$PR_ID/comments"
```

### Phase 8 — OUTPUT

```text
PR #<ID>: <TITLE>
Platform: Bitbucket
Decision: <APPROVE|REQUEST_CHANGES|BLOCK>
Specialists: <list of $SPECIALIST_AGENTS or "none">

Issues: <c> critical, <h> high, <m> medium, <l> low
Validation: <pass>/<total> checks passed

Artifacts:
  Review: .claude/reviews/pr-<ID>-review.md
  Bitbucket: https://bitbucket.org/{workspace}/{slug}/pull-requests/{id}
```

---

## Review Checklist

The 7-category checklist applied across all modes and agents:

| Category | What to Check |
|---|---|
| **Correctness** | Logic errors, off-by-ones, null handling, edge cases, race conditions |
| **Type Safety** | Type mismatches, unsafe casts, `any` usage, missing generics |
| **Pattern Compliance** | Matches project conventions (naming, structure, error handling, imports) |
| **Security** | Injection, auth gaps, secret exposure, SSRF, path traversal, XSS |
| **Performance** | N+1 queries, missing indexes, unbounded loops, memory leaks, large payloads |
| **Completeness** | Missing tests, missing error handling, incomplete migrations, missing docs |
| **Maintainability** | Dead code, magic numbers, deep nesting, unclear naming, missing types |

## Severity Levels

| Severity | Meaning | Action |
|---|---|---|
| **CRITICAL** | Security vulnerability or data-loss risk | BLOCK — must fix before merge |
| **HIGH** | Bug or logic error likely to cause issues | Should fix before merge |
| **MEDIUM** | Code-quality issue or missing best practice | Fix recommended |
| **LOW** | Style nit or minor suggestion | Optional |
| **NITPICK** | Pure style preference, no correctness/maintainability impact | Shown only in `--profile=assertive` (default); skipped in `--profile=chill` |

Every HIGH/CRITICAL finding must include all three: **precise line number** + **concrete failure scenario** + **why existing guards don't catch it**.

## Confidence Rule

Only report issues with confidence ≥ 80%:
- Critical: bugs, security, data loss
- Important: missing tests, quality problems, style violations
- Advisory: suggestions only when explicitly requested

## Edge Cases

- **No `gh` CLI (GitHub mode)** → fall back to local-only review, skip publish. Warn the user.
- **Missing BB credentials (Bitbucket mode)** → stop with instructions to set `BB_USERNAME` and `BB_APP_PASSWORD`.
- **Diverged branches** → suggest `git fetch origin && git rebase origin/<base>` before review.
- **Large PRs (>50 files)** → warn about scope. Review source first, then tests, then config/docs.
