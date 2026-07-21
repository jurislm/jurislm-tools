## 1. Rename the Skill entry point

- [x] 1.1 Rename `plugins/jt-flow/skills/jt-flow/SKILL.md` to `plugins/jt-flow/skills/jt-flow-one/SKILL.md` and set its frontmatter name to `jt-flow-one`.
- [x] 1.2 Update `plugins/jt-flow/skills/jt-flow-one/SKILL.md` and `plugins/jt-flow/skills/jt-flow-all/SKILL.md` so sibling routing uses `jt-flow-one`.

## 2. Update marketplace-facing references

- [x] 2.1 Update `plugins/jt-flow/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` descriptions to name `jt-flow-one`.
- [x] 2.2 Update `plugins/jt-flow/README.md`, `README.md`, and `CLAUDE.md` to name the single-request Skill `jt-flow-one`.

## 3. Validate the rename

- [x] 3.1 Run JSON parsing, `node scripts/check-version-sync.mjs`, and `openspec validate rename-jt-flow-single-skill --strict`.
- [x] 3.2 Verify the `jt-flow-one` Skill exists, the retired `skills/jt-flow/` path is absent, and current source and documentation do not route single-request work to `jt-flow`.
