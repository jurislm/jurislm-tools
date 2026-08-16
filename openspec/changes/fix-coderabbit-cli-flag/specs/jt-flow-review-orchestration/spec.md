# jt-flow-review-orchestration delta

## ADDED Requirements

### Requirement: External tool invocations name their source of truth

Where the workflow prescribes a literal command for a tool this repository does
not version — the CodeRabbit CLI is the current instance — the prescribed text
SHALL be accompanied by the readback that establishes its current form, and the
workflow SHALL perform that readback at invocation time rather than trusting the
written command. A flag spelling copied from any document, including this
repository's own skills and its archived changes, SHALL NOT be used as the
authority.

This applies specifically where a failed invocation is not recoverable. The
CodeRabbit CLI is invoked only after the GitHub App has already reached a
terminal outcome, and calling it exhausts the single fallback whatever it
returns, so an invocation rejected for an unknown flag leaves the external
review budget spent and the gate unsatisfiable. A prescribed command that has
silently expired therefore fails at the one moment the workflow cannot absorb
it.

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
