## Phase 1: Import the three plugins

- [x] 1.1 Add `plugins/ai-audio-analysis/.claude-plugin/plugin.json`, `plugins/ai-audio-analysis/README.md`, and `plugins/ai-audio-analysis/skills/ai-audio-analysis/SKILL.md` from the verified source package.
- [x] 1.2 Add `plugins/suno-audio-download/.claude-plugin/plugin.json`, `plugins/suno-audio-download/README.md`, and `plugins/suno-audio-download/skills/suno-audio-download/SKILL.md` from the verified source package.
- [x] 1.3 Add `plugins/minimax-design/.claude-plugin/plugin.json`, `plugins/minimax-design/README.md`, and the complete `plugins/minimax-design/skills/minimax-design-video/` tree from the verified source package.

## Phase 2: Register and document the marketplace inventory

- [x] 2.1 Append the three local entries to `.claude-plugin/marketplace.json` without moving `coolify` from entry zero.
- [x] 2.2 Add the three plugin manifests to `release-please-config.json` version synchronization.
- [x] 2.3 Update `README.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` so all three `plugin@jurislm-tools` identifiers and the current inventory are documented.

## Phase 3: Validate and record

- [x] 3.1 Run the MiniMax reference completeness test, repository validation, native Claude validation, and strict OpenSpec validation.
- [x] 3.2 Read back marketplace names, manifest names, README identifiers, source checksums, and final Git status; record the verification result before handoff.
