# Marketplace reload verification

Verified 2026-08-10 21:08 CST（台灣時間） in the current Codex desktop session
after loading the marketplace from repository revision
`9c1876395f8593a80a76b483b6a188edab33d4cb` (the branch revision used for this
check, not a claim that it had already merged) with marketplace/plugin revision
`1.37.0`:

- The Skill catalog lists `jt-flow:jt-flow-one`.
- The Skill catalog lists `jt-flow:jt-flow-all`.
- No retired single-request `jt-flow` Skill is listed.
- No `/jt-flow` or `/jt-flow-all` command entry is listed.

The repository checkout independently contains `plugins/jt-flow/skills/jt-flow-one/SKILL.md`
and `plugins/jt-flow/skills/jt-flow-all/SKILL.md`, with no
`plugins/jt-flow/commands/` directory.
