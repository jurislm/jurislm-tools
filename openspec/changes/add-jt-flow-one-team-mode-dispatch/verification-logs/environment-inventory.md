# Environment inventory

Date: 2026-08-06

## Repository and workflow

- Repository: `jurislm/jurislm-tools`
- Default branch: `main`
- Working branch: `claude/agent-teams-orchestration-a2c682` (pre-existing
  session worktree at `.claude/worktrees/agent-teams-orchestration-a2c682`)
- Remote: `origin`, fetch and push both
  `https://github.com/jurislm/jurislm-tools.git`
- OpenSpec: installed under `openspec/`
- Branch model: GitHub Flow, no `develop` branch (`git branch -a` confirms;
  `.drone.yml` only targets `main`)
- `gh repo view`: `viewerPermission: ADMIN`

## Existing implementation

- `plugins/jt-flow/skills/jt-flow-one/SKILL.md` — its two existing
  multi-agent dispatch points (three-tool research, code-review dispatch)
  are currently anonymous. `systematic-debugging` and an Opus consult are
  only ever invoked in-session, not dispatched as a separate agent — an
  initial assumption otherwise was corrected while writing `tasks.md` (see
  commit `094c671`).
- `plugins/jt-flow/skills/jt-flow-all/SKILL.md` — its own coordinator/owner
  dispatch is out of scope for this change and is not touched.
- `scripts/jt-flow-authorization-policy.test.mjs`,
  `scripts/jt-flow-queue-execution.test.mjs`,
  `scripts/jt-flow-review-policy.test.mjs` — existing sibling test files;
  this change adds a fourth, `jt-flow-team-mode-dispatch.test.mjs`,
  following the same pattern.
- `openspec/specs/jt-flow-authorization`, `jt-flow-queue-delegation`,
  `jt-flow-review-orchestration` — none of the three existing jt-flow
  capability specs cover dispatch mechanism; this change adds a new,
  orthogonal capability (`jt-flow-one-team-mode-dispatch`) rather than
  modifying any of them.

## Concurrent and historical changes

- Active: `convert-jt-flow-commands-to-skills`, `rename-jt-flow-single-skill`
  — both about naming/entry-point format, unrelated to dispatch mechanism.
- No archived change addresses agent dispatch mode; the closest prior work
  (`cap-jt-flow-review-budgets`, `streamline-jt-flow-one-authorization`)
  covers review budgets and authorization checkpoints, both left unchanged
  by this change.
- GitHub issue search (`gh issue list --state all`) for "team", "agent
  teams", "team mode" found no related existing issue; created #192.

## External research

- Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):
  confirmed working in this session — env var reads `1`,
  `SendMessage`/`TaskCreate`/`TaskList` tool schemas load via `ToolSearch`,
  and a live named background agent was spawned and completed successfully.
- Codex (`developers.openai.com/codex/concepts/subagents`, fetched
  directly): native mechanism is hub-and-spoke "Subagent workflow" — no
  peer-to-peer messaging, no shared task list. `/agent` inspection/steering
  routes through the parent thread only.
- Three community signals checked for a possible shipped Codex "team mode"
  and found not to hold up: GitHub PR `openai/codex#13155` closed unmerged
  (`mergedAt: null`); GitHub issue `openai/codex#21027` open as of
  2026-08-06, explicitly stating no shared inbox exists; a blog post
  describing "native team mode" turned out to be a personal fork.

## Validation surface

- `scripts/jt-flow-team-mode-dispatch.test.mjs` (new)
- `npm run validate`
- `claude plugin validate .`
- `openspec validate add-jt-flow-one-team-mode-dispatch --strict`
