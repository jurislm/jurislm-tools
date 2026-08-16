# Design

## Evidence

| id | readback | expected | on-failure |
| --- | --- | --- | --- |
| D1 | `coderabbit review --help` | option list contains `--committed`; `--type` appears nowhere | stop — the whole change rests on this |
| D2 | `grep -rn -- '--type committed' . --exclude-dir=.git --exclude-dir=node_modules` | hits only in `openspec/changes/archive/**` (historical counter-example) and this change's own artifacts (which quote what is being fixed) | stop — any other hit is an unfixed site |

D1 was run on 2026-08-16 (Taiwan time) against CLI 0.7.3; the option list is in
`verification-logs/2026-08-16-cli-flag-readback.md`.

⚠️ **D2's scope is repo-wide on purpose, and the first draft got this wrong.**
It originally searched `plugins/` only, while the conclusion it was supposed to
support was "the fix is complete". A search narrower than its own claim cannot
fail when the claim is false — and it did not: `CLAUDE.md:216` carried the same
stale command, with no caveat, in the file that loads before any skill. An
enumerating claim has to state its search range, and that range has to be at
least as wide as what the claim asserts.

## Decision — correct the prescribed command, and say where the truth lives

**Chosen.** Replace the flag at both sites, and attach one sentence stating the
spelling comes from `--help` at invocation time.

The one sentence is the part that matters beyond today. A CLI flag is external
state this repository does not control, so a literal command in a skill is a
snapshot that expires silently — nothing here fails when the CLI renames a flag,
and the failure surfaces only in the one place that cannot absorb it (a spent,
non-retryable fallback). Correcting the spelling alone fixes the current
instance and leaves the mechanism intact.

`:238` already requires the `--help` preflight, so the instruction is not new;
what is new is putting it where the copyable command is, because a reader who
copies line 247 has no reason to scroll up.

**Rejected: delete the concrete command and keep only "read `--help`".** The
command carries more than the flag spelling — `--agent` for structured output
and `--base <remote>/main` for the range. Removing it would trade a stale flag
for an under-specified invocation.

**Rejected: leave the authority and keep patching downstream.** That is what
`jurislm/entire` is doing now, and it multiplies with every repo that adopts
`jt-flow`. The counter-example note there is a symptom, not a fix.

## Scope boundary

Nothing else in the CodeRabbit lane moves. The budget, the routing, the
terminal-state definition, and the authorization and disclosure contract are
untouched — this change corrects one factual error and nothing else.
