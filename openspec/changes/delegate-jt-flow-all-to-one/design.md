## Context

`jt-flow-all` currently contains its own Phase 2–9 copy of the complete single-request delivery workflow, while `jt-flow-one` defines the same responsibility. The queue Skill should coordinate multiple delivery requests, not maintain a competing implementation of their lifecycle.

## Goals / Non-Goals

**Goals:**

- Keep queue inventory, prioritization, sequence presentation, and queue-level GO in `jt-flow-all`.
- Directly invoke `jt-flow-one` for every confirmed queue item and wait for completion before advancing.
- Preserve each invoked `jt-flow-one` run's own proposal and approval gates.

**Non-Goals:**

- Change `jt-flow-one` or bypass its safeguards.
- Add parallel processing, a new tool API, or a compatibility copy of the removed phases.

## Decisions

### Queue Skill delegates instead of restating delivery phases

After ranking is confirmed, `jt-flow-all` directly invokes `jt-flow-one` with the next issue's identifier, repository, and queue-order context. It does not merely ask the user to invoke the sibling Skill, and it does not repeat the sibling's procedure.

### One item at a time

`jt-flow-all` waits for the delegated `jt-flow-one` run to reach its terminal result before starting the next ranked item. A delegated run that pauses for its own user GO pauses the queue at that item.

### The delegate owns per-item safety gates

`jt-flow-one` retains ownership of issue confirmation, OpenSpec proposal, implementation, review, merge, deployment, and archive. Queue-level GO approves ordering only; it does not bypass a per-item gate.

## Risks / Trade-offs

- [Host cannot perform a literal Skill call] → State the required direct delegation semantics and pass the queue context; do not duplicate the workflow as a fallback.
- [Queue progress is unclear after a paused item] → Require an explicit per-item terminal result before advancing.
- [A future edit changes only one workflow] → The single owner removes duplicated lifecycle content.

## Migration Plan

1. Replace `jt-flow-all` Phase 2–9 and its duplicate synchronization rule with an ordered delegation loop.
2. Validate the queue Skill contains inventory and delegation only, while `jt-flow-one` remains the delivery owner.

Rollback is a revert of the implementation commit.

## Open Questions

None.
