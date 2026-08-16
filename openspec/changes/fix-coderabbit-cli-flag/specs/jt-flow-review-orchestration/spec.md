# jt-flow-review-orchestration delta

## ADDED Requirements

### Requirement: External tool invocations name their source of truth

Where the workflow prescribes a literal command for a tool this repository does
not version **and a rejected invocation is not recoverable** — the CodeRabbit
CLI fallback is the only such site today — the prescribed text SHALL be
accompanied by the readback that establishes its current form, and the workflow
SHALL perform that readback at invocation time rather than trusting the written
command. A flag spelling copied from any document, including this repository's
own skills, its own `CLAUDE.md`, and its archived changes, SHALL NOT be used as
the authority.

Both conditions are load-bearing. Commands for tools whose failures are
retryable — `git`, `gh`, `npm` — are outside this requirement; a rejected
argument there costs one re-run. The CodeRabbit CLI is different: it is invoked
only after the GitHub App has already reached a terminal outcome, and calling it
exhausts the single fallback whatever it returns, so an invocation rejected for
an unknown flag leaves the external review budget spent and the gate
unsatisfiable. A prescribed command that has silently expired therefore fails at
the one moment the workflow cannot absorb it.

#### Scenario: A document prescribes the non-recoverable command

- **WHEN** any file in this repository writes a literal `coderabbit review`
  invocation — a skill, `CLAUDE.md`, or any other guidance a reader can copy
- **THEN** the same passage names `coderabbit review --help` as the authority
  for its flag spelling
- **AND** no file in the repository, excluding archived changes and the change
  that performs the correction, carries a flag spelling the current CLI rejects

#### Scenario: The prescribed CLI command is about to be run

- **WHEN** the workflow reaches the CodeRabbit CLI fallback
- **THEN** it reads the current flag spelling from `coderabbit review --help`
- **AND** it uses that spelling rather than the command written in any skill,
  document, or archived change

#### Scenario: The readback disagrees with the prescribed command

- **WHEN** `coderabbit review --help` does not list a flag that a prescribed
  command uses
- **THEN** the workflow uses the spelling from the readback, does not spend the
  fallback on the stale form, and the prescribed command in the skill is
  corrected
