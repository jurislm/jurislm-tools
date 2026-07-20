## 1. Convert the jt-flow plugin entry points

- [x] 1.1 Create `plugins/jt-flow/skills/jt-flow/SKILL.md` by migrating `plugins/jt-flow/commands/jt-flow.md`, replacing command frontmatter, `$ARGUMENTS`, and slash-command references with Skill frontmatter, natural-language trigger phrases, and a reference to the `jt-flow-all` Skill.
- [x] 1.2 Create `plugins/jt-flow/skills/jt-flow-all/SKILL.md` by migrating `plugins/jt-flow/commands/jt-flow-all.md`, replacing command frontmatter, `$ARGUMENTS`, and slash-command references with Skill frontmatter, natural-language trigger phrases, and a reference to the `jt-flow` Skill.
- [x] 1.3 Remove `plugins/jt-flow/commands/jt-flow.md` and `plugins/jt-flow/commands/jt-flow-all.md` after verifying their workflow content is present in the two new Skill files.
- [x] 1.4 Update `plugins/jt-flow/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to describe the two Skill entry points without advertising slash commands; do not edit release-managed version values.

## 2. Update current architecture documentation

- [x] 2.1 Update `CLAUDE.md` to classify `jt-flow` as a Skill plugin, name its two Skills, and preserve the external `superpowers:*` dependency note without slash-command wording.

## 3. Validate the conversion

- [x] 3.1 Run `jq . .claude-plugin/marketplace.json`, `jq . plugins/jt-flow/.claude-plugin/plugin.json`, and `node scripts/check-version-sync.mjs`.
- [x] 3.2 Verify the two Skill files exist, `plugins/jt-flow/commands/` does not exist, and current entry-point documentation has no `/jt-flow` references.
- [ ] 3.3 After the merged marketplace is reloaded, verify that Codex lists both new Skills and no longer offers the removed slash commands.
