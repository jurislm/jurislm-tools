# Marketplace reload verification

Verified 2026-08-10 21:08 CST（台灣時間） in the current Codex desktop session
after the merged marketplace was loaded:

- The Skill catalog lists `jt-flow:jt-flow-one`.
- The Skill catalog lists `jt-flow:jt-flow-all`.
- No retired single-request `jt-flow` Skill is listed.
- No `/jt-flow` or `/jt-flow-all` command entry is listed.

The repository checkout independently contains `plugins/jt-flow/skills/jt-flow-one/SKILL.md`
and `plugins/jt-flow/skills/jt-flow-all/SKILL.md`, with no
`plugins/jt-flow/commands/` directory.
