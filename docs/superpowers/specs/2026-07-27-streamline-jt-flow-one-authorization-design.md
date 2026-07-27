# Streamline JT Flow One Authorization Design

## Goal

Make proposal GO the only normal user checkpoint in `jt-flow-one`, then carry
the approved change automatically through implementation, PR, merge,
verification, and archive.

## Authorization model

Explicit invocation authorizes repository-scoped discovery, tracking-issue
creation or update, and OpenSpec proposal preparation. Proposal GO authorizes
the remaining end-to-end delivery chain within the approved scope.

After GO, the workflow pauses only for genuine unresolved target ambiguity,
material scope or architecture change, secrets or sensitive payloads, missing
credentials or enforced platform approval, an unapproved destructive production
mutation, or risky rollback and recovery.

## Queue behavior

Each delegated `jt-flow-all` item retains one proposal GO. After that GO, the
item runs to a terminal result under the same bounded exceptions. A previously
approved active proposal does not require a duplicate GO merely because it was
placed in a queue.

## Preserved safeguards

CodeRabbit disclosure, secret scanning, review budgets, CI, mergeability,
deployment verification, and archive verification remain mandatory. The change
removes redundant authorization prompts rather than verification gates.

## Testing

A focused policy test will require the positive authorization language,
automatic post-GO delivery actions, bounded exception categories, and aligned
queue behavior. It will reject the old project-dependent merge-authorization
wording.
